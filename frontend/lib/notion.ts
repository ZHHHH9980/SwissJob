import { Client } from '@notionhq/client'
import { getNotionClientFromSettings } from './app-settings'
import { readSettings } from './settings'

// ---------------------------------------------------------------------------
// Types matching Prisma models (adapted for Notion-backed storage)
// ---------------------------------------------------------------------------

export type Company = {
  id: string
  name: string
  website?: string
  description?: string
  jobDescription?: string
  createdAt: string
}

export type Interview = {
  id: string
  companyId: string
  position: string
  date?: string
  status: string
  notes?: string
  transcript?: string
  aiAnalysis?: string
  createdAt: string
}

export type Skill = {
  id: string
  name: string
  category?: string
  level?: string
  notes?: string
  createdAt: string
}

export type MockInterview = {
  id: string
  question: string
  answer?: string
  feedback?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AI_ANALYSIS_DELIMITER = '\n---AI_ANALYSIS---\n'
const CHUNK_SIZE = 2000

// ---------------------------------------------------------------------------
// Rate-limit retry helper
// ---------------------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e?.status === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000))
        continue
      }
      throw err
    }
  }
  throw new Error('unreachable')
}

// ---------------------------------------------------------------------------
// Long-text page content helpers
// ---------------------------------------------------------------------------

async function setPageContent(notion: Client, pageId: string, text: string): Promise<void> {
  const existing = await withRetry(() =>
    notion.blocks.children.list({ block_id: pageId })
  )
  for (const block of existing.results) {
    await withRetry(() =>
      notion.blocks.delete({ block_id: (block as { id: string }).id })
    )
  }

  if (!text) return

  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }

  await withRetry(() =>
    notion.blocks.children.append({
      block_id: pageId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      children: chunks.map(chunk => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{ type: 'text' as const, text: { content: chunk } }],
        },
      })) as any,
    })
  )
}

async function getPageContent(notion: Client, pageId: string): Promise<string> {
  const response = await withRetry(() =>
    notion.blocks.children.list({ block_id: pageId })
  )

  const parts: string[] = []
  for (const block of response.results) {
    const b = block as {
      type: string
      paragraph?: { rich_text: Array<{ plain_text: string }> }
    }
    if (b.type === 'paragraph' && b.paragraph) {
      parts.push(b.paragraph.rich_text.map(rt => rt.plain_text).join(''))
    }
  }
  return parts.join('')
}

// ---------------------------------------------------------------------------
// Property extraction helpers
// ---------------------------------------------------------------------------

type NotionPage = {
  id: string
  created_time: string
  properties: Record<string, unknown>
}

function getPropTitle(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { title?: Array<{ plain_text: string }> } | undefined
  return p?.title?.map(t => t.plain_text).join('') ?? ''
}

function getPropRichText(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { rich_text?: Array<{ plain_text: string }> } | undefined
  return p?.rich_text?.map(t => t.plain_text).join('') ?? ''
}

function getPropSelect(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { select?: { name: string } } | undefined
  return p?.select?.name ?? ''
}

function getPropUrl(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { url?: string | null } | undefined
  return p?.url ?? ''
}

function getPropDate(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { date?: { start: string } | null } | undefined
  return p?.date?.start ?? ''
}

function getPropRelationId(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { relation?: Array<{ id: string }> } | undefined
  return p?.relation?.[0]?.id ?? ''
}

// Shorthand for building Notion property values (typed as any to avoid SDK union complexity)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>

// ---------------------------------------------------------------------------
// Company CRUD
// ---------------------------------------------------------------------------

function pageToCompany(page: NotionPage): Company {
  const props = page.properties
  return {
    id: page.id,
    name: getPropTitle(props, 'Name'),
    website: getPropUrl(props, 'Website') || undefined,
    description: getPropRichText(props, 'Description') || undefined,
    createdAt: page.created_time,
  }
}

export async function getCompanies(): Promise<Company[]> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.companies
  if (!dbId) throw new Error('Notion companies DB not configured')

  const response = await withRetry(() =>
    notion.dataSources.query({ data_source_id: dbId })
  )

  return Promise.all(
    response.results.map(async page => {
      const company = pageToCompany(page as unknown as NotionPage)
      const content = await getPageContent(notion, page.id)
      if (content) company.jobDescription = content
      return company
    })
  )
}

export async function getCompany(id: string): Promise<Company | null> {
  const notion = await getNotionClientFromSettings()
  try {
    const page = await withRetry(() => notion.pages.retrieve({ page_id: id }))
    const company = pageToCompany(page as unknown as NotionPage)
    const content = await getPageContent(notion, id)
    if (content) company.jobDescription = content
    return company
  } catch {
    return null
  }
}

export async function createCompany(
  data: Omit<Company, 'id' | 'createdAt'>
): Promise<Company> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.companies
  if (!dbId) throw new Error('Notion companies DB not configured')

  const properties: Props = {
    Name: { title: [{ text: { content: data.name } }] },
  }
  if (data.website) properties['Website'] = { url: data.website }
  if (data.description)
    properties['Description'] = { rich_text: [{ text: { content: data.description.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.create({
      parent: { data_source_id: dbId },
      properties,
    })
  )

  if (data.jobDescription) {
    await setPageContent(notion, page.id, data.jobDescription)
  }

  const company = pageToCompany(page as unknown as NotionPage)
  if (data.jobDescription) company.jobDescription = data.jobDescription
  return company
}

export async function updateCompany(
  id: string,
  data: Partial<Omit<Company, 'id' | 'createdAt'>>
): Promise<Company> {
  const notion = await getNotionClientFromSettings()

  const properties: Props = {}
  if (data.name !== undefined)
    properties['Name'] = { title: [{ text: { content: data.name } }] }
  if (data.website !== undefined)
    properties['Website'] = { url: data.website || null }
  if (data.description !== undefined)
    properties['Description'] = { rich_text: [{ text: { content: data.description.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.update({ page_id: id, properties })
  )

  if (data.jobDescription !== undefined) {
    await setPageContent(notion, id, data.jobDescription)
  }

  const company = pageToCompany(page as unknown as NotionPage)
  const content = await getPageContent(notion, id)
  if (content) company.jobDescription = content
  return company
}

export async function deleteCompany(id: string): Promise<void> {
  const notion = await getNotionClientFromSettings()
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }))
}

// ---------------------------------------------------------------------------
// Interview CRUD
// ---------------------------------------------------------------------------

function buildTranscriptContent(transcript?: string, aiAnalysis?: string): string {
  if (transcript && aiAnalysis) return transcript + AI_ANALYSIS_DELIMITER + aiAnalysis
  if (transcript) return transcript
  if (aiAnalysis) return AI_ANALYSIS_DELIMITER + aiAnalysis
  return ''
}

function splitPageContent(content: string): { transcript?: string; aiAnalysis?: string } {
  if (!content) return {}
  const delimIdx = content.indexOf(AI_ANALYSIS_DELIMITER)
  if (delimIdx !== -1) {
    return {
      transcript: content.slice(0, delimIdx),
      aiAnalysis: content.slice(delimIdx + AI_ANALYSIS_DELIMITER.length),
    }
  }
  return { transcript: content }
}

function pageToInterview(page: NotionPage): Interview {
  const props = page.properties
  return {
    id: page.id,
    companyId: getPropRelationId(props, 'Company'),
    position: getPropTitle(props, 'Position'),
    date: getPropDate(props, 'Date') || undefined,
    status: getPropSelect(props, 'Status') || 'scheduled',
    notes: getPropRichText(props, 'Notes') || undefined,
    createdAt: page.created_time,
  }
}

export async function getInterviews(companyId?: string): Promise<Interview[]> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.interviews
  if (!dbId) throw new Error('Notion interviews DB not configured')

  const filter = companyId
    ? { property: 'Company', relation: { contains: companyId } }
    : undefined

  const response = await withRetry(() =>
    notion.dataSources.query({ data_source_id: dbId, ...(filter ? { filter } : {}) })
  )

  return Promise.all(
    response.results.map(async page => {
      const interview = pageToInterview(page as unknown as NotionPage)
      const content = await getPageContent(notion, page.id)
      const { transcript, aiAnalysis } = splitPageContent(content)
      if (transcript !== undefined) interview.transcript = transcript
      if (aiAnalysis !== undefined) interview.aiAnalysis = aiAnalysis
      return interview
    })
  )
}

export async function getInterview(id: string): Promise<Interview | null> {
  const notion = await getNotionClientFromSettings()
  try {
    const page = await withRetry(() => notion.pages.retrieve({ page_id: id }))
    const interview = pageToInterview(page as unknown as NotionPage)
    const content = await getPageContent(notion, id)
    const { transcript, aiAnalysis } = splitPageContent(content)
    if (transcript !== undefined) interview.transcript = transcript
    if (aiAnalysis !== undefined) interview.aiAnalysis = aiAnalysis
    return interview
  } catch {
    return null
  }
}

export async function createInterview(
  data: Omit<Interview, 'id' | 'createdAt'>
): Promise<Interview> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.interviews
  if (!dbId) throw new Error('Notion interviews DB not configured')

  const properties: Props = {
    Position: { title: [{ text: { content: data.position } }] },
    Company: { relation: [{ id: data.companyId }] },
    Status: { select: { name: data.status } },
  }
  if (data.date) properties['Date'] = { date: { start: data.date } }
  if (data.notes)
    properties['Notes'] = { rich_text: [{ text: { content: data.notes.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.create({ parent: { data_source_id: dbId }, properties })
  )

  const combined = buildTranscriptContent(data.transcript, data.aiAnalysis)
  if (combined) await setPageContent(notion, page.id, combined)

  const interview = pageToInterview(page as unknown as NotionPage)
  if (data.transcript !== undefined) interview.transcript = data.transcript
  if (data.aiAnalysis !== undefined) interview.aiAnalysis = data.aiAnalysis
  return interview
}

export async function updateInterview(
  id: string,
  data: Partial<Omit<Interview, 'id' | 'createdAt'>>
): Promise<Interview> {
  const notion = await getNotionClientFromSettings()

  const properties: Props = {}
  if (data.position !== undefined)
    properties['Position'] = { title: [{ text: { content: data.position } }] }
  if (data.companyId !== undefined)
    properties['Company'] = { relation: [{ id: data.companyId }] }
  if (data.status !== undefined)
    properties['Status'] = { select: { name: data.status } }
  if (data.date !== undefined)
    properties['Date'] = data.date ? { date: { start: data.date } } : { date: null }
  if (data.notes !== undefined)
    properties['Notes'] = { rich_text: [{ text: { content: data.notes.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.update({ page_id: id, properties })
  )

  if (data.transcript !== undefined || data.aiAnalysis !== undefined) {
    const existing = await getInterview(id)
    const transcript = data.transcript !== undefined ? data.transcript : existing?.transcript ?? ''
    const aiAnalysis = data.aiAnalysis !== undefined ? data.aiAnalysis : existing?.aiAnalysis ?? ''
    await setPageContent(notion, id, buildTranscriptContent(transcript, aiAnalysis))
  }

  const interview = pageToInterview(page as unknown as NotionPage)
  const content = await getPageContent(notion, id)
  const { transcript, aiAnalysis } = splitPageContent(content)
  if (transcript !== undefined) interview.transcript = transcript
  if (aiAnalysis !== undefined) interview.aiAnalysis = aiAnalysis
  return interview
}

export async function deleteInterview(id: string): Promise<void> {
  const notion = await getNotionClientFromSettings()
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }))
}

// ---------------------------------------------------------------------------
// Skill CRUD
// ---------------------------------------------------------------------------

function pageToSkill(page: NotionPage): Skill {
  const props = page.properties
  return {
    id: page.id,
    name: getPropTitle(props, 'Name'),
    category: getPropSelect(props, 'Category') || undefined,
    level: getPropSelect(props, 'Level') || undefined,
    notes: getPropRichText(props, 'Notes') || undefined,
    createdAt: page.created_time,
  }
}

export async function getSkills(): Promise<Skill[]> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.skills
  if (!dbId) throw new Error('Notion skills DB not configured')

  const response = await withRetry(() =>
    notion.dataSources.query({ data_source_id: dbId })
  )
  return response.results.map(page => pageToSkill(page as unknown as NotionPage))
}

export async function createSkill(
  data: Omit<Skill, 'id' | 'createdAt'>
): Promise<Skill> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.skills
  if (!dbId) throw new Error('Notion skills DB not configured')

  const properties: Props = {
    Name: { title: [{ text: { content: data.name } }] },
  }
  if (data.category) properties['Category'] = { select: { name: data.category } }
  if (data.level) properties['Level'] = { select: { name: data.level } }
  if (data.notes)
    properties['Notes'] = { rich_text: [{ text: { content: data.notes.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.create({ parent: { data_source_id: dbId }, properties })
  )
  return pageToSkill(page as unknown as NotionPage)
}

export async function updateSkill(
  id: string,
  data: Partial<Omit<Skill, 'id' | 'createdAt'>>
): Promise<Skill> {
  const notion = await getNotionClientFromSettings()

  const properties: Props = {}
  if (data.name !== undefined)
    properties['Name'] = { title: [{ text: { content: data.name } }] }
  if (data.category !== undefined)
    properties['Category'] = data.category ? { select: { name: data.category } } : { select: null }
  if (data.level !== undefined)
    properties['Level'] = data.level ? { select: { name: data.level } } : { select: null }
  if (data.notes !== undefined)
    properties['Notes'] = { rich_text: [{ text: { content: data.notes.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.update({ page_id: id, properties })
  )
  return pageToSkill(page as unknown as NotionPage)
}

export async function deleteSkill(id: string): Promise<void> {
  const notion = await getNotionClientFromSettings()
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }))
}

// ---------------------------------------------------------------------------
// MockInterview CRUD
// ---------------------------------------------------------------------------

function pageToMockInterview(page: NotionPage): MockInterview {
  const props = page.properties
  return {
    id: page.id,
    question: getPropTitle(props, 'Question'),
    answer: getPropRichText(props, 'Answer') || undefined,
    feedback: getPropRichText(props, 'Feedback') || undefined,
    createdAt: page.created_time,
  }
}

export async function getMockInterviews(): Promise<MockInterview[]> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.mockInterviews
  if (!dbId) throw new Error('Notion mockInterviews DB not configured')

  const response = await withRetry(() =>
    notion.dataSources.query({ data_source_id: dbId })
  )
  return response.results.map(page => pageToMockInterview(page as unknown as NotionPage))
}

export async function createMockInterview(
  data: Omit<MockInterview, 'id' | 'createdAt'>
): Promise<MockInterview> {
  const notion = await getNotionClientFromSettings()
  const settings = await readSettings()
  const dbId = settings.notionDBs.mockInterviews
  if (!dbId) throw new Error('Notion mockInterviews DB not configured')

  const properties: Props = {
    Question: { title: [{ text: { content: data.question } }] },
  }
  if (data.answer)
    properties['Answer'] = { rich_text: [{ text: { content: data.answer.slice(0, 2000) } }] }
  if (data.feedback)
    properties['Feedback'] = { rich_text: [{ text: { content: data.feedback.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.create({ parent: { data_source_id: dbId }, properties })
  )
  return pageToMockInterview(page as unknown as NotionPage)
}

export async function updateMockInterview(
  id: string,
  data: Partial<Omit<MockInterview, 'id' | 'createdAt'>>
): Promise<MockInterview> {
  const notion = await getNotionClientFromSettings()

  const properties: Props = {}
  if (data.question !== undefined)
    properties['Question'] = { title: [{ text: { content: data.question } }] }
  if (data.answer !== undefined)
    properties['Answer'] = { rich_text: [{ text: { content: data.answer.slice(0, 2000) } }] }
  if (data.feedback !== undefined)
    properties['Feedback'] = { rich_text: [{ text: { content: data.feedback.slice(0, 2000) } }] }

  const page = await withRetry(() =>
    notion.pages.update({ page_id: id, properties })
  )
  return pageToMockInterview(page as unknown as NotionPage)
}

export async function deleteMockInterview(id: string): Promise<void> {
  const notion = await getNotionClientFromSettings()
  await withRetry(() => notion.pages.update({ page_id: id, archived: true }))
}

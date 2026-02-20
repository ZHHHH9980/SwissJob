# Notion Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace SQLite/Prisma with Notion as the primary database using @notionhq/client for CRUD and Notion MCP for AI-driven writes.

**Architecture:** App settings (AI keys, Notion credentials, resume) stored in data/settings.json. All business data (companies, interviews, skills, mock interviews) stored in Notion databases. lib/notion.ts service layer replaces lib/prisma.ts.

**Tech Stack:** Next.js 14, @notionhq/client, TypeScript, Tailwind CSS

---

## Task 1: Install @notionhq/client

**Files to modify:** `frontend/package.json`

### Commands

```bash
cd /Users/a1/Documents/interview-helper/frontend && npm install @notionhq/client
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

Confirm `@notionhq/client` appears in `frontend/package.json` dependencies.

### Commit

```bash
cd /Users/a1/Documents/interview-helper && git add frontend/package.json frontend/package-lock.json && git commit -m "feat: install @notionhq/client"
```

---

## Task 2: Create lib/settings.ts and data/settings.json

**Files to create:**
- `frontend/lib/settings.ts`
- `data/settings.json`

**Files to modify:** `.gitignore`

### `frontend/lib/settings.ts`

```typescript
import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const SETTINGS_PATH = join(process.cwd(), '..', 'data', 'settings.json')

export type NotionDBs = {
  companies: string
  interviews: string
  skills: string
  mockInterviews: string
}

export type AppSettings = {
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  whisperMode: string
  whisperApiUrl: string
  whisperModel: string
  notionApiToken: string
  notionDBs: NotionDBs
  resumePath: string
  resumeText: string
}

const DEFAULT_SETTINGS: AppSettings = {
  aiBaseUrl: 'https://api.openai.com/v1',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  whisperMode: 'none',
  whisperApiUrl: 'http://localhost:9000',
  whisperModel: 'whisper-1',
  notionApiToken: '',
  notionDBs: { companies: '', interviews: '', skills: '', mockInterviews: '' },
  resumePath: '',
  resumeText: ''
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, 'utf-8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function writeSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readSettings()
  const next: AppSettings = {
    ...current,
    ...updates,
    notionDBs: updates.notionDBs
      ? { ...current.notionDBs, ...updates.notionDBs }
      : current.notionDBs
  }
  await mkdir(join(process.cwd(), '..', 'data'), { recursive: true })
  await writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2), 'utf-8')
  return next
}
```

### `data/settings.json`

```json
{
  "aiBaseUrl": "https://api.openai.com/v1",
  "aiApiKey": "",
  "aiModel": "gpt-4o-mini",
  "whisperMode": "none",
  "whisperApiUrl": "http://localhost:9000",
  "whisperModel": "whisper-1",
  "notionApiToken": "",
  "notionDBs": {
    "companies": "",
    "interviews": "",
    "skills": "",
    "mockInterviews": ""
  },
  "resumePath": "",
  "resumeText": ""
}
```

### `.gitignore` addition

Add the following line to the root `.gitignore`:

```
data/settings.json
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/lib/settings.ts data/settings.json .gitignore && git commit -m "feat: add lib/settings.ts and data/settings.json, replace Prisma AppSettings+User"
```

---

## Task 3: Rewrite lib/app-settings.ts to use settings.ts

**Files to modify:** `frontend/lib/app-settings.ts`

Remove the Prisma import and `getOrCreateAppSettings`. Replace with `readSettings()`. Add `getNotionClient()`. Keep `getOpenAIClient()` and `getWhisperSettings()` signatures identical.

### `frontend/lib/app-settings.ts`

```typescript
import OpenAI from 'openai'
import { Client } from '@notionhq/client'
import { readSettings } from './settings'

export type WhisperMode = 'none' | 'api' | 'local'

export async function getOpenAIClient() {
  const settings = await readSettings()
  const apiKey = (settings.aiApiKey || '').trim()

  if (!apiKey) {
    throw new Error('AI API key not configured')
  }

  return {
    settings,
    client: new OpenAI({
      apiKey,
      baseURL: (settings.aiBaseUrl || 'https://api.openai.com/v1').trim()
    })
  }
}

export async function getWhisperSettings() {
  const settings = await readSettings()
  return {
    mode: (settings.whisperMode || 'none') as WhisperMode,
    apiUrl: (settings.whisperApiUrl || 'http://localhost:9000').trim(),
    model: (settings.whisperModel || 'whisper-1').trim(),
    aiApiKey: (settings.aiApiKey || '').trim(),
    aiBaseUrl: (settings.aiBaseUrl || 'https://api.openai.com/v1').trim()
  }
}

export async function getNotionClient(): Promise<Client> {
  const settings = await readSettings()
  const token = (settings.notionApiToken || '').trim()
  if (!token) {
    throw new Error('Notion API token not configured')
  }
  return new Client({ auth: token })
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
cd /Users/a1/Documents/interview-helper && git add frontend/lib/app-settings.ts && git commit -m "feat: rewrite app-settings.ts to use settings.ts, remove Prisma dependency"
```

---

## Task 4: Rewrite /api/settings route

**Files to modify:** `frontend/app/api/settings/route.ts`

Remove Prisma. Use `readSettings`/`writeSettings`. Expose `notionApiToken` and `notionDBs` in GET and PATCH.

### `frontend/app/api/settings/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { readSettings, writeSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await readSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    const stringFields = ['aiBaseUrl', 'aiApiKey', 'aiModel', 'whisperMode', 'whisperApiUrl', 'whisperModel', 'notionApiToken', 'resumePath', 'resumeText']
    for (const field of stringFields) {
      if (typeof body[field] === 'string') {
        updates[field] = body[field].trim()
      }
    }

    if (body.notionDBs && typeof body.notionDBs === 'object') {
      updates.notionDBs = {
        ...(typeof body.notionDBs.companies === 'string' ? { companies: body.notionDBs.companies.trim() } : {}),
        ...(typeof body.notionDBs.interviews === 'string' ? { interviews: body.notionDBs.interviews.trim() } : {}),
        ...(typeof body.notionDBs.skills === 'string' ? { skills: body.notionDBs.skills.trim() } : {}),
        ...(typeof body.notionDBs.mockInterviews === 'string' ? { mockInterviews: body.notionDBs.mockInterviews.trim() } : {})
      }
    }

    const updated = await writeSettings(updates as Parameters<typeof writeSettings>[0])
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
cd /Users/a1/Documents/interview-helper && git add frontend/app/api/settings/route.ts && git commit -m "feat: rewrite /api/settings to use settings.ts, add Notion fields"
```

---

## Task 5: Create lib/notion.ts service layer

**Files to create:** `frontend/lib/notion.ts`

This is the core service layer. It replaces all Prisma calls for business data. Long text (JD, transcript, AI analysis, questions) is stored as Notion page content blocks since Notion property values are capped at 2000 characters. Rate limit (429) responses are retried up to 3 times with a 1-second delay.

### `frontend/lib/notion.ts`

```typescript
import { Client, isNotionClientError } from '@notionhq/client'
import { readSettings } from './settings'

// ---- Types ----

export type Company = {
  id: string
  name: string
  position: string
  jd: string
  skills: string[]
  matchScore: number | null
  status: string
  createdAt: string
  interviews?: Interview[]
  mockInterviews?: MockInterview[]
}

export type Interview = {
  id: string
  companyId: string
  round: number
  scheduledAt: string
  status: string
  transcript: string
  aiAnalysis: string
  createdAt: string
}

export type Skill = {
  id: string
  name: string
  category: string
  frequency: number
  firstSeen: string
  lastSeen: string
}

export type MockInterview = {
  id: string
  companyId: string
  questions: string
  createdAt: string
}

// ---- Client helpers ----

function getClient(): Client {
  // Note: token is read synchronously from a cached module-level variable
  // after Task 3 sets it up. For server-side Next.js routes, readSettings()
  // is called per-request via the exported async functions below.
  throw new Error('Use getClientAsync() instead')
}

async function getClientAsync(): Promise<Client> {
  const settings = await readSettings()
  const token = (settings.notionApiToken || '').trim()
  if (!token) throw new Error('Notion API token not configured')
  return new Client({ auth: token })
}

async function getDBIds() {
  const settings = await readSettings()
  return settings.notionDBs
}

// ---- Rate-limit retry ----

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const is429 =
        isNotionClientError(err) && err.status === 429
      if (is429 && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000))
        continue
      }
      throw err
    }
  }
  throw new Error('Unreachable')
}

// ---- Long text helpers ----

const CHUNK_SIZE = 2000

async function readPageContent(notion: Client, pageId: string): Promise<string> {
  return withRetry(async () => {
    const response = await notion.blocks.children.list({ block_id: pageId, page_size: 100 })
    return response.results
      .filter((b): b is Extract<typeof b, { type: string }> => 'type' in b)
      .filter((b) => b.type === 'paragraph')
      .map((b) => {
        const para = (b as { type: 'paragraph'; paragraph: { rich_text: Array<{ plain_text: string }> } }).paragraph
        return para.rich_text.map((rt) => rt.plain_text).join('')
      })
      .join('')
  })
}

async function writePageContent(notion: Client, pageId: string, text: string): Promise<void> {
  // Clear existing blocks first
  const existing = await withRetry(() =>
    notion.blocks.children.list({ block_id: pageId, page_size: 100 })
  )
  for (const block of existing.results) {
    await withRetry(() => notion.blocks.delete({ block_id: block.id }))
  }

  // Write new chunks
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
  }
  if (chunks.length === 0) return

  await withRetry(() =>
    notion.blocks.children.append({
      block_id: pageId,
      children: chunks.map((chunk) => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [{ type: 'text' as const, text: { content: chunk } }]
        }
      }))
    })
  )
}

// ---- Property extractors ----

type NotionPage = Awaited<ReturnType<Client['pages']['retrieve']>>

function getProp(page: NotionPage, name: string) {
  if (!('properties' in page)) return undefined
  return page.properties[name]
}

function titleText(page: NotionPage, name: string): string {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'title') return ''
  return prop.title.map((t) => t.plain_text).join('')
}

function richText(page: NotionPage, name: string): string {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'rich_text') return ''
  return prop.rich_text.map((t) => t.plain_text).join('')
}

function selectValue(page: NotionPage, name: string): string {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'select') return ''
  return prop.select?.name ?? ''
}

function numberValue(page: NotionPage, name: string): number | null {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'number') return null
  return prop.number
}

function multiSelectValues(page: NotionPage, name: string): string[] {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'multi_select') return []
  return prop.multi_select.map((s) => s.name)
}

function dateValue(page: NotionPage, name: string): string {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'date') return ''
  return prop.date?.start ?? ''
}

function relationIds(page: NotionPage, name: string): string[] {
  const prop = getProp(page, name)
  if (!prop || prop.type !== 'relation') return []
  return prop.relation.map((r) => r.id)
}

function createdTime(page: NotionPage): string {
  if ('created_time' in page) return page.created_time
  return ''
}

// ---- Company CRUD ----

export async function getCompanies(): Promise<Company[]> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const response = await withRetry(() =>
    notion.databases.query({
      database_id: dbs.companies,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    })
  )

  return Promise.all(
    response.results.map(async (page) => {
      const jd = await readPageContent(notion, page.id)
      return {
        id: page.id,
        name: titleText(page, 'Name'),
        position: richText(page, 'Position'),
        jd,
        skills: multiSelectValues(page, 'Skills'),
        matchScore: numberValue(page, 'Match Score'),
        status: selectValue(page, 'Status') || 'active',
        createdAt: createdTime(page)
      }
    })
  )
}

export async function getCompany(pageId: string): Promise<Company> {
  const notion = await getClientAsync()
  const page = await withRetry(() => notion.pages.retrieve({ page_id: pageId }))
  const jd = await readPageContent(notion, pageId)

  const [interviews, mockInterviews] = await Promise.all([
    getInterviews(pageId),
    getMockInterviews(pageId)
  ])

  return {
    id: page.id,
    name: titleText(page, 'Name'),
    position: richText(page, 'Position'),
    jd,
    skills: multiSelectValues(page, 'Skills'),
    matchScore: numberValue(page, 'Match Score'),
    status: selectValue(page, 'Status') || 'active',
    createdAt: createdTime(page),
    interviews,
    mockInterviews
  }
}

export async function createCompany(data: {
  name: string
  position: string
  jd: string
  skills?: string[]
  status?: string
}): Promise<Company> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const page = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: dbs.companies },
      properties: {
        Name: { title: [{ text: { content: data.name } }] },
        Position: { rich_text: [{ text: { content: data.position } }] },
        Status: { select: { name: data.status || 'active' } },
        Skills: {
          multi_select: (data.skills || []).map((s) => ({ name: s }))
        }
      }
    })
  )

  if (data.jd) {
    await writePageContent(notion, page.id, data.jd)
  }

  return getCompany(page.id)
}

export async function updateCompany(
  pageId: string,
  data: Partial<Company>
): Promise<Company> {
  const notion = await getClientAsync()

  const properties: Record<string, unknown> = {}
  if (data.name) properties['Name'] = { title: [{ text: { content: data.name } }] }
  if (data.position) properties['Position'] = { rich_text: [{ text: { content: data.position } }] }
  if (data.status) properties['Status'] = { select: { name: data.status } }
  if (data.skills) properties['Skills'] = { multi_select: data.skills.map((s) => ({ name: s })) }
  if (typeof data.matchScore === 'number') properties['Match Score'] = { number: data.matchScore }

  if (Object.keys(properties).length > 0) {
    await withRetry(() =>
      notion.pages.update({ page_id: pageId, properties: properties as Parameters<Client['pages']['update']>[0]['properties'] })
    )
  }

  if (data.jd !== undefined) {
    await writePageContent(notion, pageId, data.jd)
  }

  return getCompany(pageId)
}

export async function deleteCompany(pageId: string): Promise<void> {
  const notion = await getClientAsync()
  await withRetry(() => notion.pages.update({ page_id: pageId, archived: true }))
}

// ---- Interview CRUD ----

export async function getInterviews(companyId: string): Promise<Interview[]> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const response = await withRetry(() =>
    notion.databases.query({
      database_id: dbs.interviews,
      filter: { property: 'Company', relation: { contains: companyId } },
      sorts: [{ property: 'Round', direction: 'ascending' }]
    })
  )

  return Promise.all(
    response.results.map(async (page) => {
      const content = await readPageContent(notion, page.id)
      const [transcript, aiAnalysis] = content.split('\n---AI_ANALYSIS---\n')
      return {
        id: page.id,
        companyId: relationIds(page, 'Company')[0] ?? companyId,
        round: numberValue(page, 'Round') ?? 1,
        scheduledAt: dateValue(page, 'Scheduled At'),
        status: selectValue(page, 'Status') || 'scheduled',
        transcript: transcript ?? '',
        aiAnalysis: aiAnalysis ?? '',
        createdAt: createdTime(page)
      }
    })
  )
}

export async function createInterview(data: {
  companyId: string
  round: number
  scheduledAt: string
}): Promise<Interview> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const page = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: dbs.interviews },
      properties: {
        Company: { relation: [{ id: data.companyId }] },
        Round: { number: data.round },
        'Scheduled At': { date: { start: data.scheduledAt } },
        Status: { select: { name: 'scheduled' } }
      }
    })
  )

  return {
    id: page.id,
    companyId: data.companyId,
    round: data.round,
    scheduledAt: data.scheduledAt,
    status: 'scheduled',
    transcript: '',
    aiAnalysis: '',
    createdAt: createdTime(page)
  }
}

export async function updateInterview(
  pageId: string,
  data: Partial<Interview>
): Promise<Interview> {
  const notion = await getClientAsync()

  const properties: Record<string, unknown> = {}
  if (typeof data.round === 'number') properties['Round'] = { number: data.round }
  if (data.scheduledAt) properties['Scheduled At'] = { date: { start: data.scheduledAt } }
  if (data.status) properties['Status'] = { select: { name: data.status } }

  if (Object.keys(properties).length > 0) {
    await withRetry(() =>
      notion.pages.update({ page_id: pageId, properties: properties as Parameters<Client['pages']['update']>[0]['properties'] })
    )
  }

  if (data.transcript !== undefined || data.aiAnalysis !== undefined) {
    const page = await withRetry(() => notion.pages.retrieve({ page_id: pageId }))
    const existing = await readPageContent(notion, pageId)
    const [existingTranscript, existingAnalysis] = existing.split('\n---AI_ANALYSIS---\n')

    const transcript = data.transcript !== undefined ? data.transcript : (existingTranscript ?? '')
    const aiAnalysis = data.aiAnalysis !== undefined ? data.aiAnalysis : (existingAnalysis ?? '')
    const combined = aiAnalysis
      ? `${transcript}\n---AI_ANALYSIS---\n${aiAnalysis}`
      : transcript

    await writePageContent(notion, pageId, combined)
    void page
  }

  const interviews = await getInterviews(
    (await withRetry(() => notion.pages.retrieve({ page_id: pageId }))).id
  )
  return interviews.find((i) => i.id === pageId) ?? {
    id: pageId,
    companyId: data.companyId ?? '',
    round: data.round ?? 1,
    scheduledAt: data.scheduledAt ?? '',
    status: data.status ?? 'scheduled',
    transcript: data.transcript ?? '',
    aiAnalysis: data.aiAnalysis ?? '',
    createdAt: ''
  }
}

// ---- Skill CRUD ----

export async function getSkills(): Promise<Skill[]> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const response = await withRetry(() =>
    notion.databases.query({
      database_id: dbs.skills,
      sorts: [{ property: 'Frequency', direction: 'descending' }]
    })
  )

  return response.results.map((page) => ({
    id: page.id,
    name: titleText(page, 'Name'),
    category: selectValue(page, 'Category'),
    frequency: numberValue(page, 'Frequency') ?? 1,
    firstSeen: dateValue(page, 'First Seen'),
    lastSeen: dateValue(page, 'Last Seen')
  }))
}

export async function upsertSkill(name: string, category: string): Promise<void> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const today = new Date().toISOString().split('T')[0]

  const existing = await withRetry(() =>
    notion.databases.query({
      database_id: dbs.skills,
      filter: { property: 'Name', title: { equals: name } }
    })
  )

  if (existing.results.length > 0) {
    const page = existing.results[0]
    const freq = numberValue(page, 'Frequency') ?? 0
    await withRetry(() =>
      notion.pages.update({
        page_id: page.id,
        properties: {
          Frequency: { number: freq + 1 },
          'Last Seen': { date: { start: today } }
        }
      })
    )
  } else {
    await withRetry(() =>
      notion.pages.create({
        parent: { database_id: dbs.skills },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Category: { select: { name: category } },
          Frequency: { number: 1 },
          'First Seen': { date: { start: today } },
          'Last Seen': { date: { start: today } }
        }
      })
    )
  }
}

// ---- MockInterview CRUD ----

export async function getMockInterviews(companyId: string): Promise<MockInterview[]> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const response = await withRetry(() =>
    notion.databases.query({
      database_id: dbs.mockInterviews,
      filter: { property: 'Company', relation: { contains: companyId } },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }]
    })
  )

  return Promise.all(
    response.results.map(async (page) => {
      const questions = await readPageContent(notion, page.id)
      return {
        id: page.id,
        companyId: relationIds(page, 'Company')[0] ?? companyId,
        questions,
        createdAt: createdTime(page)
      }
    })
  )
}

export async function createMockInterview(
  companyId: string,
  questions: string
): Promise<void> {
  const notion = await getClientAsync()
  const dbs = await getDBIds()

  const today = new Date().toISOString().split('T')[0]

  const page = await withRetry(() =>
    notion.pages.create({
      parent: { database_id: dbs.mockInterviews },
      properties: {
        Company: { relation: [{ id: companyId }] },
        'Created At': { date: { start: today } }
      }
    })
  )

  await writePageContent(notion, page.id, questions)
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/lib/notion.ts && git commit -m "feat: add lib/notion.ts Notion service layer replacing Prisma for business data"
```

---

## Task 6: Rewrite /api/companies routes

**Files to modify:**
- `frontend/app/api/companies/route.ts`
- `frontend/app/api/companies/[id]/route.ts`

### `frontend/app/api/companies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCompanies, createCompany } from '@/lib/notion'

export async function GET() {
  try {
    const companies = await getCompanies()
    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, jd, skills } = body

    if (!name || !position || !jd) {
      return NextResponse.json(
        { error: 'Missing required fields: name, position, jd' },
        { status: 400 }
      )
    }

    const company = await createCompany({
      name,
      position,
      jd,
      skills: Array.isArray(skills) ? skills : [],
      status: 'active'
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
```

### `frontend/app/api/companies/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCompany, updateCompany, deleteCompany } from '@/lib/notion'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const company = await getCompany(params.id)
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Company not found' }, { status: 404 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, position, jd, skills, status, matchScore } = body

    const company = await updateCompany(params.id, {
      ...(name && { name }),
      ...(position && { position }),
      ...(jd !== undefined && { jd }),
      ...(Array.isArray(skills) && { skills }),
      ...(status && { status }),
      ...(typeof matchScore === 'number' && { matchScore })
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCompany(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/app/api/companies/route.ts "frontend/app/api/companies/[id]/route.ts" && git commit -m "feat: rewrite /api/companies routes to use lib/notion.ts"
```

---

## Task 7: Rewrite resume routes

**Files to modify:**
- `frontend/app/api/resume/route.ts`
- `frontend/app/api/resume/upload/route.ts`

### `frontend/app/api/resume/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { readSettings } from '@/lib/settings'

export async function GET() {
  try {
    const settings = await readSettings()

    if (!settings.resumeText) {
      return NextResponse.json({ hasResume: false })
    }

    return NextResponse.json({
      hasResume: true,
      filename: settings.resumePath?.split('/').pop() || 'resume.pdf',
      textPreview: settings.resumeText.substring(0, 300),
      uploadedAt: null
    })
  } catch (error) {
    console.error('Error fetching resume:', error)
    return NextResponse.json({ hasResume: false })
  }
}
```

### `frontend/app/api/resume/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
import { writeSettings } from '@/lib/settings'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPE = 'application/pdf'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    }

    if (file.type !== ALLOWED_TYPE) {
      return NextResponse.json({ error: '只允许上传 PDF 文件' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小不能超过 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let extractedText = ''
    try {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
    } catch (error) {
      console.error('PDF parsing error:', error)
      return NextResponse.json({ error: 'PDF 解析失败' }, { status: 500 })
    }

    const timestamp = Date.now()
    const filename = `resume_${timestamp}_${file.name}`
    const resumesDir = join(process.cwd(), '..', 'data', 'resumes')
    const filepath = join(resumesDir, filename)

    try {
      await mkdir(resumesDir, { recursive: true })
      await writeFile(filepath, buffer)
    } catch (error) {
      console.error('File save error:', error)
      return NextResponse.json({ error: '文件保存失败' }, { status: 500 })
    }

    await writeSettings({ resumePath: filepath, resumeText: extractedText })

    return NextResponse.json({
      success: true,
      filename,
      textPreview: extractedText.substring(0, 500),
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/app/api/resume/route.ts frontend/app/api/resume/upload/route.ts && git commit -m "feat: rewrite resume routes to use settings.ts instead of Prisma User model"
```

---

## Task 8: Rewrite /api/ai/analyze-interview

**Files to modify:** `frontend/app/api/ai/analyze-interview/route.ts`

Replace `prisma.user.findFirst` with `readSettings()` to get `resumeText`.

### `frontend/app/api/ai/analyze-interview/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/app-settings'
import { parseJsonFromText } from '@/lib/parse-json'
import { readSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const { transcript, jd, resume } = await request.json()

    if (!transcript || !jd) {
      return NextResponse.json(
        { error: 'Transcript and job description are required' },
        { status: 400 }
      )
    }

    let resumeText = typeof resume === 'string' ? resume.trim() : ''
    if (!resumeText) {
      const settings = await readSettings()
      resumeText = (settings.resumeText || '').trim()
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text not found. Please upload your resume first.' },
        { status: 400 }
      )
    }

    const { client, settings } = await getOpenAIClient()

    const completion = await client.chat.completions.create({
      model: settings.aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an interview performance analyst. Analyze interview transcripts and provide detailed feedback in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this interview performance based on the job requirements and candidate's resume.\n\n【Job Requirements】\n${jd}\n\n【Candidate Resume】\n${resumeText}\n\n【Interview Transcript】\n${transcript}\n\nProvide analysis in JSON format:\n{\n  "matchScore": 85,\n  "strengths": ["strength1", "strength2"],\n  "weaknesses": ["weakness1", "weakness2"],\n  "suggestions": [{"weakness": "weakness description", "advice": "specific improvement advice"}],\n  "summary": "Overall assessment summary"\n}`
        }
      ]
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const result = parseJsonFromText(content)

    const analysis = {
      matchScore: typeof result.matchScore === 'number' ? result.matchScore : 0,
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.map((s: unknown) =>
            typeof s === 'object' && s !== null && 'weakness' in s
              ? s
              : { weakness: String(s), advice: '' }
          )
        : [],
      summary: result.summary || 'Analysis completed'
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing interview:', error)
    return NextResponse.json(
      { error: 'Failed to analyze interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/app/api/ai/analyze-interview/route.ts && git commit -m "feat: rewrite analyze-interview to use settings.ts for resumeText"
```

---

## Task 9: Update Settings UI

**Files to modify:** `frontend/app/settings/page.tsx`

Add a Notion section with fields for API token and 4 database IDs. Update `SettingsForm` type to include `notionApiToken` and `notionDBs`.

### `frontend/app/settings/page.tsx`

```typescript
'use client'

import { FormEvent, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'

type SettingsForm = {
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  whisperMode: 'none' | 'api' | 'local'
  whisperApiUrl: string
  whisperModel: string
  notionApiToken: string
  notionDBs: {
    companies: string
    interviews: string
    skills: string
    mockInterviews: string
  }
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsForm>({
    aiBaseUrl: 'https://api.openai.com/v1',
    aiApiKey: '',
    aiModel: 'gpt-4o-mini',
    whisperMode: 'none',
    whisperApiUrl: 'http://localhost:9000',
    whisperModel: 'whisper-1',
    notionApiToken: '',
    notionDBs: { companies: '', interviews: '', skills: '', mockInterviews: '' }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) throw new Error('Failed to load settings')
        const data = await response.json()
        setForm({
          aiBaseUrl: data.aiBaseUrl || 'https://api.openai.com/v1',
          aiApiKey: data.aiApiKey || '',
          aiModel: data.aiModel || 'gpt-4o-mini',
          whisperMode: (data.whisperMode || 'none') as SettingsForm['whisperMode'],
          whisperApiUrl: data.whisperApiUrl || 'http://localhost:9000',
          whisperModel: data.whisperModel || 'whisper-1',
          notionApiToken: data.notionApiToken || '',
          notionDBs: {
            companies: data.notionDBs?.companies || '',
            interviews: data.notionDBs?.interviews || '',
            skills: data.notionDBs?.skills || '',
            mockInterviews: data.notionDBs?.mockInterviews || ''
          }
        })
      } catch (error) {
        console.error(error)
        setMessage('Failed to load settings.')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!response.ok) throw new Error('Failed to save settings')
      setMessage('Settings saved.')
    } catch (error) {
      console.error(error)
      setMessage('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const setDB = (key: keyof SettingsForm['notionDBs'], value: string) =>
    setForm({ ...form, notionDBs: { ...form.notionDBs, [key]: value } })

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure your OpenAI-compatible API, Whisper transcription, and Notion integration.</p>

          {loading ? (
            <div className="mt-8 text-gray-600">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <section className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">AI API (OpenAI-compatible)</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                  <input
                    value={form.aiBaseUrl}
                    onChange={(e) => setForm({ ...form, aiBaseUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={form.aiApiKey}
                    onChange={(e) => setForm({ ...form, aiApiKey: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chat Model</label>
                  <input
                    value={form.aiModel}
                    onChange={(e) => setForm({ ...form, aiModel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="gpt-4o-mini"
                  />
                </div>
              </section>

              <section className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Whisper</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                  <select
                    value={form.whisperMode}
                    onChange={(e) => setForm({ ...form, whisperMode: e.target.value as SettingsForm['whisperMode'] })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="none">none (disable)</option>
                    <option value="api">api (OpenAI-compatible)</option>
                    <option value="local">local (self-hosted whisper)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local Whisper URL</label>
                  <input
                    value={form.whisperApiUrl}
                    onChange={(e) => setForm({ ...form, whisperApiUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="http://localhost:9000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Whisper Model</label>
                  <input
                    value={form.whisperModel}
                    onChange={(e) => setForm({ ...form, whisperModel: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="whisper-1"
                  />
                </div>
              </section>

              <section className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Notion</h2>
                <p className="text-sm text-gray-500">
                  Create a Notion integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="underline">notion.so/my-integrations</a>, then share each database with it and paste the database IDs below.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
                  <input
                    type="password"
                    value={form.notionApiToken}
                    onChange={(e) => setForm({ ...form, notionApiToken: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="secret_..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Applications DB ID</label>
                  <input
                    value={form.notionDBs.companies}
                    onChange={(e) => setDB('companies', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviews DB ID</label>
                  <input
                    value={form.notionDBs.interviews}
                    onChange={(e) => setDB('interviews', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills DB ID</label>
                  <input
                    value={form.notionDBs.skills}
                    onChange={(e) => setDB('skills', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mock Interviews DB ID</label>
                  <input
                    value={form.notionDBs.mockInterviews}
                    onChange={(e) => setDB('mockInterviews', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
              </section>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
                {message && <p className="text-sm text-gray-600">{message}</p>}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
```

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add frontend/app/settings/page.tsx && git commit -m "feat: add Notion configuration section to Settings UI"
```

---

## Task 10: Remove Prisma

**Files to delete:**
- `frontend/prisma/schema.prisma`
- `frontend/lib/prisma.ts`

### Steps

1. Delete the Prisma schema and client files:

```bash
rm /Users/a1/Documents/interview-helper/frontend/prisma/schema.prisma
rm /Users/a1/Documents/interview-helper/frontend/lib/prisma.ts
```

2. Uninstall Prisma packages:

```bash
cd /Users/a1/Documents/interview-helper/frontend && npm uninstall @prisma/client prisma
```

3. Verify no remaining Prisma imports:

```bash
grep -r "from '@/lib/prisma'" /Users/a1/Documents/interview-helper/frontend/app
grep -r "from 'prisma'" /Users/a1/Documents/interview-helper/frontend/app
grep -r "@prisma" /Users/a1/Documents/interview-helper/frontend/app
```

All three commands should return no output.

### Verification

```bash
cd /Users/a1/Documents/interview-helper/frontend && npx tsc --noEmit
```

### Commit

```bash
git add -A && git commit -m "feat: remove Prisma and SQLite, migration to Notion complete"
```

---

## Summary

After all 10 tasks are complete:

- `data/settings.json` holds all credentials and resume text (gitignored)
- `frontend/lib/settings.ts` is the single source of truth for app config
- `frontend/lib/notion.ts` handles all business data CRUD via Notion API
- `frontend/lib/app-settings.ts` provides OpenAI and Notion client factories
- All API routes use `lib/notion.ts` or `lib/settings.ts` — zero Prisma references remain
- The Settings UI exposes Notion token and 4 database ID fields

### Notion Database Setup (manual, one-time)

Before using the app, the user must:

1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) and create a new integration. Copy the "Internal Integration Token" (`secret_...`).
2. In Notion, create 4 databases with the following properties:

**Job Applications**
- `Name` (title)
- `Position` (rich_text)
- `Status` (select): options `active`, `interviewing`, `offered`, `rejected`
- `Match Score` (number)
- `Skills` (multi_select)

**Interviews**
- `Company` (relation → Job Applications, no limit)
- `Round` (number)
- `Scheduled At` (date)
- `Status` (select): options `scheduled`, `completed`, `passed`, `rejected`

**Skills**
- `Name` (title)
- `Category` (select)
- `Frequency` (number)
- `First Seen` (date)
- `Last Seen` (date)

**Mock Interviews**
- `Company` (relation → Job Applications, no limit)
- `Created At` (date)

3. Share each database with the integration (click "..." on the database → "Add connections" → select your integration).
4. Copy each database ID from the URL (`notion.so/<workspace>/<DATABASE_ID>?v=...`) and paste into the app Settings page.

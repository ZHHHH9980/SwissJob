import type OpenAI from 'openai'
import {
  getCompanies, getCompany, createCompany, updateCompany, deleteCompany,
  getInterviews, createInterview,
  getSkills, createSkill,
} from './notion'

// ---------------------------------------------------------------------------
// Tool definitions for OpenAI function calling
// ---------------------------------------------------------------------------

export const TOOL_DEFINITIONS: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'list_companies',
      description: 'List all job applications the user is tracking',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_company',
      description: 'Get details of a specific company including job description',
      parameters: {
        type: 'object',
        properties: { companyId: { type: 'string', description: 'Notion page ID' } },
        required: ['companyId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_company',
      description: 'Add a new job application. Only use this when the user explicitly wants to create a NEW company. If a company already exists, use update_company instead.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name' },
          jobDescription: { type: 'string', description: 'Job description text' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_company',
      description: 'Update an existing company/job application. Use this to change name, status, or job description of an existing company.',
      parameters: {
        type: 'object',
        properties: {
          companyId: { type: 'string', description: 'Notion page ID of the company to update' },
          name: { type: 'string', description: 'New company name' },
          jobDescription: { type: 'string', description: 'Updated job description' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'completed'] },
        },
        required: ['companyId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_company',
      description: 'Delete a company/job application. Ask for confirmation before deleting.',
      parameters: {
        type: 'object',
        properties: {
          companyId: { type: 'string', description: 'Notion page ID of the company to delete' },
        },
        required: ['companyId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_interview',
      description: 'Schedule an interview for a company. Parse natural language dates into ISO 8601 format.',
      parameters: {
        type: 'object',
        properties: {
          companyId: { type: 'string', description: 'Notion page ID of the company' },
          companyName: { type: 'string', description: 'Company name (used as position)' },
          date: { type: 'string', description: 'ISO 8601 datetime string' },
          notes: { type: 'string', description: 'Interview notes, e.g. round info' },
        },
        required: ['companyId', 'companyName', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_interviews',
      description: 'Get upcoming scheduled interviews, optionally filtered by company',
      parameters: {
        type: 'object',
        properties: { companyId: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_skills',
      description: 'List all tracked skills',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_skill',
      description: 'Add a new skill to track',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string' },
          level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description: 'Navigate the user to a page in the app',
      parameters: {
        type: 'object',
        properties: {
          page: {
            type: 'string',
            enum: ['/companies', '/companies/new', '/skills', '/calendar', '/resume', '/settings'],
          },
        },
        required: ['page'],
      },
    },
  },
]

// ---------------------------------------------------------------------------
// Tool executors
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolExecutor = (args: any) => Promise<any>

const executors: Record<string, ToolExecutor> = {
  async list_companies() {
    const companies = await getCompanies()
    return companies.map(c => ({ id: c.id, name: c.name, status: c.status, createdAt: c.createdAt }))
  },

  async get_company({ companyId }: { companyId: string }) {
    const company = await getCompany(companyId)
    if (!company) return { error: 'Company not found' }
    return company
  },

  async add_company({ name, jobDescription, status }: { name: string; jobDescription?: string; status?: string }) {
    const company = await createCompany({
      name,
      jobDescription,
      status: (status as 'pending' | 'in-progress' | 'completed') || 'pending',
    })
    return { success: true, company: { id: company.id, name: company.name }, _refresh: 'companies' }
  },

  async update_company({ companyId, name, jobDescription, status }: {
    companyId: string; name?: string; jobDescription?: string; status?: string
  }) {
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (jobDescription !== undefined) data.jobDescription = jobDescription
    if (status !== undefined) data.status = status
    const company = await updateCompany(companyId, data as Parameters<typeof updateCompany>[1])
    return { success: true, company: { id: company.id, name: company.name, status: company.status }, _refresh: 'companies' }
  },

  async delete_company({ companyId }: { companyId: string }) {
    await deleteCompany(companyId)
    return { success: true, deleted: companyId, _refresh: 'companies' }
  },

  async schedule_interview({ companyId, companyName, date, notes }: {
    companyId: string; companyName: string; date: string; notes?: string
  }) {
    const interview = await createInterview({
      companyId,
      position: companyName,
      date,
      status: 'scheduled',
      notes,
    })
    return { success: true, interview: { id: interview.id, date: interview.date, status: interview.status }, _refresh: 'interviews' }
  },

  async get_upcoming_interviews({ companyId }: { companyId?: string } = {}) {
    const interviews = await getInterviews(companyId)
    const upcoming = interviews
      .filter(i => i.date && new Date(i.date) >= new Date())
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    return upcoming.map(i => ({
      id: i.id, companyId: i.companyId, position: i.position,
      date: i.date, status: i.status, notes: i.notes,
    }))
  },

  async list_skills() {
    const skills = await getSkills()
    return skills.map(s => ({ id: s.id, name: s.name, category: s.category, level: s.level }))
  },

  async add_skill({ name, category, level }: { name: string; category?: string; level?: string }) {
    const skill = await createSkill({ name, category, level })
    return { success: true, skill: { id: skill.id, name: skill.name }, _refresh: 'skills' }
  },

  async navigate_to({ page }: { page: string }) {
    return { navigateTo: page }
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeToolCall(name: string, args: any): Promise<any> {
  const executor = executors[name]
  if (!executor) return { error: `Unknown tool: ${name}` }
  try {
    return await executor(args)
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
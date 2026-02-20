import fs from 'fs/promises'
import path from 'path'

export type AppSettings = {
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  whisperMode: string
  whisperApiUrl: string
  whisperModel: string
  notionApiToken: string
  notionDBs: {
    companies: string
    interviews: string
    skills: string
    mockInterviews: string
  }
  resumePath: string
  resumeText: string
}

const SETTINGS_PATH = path.join(process.cwd(), '..', 'data', 'settings.json')

const DEFAULTS: AppSettings = {
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: '',
  whisperMode: 'openai',
  whisperApiUrl: '',
  whisperModel: '',
  notionApiToken: '',
  notionDBs: {
    companies: '',
    interviews: '',
    skills: '',
    mockInterviews: '',
  },
  resumePath: '',
  resumeText: '',
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8')
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export async function writeSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readSettings()
  const next = { ...current, ...updates }
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2))
  return next
}

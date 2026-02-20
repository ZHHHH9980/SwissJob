import OpenAI from 'openai'
import { Client } from '@notionhq/client'
import { readSettings } from './settings'

export type WhisperMode = 'none' | 'api' | 'local'

// Kept for backward compatibility with existing consumers
export async function getOrCreateAppSettings() {
  return readSettings()
}

export async function getAISettings() {
  const s = await readSettings()
  return {
    aiBaseUrl: s.aiBaseUrl.trim() || 'https://api.openai.com/v1',
    aiApiKey: s.aiApiKey.trim(),
    aiModel: s.aiModel.trim() || 'gpt-4o-mini',
  }
}

export async function getOpenAIClient() {
  const s = await readSettings()
  const apiKey = s.aiApiKey.trim()

  if (!apiKey) {
    throw new Error('AI API key not configured')
  }

  return {
    settings: s,
    client: new OpenAI({
      apiKey,
      baseURL: s.aiBaseUrl.trim() || 'https://api.openai.com/v1',
    }),
  }
}

export async function getWhisperSettings() {
  const s = await readSettings()
  const model = s.whisperModel.trim() || 'whisper-1'
  return {
    mode: (s.whisperMode || 'none') as WhisperMode,
    apiUrl: s.whisperApiUrl.trim() || 'http://localhost:9000',
    model,
    whisperModel: model, // backward compat alias
    aiApiKey: s.aiApiKey.trim(),
    aiBaseUrl: s.aiBaseUrl.trim() || 'https://api.openai.com/v1',
  }
}

export function getNotionClient(token?: string): Client {
  const apiKey = token?.trim()
  if (!apiKey) {
    throw new Error('Notion API token not configured')
  }
  return new Client({ auth: apiKey })
}

export async function getNotionClientFromSettings(): Promise<Client> {
  const s = await readSettings()
  return getNotionClient(s.notionApiToken)
}

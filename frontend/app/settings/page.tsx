'use client'

import { FormEvent, useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { fetchT } from '@/lib/fetch'

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
    notionDBs: {
      companies: '',
      interviews: '',
      skills: '',
      mockInterviews: '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetchT('/api/settings', 'Load settings')
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
            mockInterviews: data.notionDBs?.mockInterviews || '',
          }
        })
      } catch (error) {
        console.error(error)
        setMessage('Failed to load settings.')
      } finally {
        // settings loaded
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

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setMessage('Settings saved.')
    } catch (error) {
      console.error(error)
      setMessage('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure your OpenAI-compatible API and Whisper transcription.</p>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notion API Token</label>
                  <input
                    type="password"
                    value={form.notionApiToken}
                    onChange={(e) => setForm({ ...form, notionApiToken: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="secret_..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Companies DB ID</label>
                  <input
                    value={form.notionDBs.companies}
                    onChange={(e) => setForm({ ...form, notionDBs: { ...form.notionDBs, companies: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Notion database ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviews DB ID</label>
                  <input
                    value={form.notionDBs.interviews}
                    onChange={(e) => setForm({ ...form, notionDBs: { ...form.notionDBs, interviews: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Notion database ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills DB ID</label>
                  <input
                    value={form.notionDBs.skills}
                    onChange={(e) => setForm({ ...form, notionDBs: { ...form.notionDBs, skills: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Notion database ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mock Interviews DB ID</label>
                  <input
                    value={form.notionDBs.mockInterviews}
                    onChange={(e) => setForm({ ...form, notionDBs: { ...form.notionDBs, mockInterviews: e.target.value } })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Notion database ID"
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
        </div>
      </main>
    </div>
  )
}

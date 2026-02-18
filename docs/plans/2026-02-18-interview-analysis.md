# Interview Analysis Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated `/companies/[id]/interview` page supporting audio upload and text paste, with enhanced AI analysis and follow-up chat.

**Architecture:** New page at `/companies/[id]/interview` with three sections: input (tab-switched audio/text), analysis results, and chat. Two new/modified API routes handle enhanced analysis and chat.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, OpenAI SDK

---

### Task 1: Enhance analyze-interview API

**Files:**
- Modify: `frontend/app/api/ai/analyze-interview/route.ts`

**Step 1: Update the AI prompt (line 44)**

Change the JSON format instruction inside the prompt string to:

```
"suggestions": [{"weakness": "...", "advice": "specific improvement advice"}]
```

Full updated prompt content (replace the content field in the user message):

```
Analyze this interview performance based on the job requirements and candidate's resume.\n\n【Job Requirements】\n${jd}\n\n【Candidate Resume】\n${resumeText}\n\n【Interview Transcript】\n${transcript}\n\nProvide analysis in JSON format:\n{\n  "matchScore": 85,\n  "strengths": ["strength1", "strength2"],\n  "weaknesses": ["weakness1", "weakness2"],\n  "suggestions": [{"weakness": "weakness description", "advice": "specific improvement advice"}],\n  "summary": "Overall assessment summary"\n}
```

**Step 2: Update response normalization (lines 60-66)**

Replace the `suggestions` normalization line with:

```ts
suggestions: Array.isArray(result.suggestions)
  ? result.suggestions.map((s: unknown) =>
      typeof s === 'object' && s !== null && 'weakness' in s
        ? s
        : { weakness: String(s), advice: '' }
    )
  : [],
```

**Step 3: Commit**

```bash
git add frontend/app/api/ai/analyze-interview/route.ts
git commit -m "feat: enhance analyze-interview suggestions with per-weakness advice"
```

---

### Task 2: Create interview-chat API

**Files:**
- Create: `frontend/app/api/ai/interview-chat/route.ts`

**Step 1: Create the file with this content**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/app-settings'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()

    if (!message || !context) {
      return NextResponse.json({ error: 'message and context are required' }, { status: 400 })
    }

    const { client, settings } = await getOpenAIClient()

    const systemPrompt = `You are an interview coach. The candidate just completed an interview.

Job Description:
${context.jd}

Interview Transcript:
${context.transcript}

AI Analysis:
- Match Score: ${context.analysis.matchScore}%
- Strengths: ${context.analysis.strengths.join(', ')}
- Weaknesses: ${context.analysis.suggestions?.map((s: {weakness: string}) => s.weakness).join(', ')}
- Summary: ${context.analysis.summary}

Answer the candidate's follow-up questions with specific, actionable advice.`

    const completion = await client.chat.completions.create({
      model: settings.aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    })

    const reply = completion.choices[0].message.content || ''
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Interview chat error:', error)
    return NextResponse.json(
      { error: 'Chat failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add frontend/app/api/ai/interview-chat/route.ts
git commit -m "feat: add interview-chat API endpoint"
```

---

### Task 3: Create interview page

**Files:**
- Create: `frontend/app/companies/[id]/interview/page.tsx`

**Step 1: Create the file — part 1 (imports, types, state)**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Company {
  id: string
  name: string
  position: string
  jd: string
}

interface Suggestion {
  weakness: string
  advice: string
}

interface InterviewAnalysis {
  matchScore: number
  strengths: string[]
  weaknesses: string[]
  suggestions: Suggestion[]
  summary: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function InterviewPage() {
  const params = useParams()
  const [company, setCompany] = useState<Company | null>(null)
  const [inputTab, setInputTab] = useState<'audio' | 'text'>('audio')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
```

**Step 2: Add useEffect hooks and handlers**

```tsx
  useEffect(() => {
    fetch(`/api/companies/${params.id}`)
      .then(r => r.json())
      .then(setCompany)
      .catch(console.error)
  }, [params.id])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleAnalyze = async () => {
    if (!company) return
    setIsAnalyzing(true)
    setAnalysisError('')
    setAnalysis(null)

    try {
      let transcriptText = ''

      if (inputTab === 'audio') {
        if (!audioFile) return
        const formData = new FormData()
        formData.append('file', audioFile)
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Transcription failed')
        transcriptText = data.text
      } else {
        transcriptText = textInput.trim()
        if (!transcriptText) return
      }

      setTranscript(transcriptText)

      const res = await fetch('/api/ai/analyze-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText, jd: company.jd })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setAnalysis(data)
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || !analysis || isChatLoading) return
    const message = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setIsChatLoading(true)

    try {
      const res = await fetch('/api/ai/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: { transcript, jd: company!.jd, analysis } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Send failed, please retry.' }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const canAnalyze = inputTab === 'audio' ? !!audioFile : !!textInput.trim()

  if (!company) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">Loading...</div>
    </div>
  )
```

**Step 3: Add the JSX return**

```tsx
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href={`/companies/${params.id}`} className="text-blue-600 hover:underline text-sm">
            ← Back to {company.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Interview Analysis</h1>
          <p className="text-gray-600">{company.position}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setInputTab('audio')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inputTab === 'audio' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >Audio Upload</button>
            <button
              onClick={() => setInputTab('text')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inputTab === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >Paste Text</button>
          </div>

          {inputTab === 'audio' ? (
            <input type="file" accept="audio/*"
              onChange={e => setAudioFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          ) : (
            <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
              placeholder="Paste your interview transcript here..."
              rows={8}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          <button onClick={handleAnalyze} disabled={!canAnalyze || isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>

          {analysisError && <p className="text-sm text-red-600">{analysisError}</p>}
        </div>

        {analysis && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Analysis Results</h2>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {analysis.matchScore}% Match
              </span>
            </div>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Strengths</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Improvement Areas</h3>
              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-700">{s.weakness}</p>
                    <p className="text-sm text-gray-600 mt-1">{s.advice}</p>
                  </div>
                ))}
              </div>
            </div>
            {transcript && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View transcript</summary>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-200 rounded p-3">{transcript}</p>
              </details>
            )}
          </div>
        )}

        {analysis && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Ask the Coach</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {chatMessages.length === 0 && (
                <p className="text-sm text-gray-400">Ask follow-up questions about your interview performance...</p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input type="text" value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                placeholder="Ask a follow-up question..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleChat} disabled={!chatInput.trim() || isChatLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add frontend/app/companies/[id]/interview/page.tsx
git commit -m "feat: add dedicated interview analysis page with audio/text input and chat"
```

---

### Task 4: Wire up the button on company detail page

**Files:**
- Modify: `frontend/app/companies/[id]/page.tsx:184-186`

**Step 1: Add Link import if not present**

Check line 3 — `import Link from 'next/link'` is already there.

**Step 2: Replace the Mock Interview button**

Find:
```tsx
<button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
  Mock Interview
</button>
```

Replace with:
```tsx
<Link
  href={`/companies/${params.id}/interview`}
  className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-center"
>
  Analyze Interview
</Link>
```

**Step 3: Commit**

```bash
git add frontend/app/companies/[id]/page.tsx
git commit -m "feat: wire Analyze Interview button to new interview page"
```

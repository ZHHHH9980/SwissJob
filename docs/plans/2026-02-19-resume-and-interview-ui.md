# Resume Page & Interview UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the Resume page, improve the interview page UI (tabs + description), and add inline resume upload when resume is missing during analysis.

**Architecture:** Three independent changes: (1) UI polish on the interview page, (2) new `/resume` page using the existing `/api/resume/upload` API, (3) inline resume upload flow in the interview page when analysis fails due to missing resume.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS

---

### Task 1: Interview page — tab UI and description text

**Files:**
- Modify: `frontend/app/companies/[id]/interview/page.tsx`

**Step 1: Add description text below the heading**

Find lines 137-138:
```tsx
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Interview Analysis</h1>
          <p className="text-gray-600">{company.position}</p>
```

Replace with:
```tsx
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Interview Analysis</h1>
          <p className="text-gray-600">{company.position}</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload your interview recording or paste the transcript. The AI will analyze your
            performance against the job requirements and give you actionable feedback.
          </p>
```

**Step 2: Replace the two toggle buttons with a proper tab bar**

Find lines 141-151:
```tsx
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
```

Replace with:
```tsx
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setInputTab('audio')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                inputTab === 'audio'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >Audio Upload</button>
            <button
              onClick={() => setInputTab('text')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                inputTab === 'text'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >Paste Text</button>
          </div>
```

**Step 3: Commit**

```bash
git add frontend/app/companies/[id]/interview/page.tsx
git commit -m "feat: improve interview page UI with tab bar and description text"
```

---

### Task 2: Create Resume page

**Files:**
- Create: `frontend/app/resume/page.tsx`

**Step 1: Create the file**

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ResumeStatus {
  hasResume: boolean
  filename?: string
  textPreview?: string
  uploadedAt?: string
}

export default function ResumePage() {
  const [status, setStatus] = useState<ResumeStatus | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => {
    fetch('/api/resume')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ hasResume: false }))
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setStatus({
        hasResume: true,
        filename: data.filename,
        textPreview: data.textPreview,
        uploadedAt: data.uploadedAt
      })
      setUploadSuccess('Resume uploaded successfully.')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <Link href="/companies" className="text-blue-600 hover:underline text-sm">
            ← Back to Job Applications
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Resume</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload your resume so the AI can compare it against job requirements during interview analysis.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          {status === null ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : status.hasResume ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-sm font-medium">✓ Resume uploaded</span>
                {status.uploadedAt && (
                  <span className="text-xs text-gray-400">
                    {new Date(status.uploadedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {status.textPreview && (
                <div className="border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Preview</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{status.textPreview}...</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-2">Replace resume:</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">No resume uploaded yet. Upload a PDF to enable AI interview analysis.</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleUpload}
                disabled={isUploading}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </>
          )}

          {isUploading && <p className="text-sm text-blue-600">Uploading...</p>}
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          {uploadSuccess && <p className="text-sm text-green-600">{uploadSuccess}</p>}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Create the GET resume status API**

Create `frontend/app/api/resume/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { resumeText: true, resumePath: true, updatedAt: true }
    })

    if (!user?.resumeText) {
      return NextResponse.json({ hasResume: false })
    }

    return NextResponse.json({
      hasResume: true,
      filename: user.resumePath?.split('/').pop() || 'resume.pdf',
      textPreview: user.resumeText.substring(0, 300),
      uploadedAt: user.updatedAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ hasResume: false })
  }
}
```

**Step 3: Commit**

```bash
git add frontend/app/resume/page.tsx frontend/app/api/resume/route.ts
git commit -m "feat: add resume page with upload and status display"
```

---

### Task 3: Inline resume upload in interview page when resume is missing

**Files:**
- Modify: `frontend/app/companies/[id]/interview/page.tsx`

When the analyze API returns "Resume text not found", show an inline file upload prompt instead of just the error text. After successful upload, auto-retry the analysis.

**Step 1: Add `showResumeUpload` state and `resumeUploadRef`**

After line 45 (`const [chatError, setChatError] = useState('')`), add:

```tsx
  const [showResumeUpload, setShowResumeUpload] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const resumeUploadRef = useRef<HTMLInputElement>(null)
```

**Step 2: Add `handleResumeUpload` function**

After the `handleChat` function (after line 120), add:

```tsx
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingResume(true)
    setAnalysisError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setShowResumeUpload(false)
      // Auto-retry analysis
      await handleAnalyze()
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Resume upload failed')
    } finally {
      setIsUploadingResume(false)
      e.target.value = ''
    }
  }
```

**Step 3: Update `handleAnalyze` to detect missing resume error**

In `handleAnalyze`, find the catch block (lines 91-93):
```tsx
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed')
    } finally {
```

Replace with:
```tsx
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      if (msg.includes('Resume text not found')) {
        setShowResumeUpload(true)
        setAnalysisError('')
      } else {
        setAnalysisError(msg)
      }
    } finally {
```

**Step 4: Replace the error display with conditional resume upload UI**

Find line 171:
```tsx
          {analysisError && <p className="text-sm text-red-600">{analysisError}</p>}
```

Replace with:
```tsx
          {analysisError && <p className="text-sm text-red-600">{analysisError}</p>}
          {showResumeUpload && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-yellow-800">Resume required</p>
              <p className="text-xs text-yellow-700">
                Upload your resume (PDF) to enable AI analysis. It will be saved for future use.
              </p>
              <input
                ref={resumeUploadRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={isUploadingResume}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 disabled:opacity-50"
              />
              {isUploadingResume && <p className="text-xs text-yellow-700">Uploading and retrying analysis...</p>}
            </div>
          )}
```

**Step 5: Commit**

```bash
git add frontend/app/companies/[id]/interview/page.tsx
git commit -m "feat: show inline resume upload when resume is missing during analysis"
```

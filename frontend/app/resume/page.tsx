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

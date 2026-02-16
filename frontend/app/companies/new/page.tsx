'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCompanyPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    company?: string
    position?: string
    skills?: string[]
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      // Mock AI extraction
      const mockExtraction = {
        company: 'Google',
        position: 'Senior Software Engineer',
        skills: ['React', 'TypeScript', 'System Design']
      }
      setExtractedData(mockExtraction)
      setIsProcessing(false)
    }, 1500)
  }

  const handleConfirm = () => {
    // TODO: Save to backend
    console.log('Saving:', extractedData)
    alert('Position added! (Using mock data)')
    router.push('/companies')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Positions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Position</h1>
          <p className="text-gray-600 mt-2">Paste the job description and let AI extract the details</p>
        </div>

        {/* AI Input Form */}
        {!extractedData ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste the entire job description here...

Example:
Google is hiring a Senior Software Engineer for our Cloud Platform team.
Requirements: 5+ years experience with React, TypeScript, and distributed systems..."
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Just paste the job description. AI will automatically extract:
                </p>
                <ul className="text-sm text-blue-700 mt-2 ml-6 list-disc">
                  <li>Company name</li>
                  <li>Position title</li>
                  <li>Required skills</li>
                  <li>Key requirements</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !input.trim()}
              className="w-full mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                'Extract Information'
              )}
            </button>
          </form>
        ) : (
          /* Extracted Data Review */
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Review Extracted Information</h2>
              <p className="text-gray-600">Confirm the details before saving</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600">Company</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{extractedData.company}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600">Position</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">{extractedData.position}</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-600">Skills Required</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {extractedData.skills?.map((skill) => (
                    <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Confirm & Save
              </button>
              <button
                onClick={() => setExtractedData(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export default function NewCompanyPage() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    company?: string
    position?: string
    skills?: string[]
  } | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatProcessing, setIsChatProcessing] = useState(false)

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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !extractedData) return

    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatProcessing(true)

    // Simulate AI processing
    setTimeout(() => {
      const input = chatInput.toLowerCase()
      let response = ''
      const newData = { ...extractedData }

      // Mock conversational editing logic
      if (input.includes('change company') || input.includes('update company')) {
        const match = input.match(/(?:change|update) company to (.+)/i)
        if (match) {
          newData.company = match[1].trim()
          response = `Updated company to "${newData.company}"`
        }
      } else if (input.includes('change position') || input.includes('update position')) {
        const match = input.match(/(?:change|update) position to (.+)/i)
        if (match) {
          newData.position = match[1].trim()
          response = `Updated position to "${newData.position}"`
        }
      } else if (input.includes('add') && input.includes('skill')) {
        const match = input.match(/add (.+?) (?:to )?skill/i) || input.match(/add (.+)/i)
        if (match) {
          const skill = match[1].trim()
          if (!newData.skills?.includes(skill)) {
            newData.skills = [...(newData.skills || []), skill]
            response = `Added "${skill}" to skills`
          } else {
            response = `"${skill}" is already in the skills list`
          }
        }
      } else if (input.includes('remove') && input.includes('skill')) {
        const match = input.match(/remove (.+?) (?:from )?skill/i) || input.match(/remove (.+)/i)
        if (match) {
          const skill = match[1].trim()
          newData.skills = newData.skills?.filter(s => s.toLowerCase() !== skill.toLowerCase())
          response = `Removed "${skill}" from skills`
        }
      } else {
        response = "I can help you update the extracted data. Try commands like:\n- 'Change company to Meta'\n- 'Update position to Staff Engineer'\n- 'Add Python to skills'\n- 'Remove React from skills'"
      }

      setExtractedData(newData)
      const assistantMessage: ChatMessage = { role: 'assistant', content: response }
      setChatMessages(prev => [...prev, assistantMessage])
      setIsChatProcessing(false)
    }, 800)
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

            {/* Chat Interface */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Refine with Chat</h3>

              {/* Chat History */}
              {chatMessages.length > 0 && (
                <div className="mb-4 space-y-3 max-h-64 overflow-y-auto">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a command like 'Change company to Meta' or 'Add Python to skills'"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatProcessing}
                />
                <button
                  type="submit"
                  disabled={isChatProcessing || !chatInput.trim()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChatProcessing ? 'Sending...' : 'Send'}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-2">
                Try: "Change company to Meta", "Update position to Staff Engineer", "Add Python to skills"
              </p>
            </div>

            <div className="flex gap-4 mt-8">
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

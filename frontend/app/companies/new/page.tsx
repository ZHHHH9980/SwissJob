'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  showConfirmation?: boolean
  data?: {
    company?: string
    position?: string
    skills?: string[]
    jd?: string
  }
}

export default function NewCompanyPage() {
  const router = useRouter()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatProcessing, setIsChatProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    company?: string
    position?: string
    skills?: string[]
    jd?: string
  } | null>(null)
  const [isInitialSubmit, setIsInitialSubmit] = useState(true)
  const [isJdExpanded, setIsJdExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages([userMessage])
    setChatInput('')
    setIsChatProcessing(true)
    setIsInitialSubmit(false)

    // Simulate AI processing
    setTimeout(() => {
      // Mock AI extraction
      const mockExtraction = {
        company: 'Google',
        position: 'Senior Software Engineer',
        skills: ['React', 'TypeScript', 'System Design'],
        jd: chatInput
      }
      setExtractedData(mockExtraction)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: `I've analyzed the job description. Here's what I found:`,
        showConfirmation: true,
        data: mockExtraction
      }

      setChatMessages(prev => [...prev, assistantMessage])
      setIsChatProcessing(false)
    }, 1500)
  }

  const handleConfirm = async () => {
    if (!extractedData) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: extractedData.company,
          position: extractedData.position,
          jd: extractedData.jd,
          skills: extractedData.skills
        })
      })

      if (response.ok) {
        const successMessage: ChatMessage = {
          role: 'assistant',
          content: 'Perfect! The position has been saved successfully. Redirecting you to the positions list...'
        }
        setChatMessages(prev => [...prev, successMessage])

        setTimeout(() => {
          router.push('/companies')
        }, 1500)
      } else {
        const error = await response.json()
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: `Sorry, there was an error saving the position: ${error.error}. Please try again.`
        }
        setChatMessages(prev => [...prev, errorMessage])
        setIsSaving(false)
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error saving the position. Please try again.'
      }
      setChatMessages(prev => [...prev, errorMessage])
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    const editMessage: ChatMessage = {
      role: 'assistant',
      content: `Sure! What would you like to change? You can:

• Change the company name (e.g., "Change company to Meta")
• Update the position (e.g., "Update position to Staff Engineer")
• Add skills (e.g., "Add Python")
• Remove skills (e.g., "Remove React")

Just tell me what you'd like to adjust.`
    }
    setChatMessages(prev => [...prev, editMessage])
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !extractedData) return

    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    const userInput = chatInput.toLowerCase()
    setChatInput('')
    setIsChatProcessing(true)

    // Handle modifications
    setTimeout(() => {
      let response = ''
      const newData = { ...extractedData }

      if (userInput.includes('change company') || userInput.includes('update company')) {
        const match = userInput.match(/(?:change|update) company to (.+)/i)
        if (match) {
          newData.company = match[1].trim()
          response = `Got it! I've updated the company to **${newData.company}**.`
        }
      } else if (userInput.includes('change position') || userInput.includes('update position')) {
        const match = userInput.match(/(?:change|update) position to (.+)/i)
        if (match) {
          newData.position = match[1].trim()
          response = `Perfect! The position is now **${newData.position}**.`
        }
      } else if (userInput.includes('add') && (userInput.includes('skill') || userInput.match(/add [a-z]+$/i))) {
        const match = userInput.match(/add (.+?)(?:\s+(?:to\s+)?skill)?$/i)
        if (match) {
          const skill = match[1].trim()
          if (!newData.skills?.includes(skill)) {
            newData.skills = [...(newData.skills || []), skill]
            response = `Great! I've added **${skill}** to the skills list.`
          } else {
            response = `**${skill}** is already in the skills list.`
          }
        }
      } else if (userInput.includes('remove') && userInput.includes('skill')) {
        const match = userInput.match(/remove (.+?)(?:\s+(?:from\s+)?skill)?$/i)
        if (match) {
          const skill = match[1].trim()
          newData.skills = newData.skills?.filter(s => s.toLowerCase() !== skill.toLowerCase())
          response = `Done! I've removed **${skill}** from the skills list.`
        }
      } else {
        response = `I can help you refine the information. You can:

• Change the company name (e.g., "Change company to Meta")
• Update the position (e.g., "Update position to Staff Engineer")
• Add skills (e.g., "Add Python")
• Remove skills (e.g., "Remove React")

What would you like to adjust?`
      }

      setExtractedData(newData)

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        showConfirmation: !response.includes('can help you refine'),
        data: newData
      }
      setChatMessages(prev => [...prev, assistantMessage])
      setIsChatProcessing(false)
    }, 800)
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Positions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Position</h1>
          <p className="text-gray-600 mt-2">Chat with AI to add a job position</p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg mb-2">Start by pasting the job description</p>
                <p className="text-gray-500 text-sm">I'll extract the company, position, and required skills for you</p>
              </div>
            )}

            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line px-4 py-3 leading-relaxed" style={{ wordBreak: 'break-word' }}>
                    {message.content}
                  </p>

                  {/* Show extracted data with confirm button */}
                  {message.showConfirmation && message.data && (
                    <div className="mt-3 space-y-4 px-4 pb-3">
                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-xs text-gray-500 mb-1">Company</div>
                        <div className="font-semibold text-gray-900">{message.data.company}</div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-xs text-gray-500 mb-1">Position</div>
                        <div className="font-semibold text-gray-900">{message.data.position}</div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="text-xs text-gray-500 mb-1">Required Skills</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {message.data.skills?.map((skill) => (
                            <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs text-gray-500">Full Job Description</div>
                          <button
                            onClick={() => setIsJdExpanded(!isJdExpanded)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            {isJdExpanded ? 'Show Less' : 'Show More'}
                          </button>
                        </div>
                        <div className={`text-xs text-gray-700 whitespace-pre-wrap ${isJdExpanded ? '' : 'max-h-20 overflow-hidden relative'}`}>
                          {message.data.jd}
                          {!isJdExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleConfirm}
                          disabled={isSaving}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : '✓ Confirm & Save'}
                        </button>
                        <button
                          onClick={handleEdit}
                          disabled={isSaving}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={isInitialSubmit ? handleInitialSubmit : handleChatSubmit} className="flex gap-2">
              {isInitialSubmit ? (
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isChatProcessing}
                />
              ) : (
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me to make changes..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatProcessing || isSaving}
                />
              )}
              <button
                type="submit"
                disabled={isChatProcessing || !chatInput.trim() || isSaving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isChatProcessing ? 'Processing...' : isInitialSubmit ? 'Analyze' : 'Send'}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              {isInitialSubmit
                ? 'Paste the full job description and I\'ll extract the key information'
                : 'You can also click the buttons above to confirm or edit'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

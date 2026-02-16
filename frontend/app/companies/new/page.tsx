'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
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
        content: `I've analyzed the job description. Here's what I found:

**Company:** ${mockExtraction.company}
**Position:** ${mockExtraction.position}
**Required Skills:** ${mockExtraction.skills.join(', ')}

The full job description has been saved. Does this look correct? You can ask me to make any changes, or say "confirm" to save this position.`,
        data: mockExtraction
      }

      setChatMessages(prev => [...prev, assistantMessage])
      setIsChatProcessing(false)
    }, 1500)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !extractedData) return

    const userMessage: ChatMessage = { role: 'user', content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    const userInput = chatInput.toLowerCase()
    setChatInput('')
    setIsChatProcessing(true)

    // Check if user wants to confirm
    if (userInput.includes('confirm') || userInput.includes('yes') || userInput.includes('correct') || userInput.includes('save')) {
      // Save to backend
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
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: 'Perfect! The position has been saved successfully. Redirecting you to the positions list...'
          }
          setChatMessages(prev => [...prev, assistantMessage])
          setIsChatProcessing(false)

          setTimeout(() => {
            router.push('/companies')
          }, 1500)
          return
        } else {
          const error = await response.json()
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: `Sorry, there was an error saving the position: ${error.error}. Please try again.`
          }
          setChatMessages(prev => [...prev, assistantMessage])
          setIsChatProcessing(false)
          return
        }
      } catch (error) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, there was an error saving the position. Please try again.'
        }
        setChatMessages(prev => [...prev, assistantMessage])
        setIsChatProcessing(false)
        return
      }
    }

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
      } else if (userInput.includes('add') && userInput.includes('skill')) {
        const match = userInput.match(/add (.+?) (?:to )?skill/i) || userInput.match(/add (.+)/i)
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
        const match = userInput.match(/remove (.+?) (?:from )?skill/i) || userInput.match(/remove (.+)/i)
        if (match) {
          const skill = match[1].trim()
          newData.skills = newData.skills?.filter(s => s.toLowerCase() !== skill.toLowerCase())
          response = `Done! I've removed **${skill}** from the skills list.`
        }
      } else {
        response = `I can help you refine the information. You can:

• Change the company name (e.g., "Change company to Meta")
• Update the position (e.g., "Update position to Staff Engineer")
• Add skills (e.g., "Add Python to skills")
• Remove skills (e.g., "Remove React from skills")
• Say "confirm" or "save" when everything looks good

What would you like to adjust?`
      }

      setExtractedData(newData)

      // Add summary if data was changed
      if (response && !response.includes('can help you refine')) {
        response += `\n\nCurrent information:
**Company:** ${newData.company}
**Position:** ${newData.position}
**Skills:** ${newData.skills?.join(', ')}

Say "confirm" to save, or ask for more changes.`
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        data: newData
      }
      setChatMessages(prev => [...prev, assistantMessage])
      setIsChatProcessing(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/companies" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Positions
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Position</h1>
          <p className="text-gray-600 mt-2">Chat with AI to add a job position</p>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow">
          {/* Chat Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
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
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line" style={{ wordBreak: 'break-word' }}>
                    {message.content}
                  </p>
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
                  placeholder="Ask me to make changes, or say 'confirm' to save..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isChatProcessing}
                />
              )}
              <button
                type="submit"
                disabled={isChatProcessing || !chatInput.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isChatProcessing ? 'Processing...' : isInitialSubmit ? 'Analyze' : 'Send'}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              {isInitialSubmit
                ? 'Paste the full job description and I\'ll extract the key information'
                : 'Chat naturally - I\'ll understand what you want to change'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

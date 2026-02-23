'use client'

import { useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type ActionEvent = { type: 'action'; name: string; result: Record<string, unknown> }

export type Message = {
  role: 'user' | 'assistant'
  content: string
  actions?: ActionEvent[]
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role, content: m.content,
    }))

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: { currentPage: pathname },
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        const err = await res.text()
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err}` }])
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''
      const actions: ActionEvent[] = []

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const event = JSON.parse(data)
            if (event.type === 'text') {
              assistantContent += event.content
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, actions }
                return updated
              })
            } else if (event.type === 'action') {
              actions.push(event)
              if (event.name === 'navigate_to' && event.result?.navigateTo) {
                router.push(event.result.navigateTo as string)
              }
              // Trigger page data refresh when AI mutates data
              if (event.result?._refresh) {
                window.dispatchEvent(new CustomEvent('swissjob:refresh', {
                  detail: { scope: event.result._refresh },
                }))
              }
            } else if (event.type === 'error') {
              assistantContent += `\n\nError: ${event.content}`
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
                return updated
              })
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${(err as Error).message}` }])
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [messages, pathname, router])

  const clearMessages = useCallback(() => setMessages([]), [])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { messages, sendMessage, isStreaming, clearMessages, stopStreaming }
}
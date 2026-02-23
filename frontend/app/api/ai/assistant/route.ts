import { NextRequest } from 'next/server'
import { getOpenAIClient } from '@/lib/app-settings'
import { TOOL_DEFINITIONS, executeToolCall } from '@/lib/ai-tools'

export const runtime = 'nodejs'
export const maxDuration = 60

function buildSystemPrompt(context: { currentPage?: string }) {
  return `You are SwissJob AI, a job search assistant. You help users manage job applications, schedule interviews, track skills, and prepare for interviews.

Current page: ${context.currentPage || 'unknown'}
Today's date: ${new Date().toISOString().split('T')[0]}

You can:
- Schedule interviews (suggest reasonable times if user doesn't specify)
- List and search job applications
- Add new job applications
- View upcoming interviews
- Manage skills
- Navigate to different pages

Be concise and action-oriented. When scheduling, confirm details before creating.
Respond in the same language the user uses.`
}

export async function POST(request: NextRequest) {
  const { messages, context } = await request.json()

  let client, settings
  try {
    const result = await getOpenAIClient()
    client = result.client
    settings = result.settings
  } catch {
    return Response.json(
      { error: 'AI API key not configured. Please set it in Settings.' },
      { status: 400 }
    )
  }

  const systemPrompt = buildSystemPrompt(context || {})
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let currentMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messages,
        ]
        let looping = true

        while (looping) {
          const response = await client.chat.completions.create({
            model: settings.aiModel?.trim() || 'gpt-4o-mini',
            messages: currentMessages,
            tools: TOOL_DEFINITIONS,
            stream: true,
          })

          const toolCalls = new Map<number, { id: string; name: string; arguments: string }>()
          let hasToolCalls = false

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta

            if (delta?.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n\n`))
            }

            if (delta?.tool_calls) {
              hasToolCalls = true
              for (const tc of delta.tool_calls) {
                const existing = toolCalls.get(tc.index) || { id: '', name: '', arguments: '' }
                if (tc.id) existing.id = tc.id
                if (tc.function?.name) existing.name = tc.function.name
                if (tc.function?.arguments) existing.arguments += tc.function.arguments
                toolCalls.set(tc.index, existing)
              }
            }
          }

          if (hasToolCalls) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const assistantMsg: any = {
              role: 'assistant',
              tool_calls: Array.from(toolCalls.values()).map(tc => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.arguments },
              })),
            }
            currentMessages.push(assistantMsg)

            for (const tc of toolCalls.values()) {
              const args = JSON.parse(tc.arguments)
              const result = await executeToolCall(tc.name, args)

              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'action', name: tc.name, result })}\n\n`
              ))

              currentMessages.push({
                role: 'tool' as const,
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any)
            }
          } else {
            looping = false
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
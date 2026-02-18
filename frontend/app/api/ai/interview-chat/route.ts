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

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { text, context = 'resume' } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a skill extraction assistant. Extract technical skills and key competencies from the provided text and return ONLY a JSON array of skill names.'
        },
        {
          role: 'user',
          content: `Extract technical skills and key competencies from the following ${context}.\n\nText:\n${text}\n\nReturn format: ["skill1", "skill2", "skill3"]`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    const result = JSON.parse(content)

    // Ensure we return an array of skills
    const skills = Array.isArray(result) ? result : (result.skills || [])

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error extracting skills:', error)
    return NextResponse.json(
      { error: 'Failed to extract skills', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

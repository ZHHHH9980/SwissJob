import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { transcript, jd, resume } = await request.json()

    if (!transcript || !jd || !resume) {
      return NextResponse.json(
        { error: 'Transcript, job description, and resume are required' },
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
          content: 'You are an interview performance analyst. Analyze interview transcripts and provide detailed feedback in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this interview performance based on the job requirements and candidate's resume.\n\n【Job Requirements】\n${jd}\n\n【Candidate Resume】\n${resume}\n\n【Interview Transcript】\n${transcript}\n\nProvide analysis in JSON format:\n{\n  "matchScore": 85,\n  "strengths": ["strength1", "strength2"],\n  "weaknesses": ["weakness1", "weakness2"],\n  "suggestions": ["suggestion1", "suggestion2"],\n  "summary": "Overall assessment summary"\n}`
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

    // Ensure all expected fields exist with proper defaults
    const analysis = {
      matchScore: typeof result.matchScore === 'number' ? result.matchScore : 0,
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      summary: result.summary || 'Analysis completed'
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing interview:', error)
    return NextResponse.json(
      { error: 'Failed to analyze interview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

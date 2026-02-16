import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { jd, resume, num_questions = 8 } = await request.json()

    if (!jd || !resume) {
      return NextResponse.json(
        { error: 'Job description and resume are required' },
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
          content: 'You are an interview question generator. Create targeted interview questions based on job requirements and candidate background. Return questions in JSON format.'
        },
        {
          role: 'user',
          content: `Generate ${num_questions} targeted interview questions based on the job requirements and candidate's background.\n\n【Job Requirements】\n${jd}\n\n【Candidate Resume】\n${resume}\n\nReturn ONLY a JSON array of questions: ["question1", "question2", ...]`
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

    // Ensure we return an array of questions
    const questions = Array.isArray(result) ? result : (result.questions || [])

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error generating mock questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate mock questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

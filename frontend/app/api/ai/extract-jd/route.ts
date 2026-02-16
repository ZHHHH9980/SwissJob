import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { jd_text } = await request.json()

    if (!jd_text) {
      return NextResponse.json(
        { error: 'Job description text is required' },
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
          content: 'You are a job description parser. Extract structured information from job descriptions and return it in JSON format.'
        },
        {
          role: 'user',
          content: `Extract key information from this job description and return as JSON.\n\nJob Description:\n${jd_text}\n\nReturn format:\n{\n  "company": "Company name",\n  "position": "Job title",\n  "skills": ["skill1", "skill2", "skill3"],\n  "location": "Location if mentioned",\n  "salary": "Salary range if mentioned"\n}\n\nIf any field is not found, use null.`
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

    // Ensure all expected fields exist
    const jdInfo = {
      company: result.company || null,
      position: result.position || null,
      skills: Array.isArray(result.skills) ? result.skills : [],
      location: result.location || null,
      salary: result.salary || null
    }

    return NextResponse.json(jdInfo)
  } catch (error) {
    console.error('Error extracting JD info:', error)
    return NextResponse.json(
      { error: 'Failed to extract job description info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

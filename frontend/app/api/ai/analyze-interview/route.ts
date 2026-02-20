import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIClient } from '@/lib/app-settings'
import { parseJsonFromText } from '@/lib/parse-json'
import { readSettings } from '@/lib/settings'

export async function POST(request: NextRequest) {
  try {
    const { transcript, jd, resume } = await request.json()

    if (!transcript || !jd) {
      return NextResponse.json(
        { error: 'Transcript and job description are required' },
        { status: 400 }
      )
    }

    let resumeText = typeof resume === 'string' ? resume.trim() : ''
    if (!resumeText) {
      const settings = await readSettings()
      resumeText = settings.resumeText?.trim() || ''
    }

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text not found. Please upload your resume first.' },
        { status: 400 }
      )
    }

    const { client, settings: aiSettings } = await getOpenAIClient()

    const completion = await client.chat.completions.create({
      model: aiSettings.aiModel,
      messages: [
        {
          role: 'system',
          content: 'You are an interview performance analyst. Analyze interview transcripts and provide detailed feedback in JSON format.'
        },
        {
          role: 'user',
          content: `Analyze this interview performance based on the job requirements and candidate's resume.\n\n【Job Requirements】\n${jd}\n\n【Candidate Resume】\n${resumeText}\n\n【Interview Transcript】\n${transcript}\n\nProvide analysis in JSON format:\n{\n  \"matchScore\": 85,\n  \"strengths\": [\"strength1\", \"strength2\"],\n  \"weaknesses\": [\"weakness1\", \"weakness2\"],\n  \"suggestions\": [{\"weakness\": \"weakness description\", \"advice\": \"specific improvement advice\"}],\n  \"summary\": \"Overall assessment summary\"\n}`
        }
      ]
    })

    const content = completion.choices[0].message.content
    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    const result = parseJsonFromText(content)

    // Ensure all expected fields exist with proper defaults
    const analysis = {
      matchScore: typeof result.matchScore === 'number' ? result.matchScore : 0,
      strengths: Array.isArray(result.strengths) ? result.strengths : [],
      weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
      suggestions: Array.isArray(result.suggestions)
        ? result.suggestions.map((s: unknown) =>
            typeof s === 'object' && s !== null && 'weakness' in s
              ? s
              : { weakness: String(s), advice: '' }
          )
        : [],
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

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { readSettings } from '@/lib/settings'
import { getSkills, createSkill } from '@/lib/notion'

async function getClient(): Promise<OpenAI> {
  const s = await readSettings()
  const apiKey = s.aiApiKey?.trim() || process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('AI API key not configured')
  return new OpenAI({
    apiKey,
    baseURL: s.aiBaseUrl?.trim() || 'https://api.openai.com/v1',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { jd_text } = await request.json()

    if (!jd_text) {
      return NextResponse.json(
        { error: 'Job description text is required' },
        { status: 400 }
      )
    }

    const openai = await getClient()
    const model = (await readSettings()).aiModel?.trim() || 'gpt-4o-mini'

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a job description parser. Extract structured information from job descriptions and return it in JSON format.'
        },
        {
          role: 'user',
          content: `Extract key information from this job description and return as JSON.\n\nJob Description:\n${jd_text}\n\nReturn format:\n{\n  "company": "Company name",\n  "position": "Job title",\n  "skills": [{"name": "skill1", "category": "Frontend"}, {"name": "skill2", "category": "Backend"}],\n  "location": "Location if mentioned",\n  "salary": "Salary range if mentioned"\n}\n\nFor skills, categorize each into one of: Frontend, Backend, DevOps, Database, Language, Framework, Tool, Soft Skill, Other.\nIf any field is not found, use null.`
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

    // Normalize skills: support both string[] and {name, category}[]
    const rawSkills: Array<{ name: string; category?: string }> = Array.isArray(result.skills)
      ? result.skills.map((s: string | { name: string; category?: string }) =>
          typeof s === 'string' ? { name: s } : s
        )
      : []

    const jdInfo = {
      company: result.company || null,
      position: result.position || null,
      skills: rawSkills.map(s => s.name),
      location: result.location || null,
      salary: result.salary || null
    }

    // Write extracted skills to Notion Skill table (deduplicate)
    try {
      const existingSkills = await getSkills()
      const existingNames = new Set(existingSkills.map(s => s.name.toLowerCase()))
      for (const skill of rawSkills) {
        if (!existingNames.has(skill.name.toLowerCase())) {
          await createSkill({ name: skill.name, category: skill.category || 'From JD' })
          existingNames.add(skill.name.toLowerCase())
        }
      }
    } catch (e) {
      console.error('Failed to write skills to Notion (non-blocking):', e)
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

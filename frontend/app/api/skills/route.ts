import { NextRequest, NextResponse } from 'next/server'
import { getSkills, createSkill } from '@/lib/notion'

export async function GET() {
  try {
    const skills = await getSkills()
    return NextResponse.json(skills)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('not configured')) {
      return NextResponse.json([])
    }
    console.error('Error fetching skills:', error)
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, level, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const skill = await createSkill({ name, category, level, notes })
    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error creating skill:', error)
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 })
  }
}

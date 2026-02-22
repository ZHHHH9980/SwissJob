import { NextRequest, NextResponse } from 'next/server'
import { getInterviews, createInterview } from '@/lib/notion'

export async function GET(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId') || undefined
    const interviews = await getInterviews(companyId)
    return NextResponse.json(interviews)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('not configured')) {
      return NextResponse.json([])
    }
    console.error('Error fetching interviews:', error)
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyId, position, date, status, notes } = body

    if (!position) {
      return NextResponse.json({ error: 'Missing required field: position' }, { status: 400 })
    }

    const interview = await createInterview({
      companyId: companyId || '',
      position,
      date,
      status: status || 'scheduled',
      notes,
    })
    return NextResponse.json(interview)
  } catch (error) {
    console.error('Error creating interview:', error)
    return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 })
  }
}

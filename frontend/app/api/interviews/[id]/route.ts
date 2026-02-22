import { NextRequest, NextResponse } from 'next/server'
import { getInterview, updateInterview, deleteInterview } from '@/lib/notion'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interview = await getInterview(params.id)
    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
    }
    return NextResponse.json(interview)
  } catch (error) {
    console.error('Error fetching interview:', error)
    return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { position, date, status, notes, transcript, aiAnalysis } = body
    const interview = await updateInterview(params.id, {
      position, date, status, notes, transcript, aiAnalysis,
    })
    return NextResponse.json(interview)
  } catch (error) {
    console.error('Error updating interview:', error)
    return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteInterview(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting interview:', error)
    return NextResponse.json({ error: 'Failed to delete interview' }, { status: 500 })
  }
}

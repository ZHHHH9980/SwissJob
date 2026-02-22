import { NextRequest, NextResponse } from 'next/server'
import { updateSkill, deleteSkill } from '@/lib/notion'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, category, level, notes } = body
    const skill = await updateSkill(params.id, { name, category, level, notes })
    return NextResponse.json(skill)
  } catch (error) {
    console.error('Error updating skill:', error)
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSkill(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting skill:', error)
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 })
  }
}

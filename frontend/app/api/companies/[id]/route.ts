import { NextRequest, NextResponse } from 'next/server'
import { getCompany, updateCompany, deleteCompany } from '@/lib/notion'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const company = await getCompany(params.id)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Failed to fetch company' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, website, description, jobDescription, status } = body
    const company = await updateCompany(params.id, { name, website, description, jobDescription, status })
    return NextResponse.json(company)
  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PATCH(request, { params })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteCompany(params.id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
  }
}

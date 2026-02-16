import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        interviews: true,
        mockInterviews: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, jd, skills } = body

    if (!name || !position || !jd) {
      return NextResponse.json(
        { error: 'Missing required fields: name, position, jd' },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name,
        position,
        jd,
        skills: skills ? JSON.stringify(skills) : null,
        status: 'pending'
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}

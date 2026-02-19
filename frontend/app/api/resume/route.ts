import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { resumeText: true, resumePath: true, updatedAt: true }
    })

    if (!user?.resumeText) {
      return NextResponse.json({ hasResume: false })
    }

    return NextResponse.json({
      hasResume: true,
      filename: user.resumePath?.split('/').pop() || 'resume.pdf',
      textPreview: user.resumeText.substring(0, 300),
      uploadedAt: user.updatedAt.toISOString()
    })
  } catch (error) {
    return NextResponse.json({ hasResume: false })
  }
}

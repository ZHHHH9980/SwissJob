import { NextResponse } from 'next/server'
import { readSettings } from '@/lib/settings'

export async function GET() {
  try {
    const { resumePath, resumeText } = await readSettings()
    return NextResponse.json({ resumePath, resumeText })
  } catch (error) {
    return NextResponse.json({ resumePath: '', resumeText: '' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import pdf from 'pdf-parse'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPE = 'application/pdf'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== ALLOWED_TYPE) {
      return NextResponse.json(
        { error: '只允许上传 PDF 文件' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小不能超过 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse PDF to extract text
    let extractedText = ''
    try {
      const pdfData = await pdf(buffer)
      extractedText = pdfData.text
    } catch (error) {
      console.error('PDF parsing error:', error)
      return NextResponse.json(
        { error: 'PDF 解析失败' },
        { status: 500 }
      )
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const filename = `resume_${timestamp}_${file.name}`
    const filepath = join(process.cwd(), '..', 'data', 'resumes', filename)

    // Save file to disk
    try {
      await writeFile(filepath, buffer)
    } catch (error) {
      console.error('File save error:', error)
      return NextResponse.json(
        { error: '文件保存失败' },
        { status: 500 }
      )
    }

    // Get or create user (for now, we'll use a single user)
    let user = await prisma.user.findFirst()

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: 'Default User',
          resumePath: filepath,
          resumeText: extractedText
        }
      })
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          resumePath: filepath,
          resumeText: extractedText,
          updatedAt: new Date()
        }
      })
    }

    // Return success response with fileId and text preview
    return NextResponse.json({
      success: true,
      fileId: user.id,
      filename: filename,
      textPreview: extractedText.substring(0, 500),
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    )
  }
}

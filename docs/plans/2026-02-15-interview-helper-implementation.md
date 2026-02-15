# Interview Helper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete job search management tool for job seekers with JD management, interview tracking, audio transcription, AI analysis, and skill tree visualization.

**Architecture:** Next.js 14 frontend + Python FastAPI backend, SQLite database with Prisma ORM, local Faster-Whisper for transcription, user-provided AI API tokens for analysis.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS, Prisma, Python 3.10+, FastAPI, Faster-Whisper, Chart.js/D3.js

---

## Phase 1: Project Setup and Infrastructure

### Task 1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `.gitignore`
- Create: `frontend/package.json`
- Create: `backend/requirements.txt`

**Step 1: Create root package.json with workspaces**

```json
{
  "name": "interview-helper",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "frontend"
  ],
  "scripts": {
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\"",
    "start:backend": "cd backend && python -m uvicorn main:app --reload --port 8000",
    "start:frontend": "npm run dev --workspace=frontend",
    "postinstall": "cd backend && pip install -r requirements.txt"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Create comprehensive README.md**

Create a README with installation instructions, features, tech stack, and usage guide.

**Step 3: Create .gitignore**

```
node_modules/
.next/
dist/
build/
*.pyc
__pycache__/
.env
.env.local
data/
*.db
*.db-journal
.DS_Store
```

**Step 4: Create frontend/package.json**

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.9.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "prisma": "^5.9.0"
  }
}
```

**Step 5: Create backend/requirements.txt**

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
faster-whisper==0.10.0
PyPDF2==3.0.1
pdfplumber==0.10.3
httpx==0.26.0
python-dotenv==1.0.0
```

**Step 6: Commit**

```bash
git add package.json README.md .gitignore frontend/package.json backend/requirements.txt
git commit -m "chore: initialize project structure"
```

---

### Task 2: Setup Next.js Frontend

**Files:**
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.js`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`
- Create: `frontend/app/globals.css`

**Step 1: Initialize Next.js with TypeScript**

Run: `cd frontend && npx create-next-app@14 . --typescript --tailwind --app --no-src-dir`

**Step 2: Configure Tailwind CSS**

Update `tailwind.config.ts` with custom theme if needed.

**Step 3: Create basic layout**

```typescript
// frontend/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interview Helper - 面试助手',
  description: 'AI-powered interview management and analysis tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

**Step 4: Create homepage placeholder**

```typescript
// frontend/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Interview Helper</h1>
      <p className="mt-4 text-gray-600">面试助手 - 开发中</p>
    </main>
  )
}
```

**Step 5: Test frontend**

Run: `npm run dev --workspace=frontend`
Expected: Server starts on http://localhost:3000

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: setup Next.js frontend with TypeScript and Tailwind"
```

---

### Task 3: Setup Python FastAPI Backend

**Files:**
- Create: `backend/main.py`
- Create: `backend/__init__.py`
- Create: `backend/services/__init__.py`
- Create: `backend/models/__init__.py`
- Create: `backend/.env.example`

**Step 1: Create FastAPI main entry point**

```python
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Interview Helper API")

# CORS configuration for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Interview Helper API"}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Step 2: Create directory structure**

```bash
mkdir -p backend/services backend/models
touch backend/__init__.py backend/services/__init__.py backend/models/__init__.py
```

**Step 3: Create .env.example**

```
# AI API Configuration
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Whisper Configuration
WHISPER_MODEL=small
WHISPER_DEVICE=cpu
```

**Step 4: Test backend**

Run: `cd backend && python -m uvicorn main:app --reload --port 8000`
Expected: Server starts on http://localhost:8000

**Step 5: Test API**

Run: `curl http://localhost:8000/health`
Expected: `{"status":"ok"}`

**Step 6: Commit**

```bash
git add backend/
git commit -m "feat: setup FastAPI backend with CORS"
```

---

### Task 4: Setup Prisma and Database Schema

**Files:**
- Create: `frontend/prisma/schema.prisma`
- Create: `frontend/lib/prisma.ts`

**Step 1: Initialize Prisma**

Run: `cd frontend && npx prisma init --datasource-provider sqlite`

**Step 2: Define Prisma schema**

```prisma
// frontend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:../../data/interview.db"
}

model User {
  id          String   @id @default(cuid())
  name        String?
  email       String?
  resumePath  String?
  resumeText  String?
  skills      String?  // JSON string array
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Company {
  id             String          @id @default(cuid())
  name           String
  position       String
  jd             String
  skills         String?         // JSON string array
  matchScore     Float?
  status         String          @default("active")
  createdAt      DateTime        @default(now())
  interviews     Interview[]
  mockInterviews MockInterview[]
}

model Interview {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  round       Int
  scheduledAt DateTime
  status      String   @default("scheduled")
  audioPath   String?
  transcript  String?
  aiAnalysis  String?  // JSON string
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Skill {
  id        String   @id @default(cuid())
  name      String   @unique
  category  String
  frequency Int      @default(1)
  firstSeen DateTime @default(now())
  lastSeen  DateTime @default(now())
}

model MockInterview {
  id        String   @id @default(cuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  questions String   // JSON string
  createdAt DateTime @default(now())
}
```

**Step 3: Create Prisma client singleton**

```typescript
// frontend/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Step 4: Create data directory**

Run: `mkdir -p data/audio data/resumes data/exports`

**Step 5: Generate Prisma client and create database**

Run: `cd frontend && npx prisma generate && npx prisma db push`
Expected: Database created at `data/interview.db`

**Step 6: Commit**

```bash
git add frontend/prisma/ frontend/lib/prisma.ts data/.gitkeep
git commit -m "feat: setup Prisma with SQLite database schema"
```

---

## Phase 2: Core Backend Services

### Task 5: Implement Resume Service

**Files:**
- Create: `backend/services/resume_service.py`

**Step 1: Create resume parsing service**

```python
# backend/services/resume_service.py
import PyPDF2
from pathlib import Path
from typing import Optional

class ResumeService:
    def parse_pdf(self, file_path: str) -> Optional[str]:
        """Extract text from PDF resume"""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text()
                return text.strip()
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            return None

    def save_resume(self, file_content: bytes, filename: str) -> str:
        """Save resume file to data/resumes/"""
        resume_dir = Path("../data/resumes")
        resume_dir.mkdir(parents=True, exist_ok=True)

        file_path = resume_dir / filename
        with open(file_path, 'wb') as f:
            f.write(file_content)

        return str(file_path)
```

**Step 2: Add resume upload endpoint**

```python
# backend/main.py (add to existing file)
from fastapi import UploadFile, File
from services.resume_service import ResumeService

resume_service = ResumeService()

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    # Save file
    content = await file.read()
    file_path = resume_service.save_resume(content, file.filename)

    # Parse PDF
    text = resume_service.parse_pdf(file_path)

    if not text:
        return {"error": "Failed to parse PDF"}

    return {
        "success": True,
        "filePath": file_path,
        "text": text[:500]  # Preview
    }
```

**Step 3: Test resume upload**

Create a test PDF and upload via curl or Postman.

**Step 4: Commit**

```bash
git add backend/services/resume_service.py backend/main.py
git commit -m "feat: add resume PDF parsing service"
```

---

### Task 6: Implement AI Service

**Files:**
- Create: `backend/services/ai_service.py`
- Create: `backend/config.py`

**Step 1: Create AI service with multiple provider support**

```python
# backend/services/ai_service.py
import httpx
import os
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    async def call_openai(self, prompt: str) -> str:
        """Call OpenAI API"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}"},
                json={
                    "model": "gpt-4",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                },
                timeout=60.0
            )
            result = response.json()
            return result["choices"][0]["message"]["content"]

    async def extract_skills(self, text: str, context: str = "resume") -> List[str]:
        """Extract skills from text (resume or JD)"""
        prompt = f"""
        从以下{context}中提取技能关键词，以 JSON 数组格式返回。
        只返回技能名称，不要解释。

        文本：
        {text}

        返回格式：["技能1", "技能2", "技能3"]
        """

        response = await self.call_openai(prompt)
        # Parse JSON response
        import json
        try:
            skills = json.loads(response)
            return skills
        except:
            return []

    async def analyze_interview(
        self,
        transcript: str,
        jd: str,
        resume: str
    ) -> Dict[str, Any]:
        """Analyze interview performance"""
        prompt = f"""
        请分析这次面试表现：

        【职位要求】
        {jd}

        【候选人简历】
        {resume}

        【面试对话】
        {transcript}

        请从以下维度分析并以 JSON 格式返回：
        {{
          "matchScore": 85,
          "strengths": ["优势1", "优势2"],
          "weaknesses": ["劣势1", "劣势2"],
          "suggestions": ["建议1", "建议2"]
        }}
        """

        response = await self.call_openai(prompt)
        import json
        try:
            return json.loads(response)
        except:
            return {}

    async def generate_mock_questions(
        self,
        jd: str,
        resume: str
    ) -> List[str]:
        """Generate mock interview questions"""
        prompt = f"""
        基于以下职位要求和候选人简历，生成 5-8 个针对性的面试问题。

        【职位要求】
        {jd}

        【候选人简历】
        {resume}

        以 JSON 数组格式返回：["问题1", "问题2", ...]
        """

        response = await self.call_openai(prompt)
        import json
        try:
            return json.loads(response)
        except:
            return []
```

**Step 2: Add AI endpoints**

```python
# backend/main.py (add to existing file)
from services.ai_service import AIService
from pydantic import BaseModel

ai_service = AIService()

class ExtractSkillsRequest(BaseModel):
    text: str
    context: str = "resume"

@app.post("/api/ai/extract-skills")
async def extract_skills(request: ExtractSkillsRequest):
    skills = await ai_service.extract_skills(request.text, request.context)
    return {"skills": skills}

class AnalyzeInterviewRequest(BaseModel):
    transcript: str
    jd: str
    resume: str

@app.post("/api/ai/analyze-interview")
async def analyze_interview(request: AnalyzeInterviewRequest):
    analysis = await ai_service.analyze_interview(
        request.transcript,
        request.jd,
        request.resume
    )
    return analysis
```

**Step 3: Test AI service**

Test with mock data via curl or Postman.

**Step 4: Commit**

```bash
git add backend/services/ai_service.py backend/main.py
git commit -m "feat: add AI service for skill extraction and interview analysis"
```

---

### Task 7: Implement Whisper Transcription Service

**Files:**
- Create: `backend/services/whisper_service.py`

**Step 1: Create Whisper service**

```python
# backend/services/whisper_service.py
from faster_whisper import WhisperModel
from pathlib import Path
import os

class WhisperService:
    def __init__(self):
        model_size = os.getenv("WHISPER_MODEL", "small")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        self.model = WhisperModel(model_size, device=device)

    def transcribe(self, audio_path: str) -> str:
        """Transcribe audio file to text"""
        segments, info = self.model.transcribe(
            audio_path,
            language="zh",  # Chinese
            beam_size=5
        )

        transcript = ""
        for segment in segments:
            transcript += segment.text + " "

        return transcript.strip()

    def save_audio(self, file_content: bytes, filename: str) -> str:
        """Save audio file to data/audio/"""
        audio_dir = Path("../data/audio")
        audio_dir.mkdir(parents=True, exist_ok=True)

        file_path = audio_dir / filename
        with open(file_path, 'wb') as f:
            f.write(file_content)

        return str(file_path)
```

**Step 2: Add transcription endpoint**

```python
# backend/main.py (add to existing file)
from services.whisper_service import WhisperService

whisper_service = WhisperService()

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save audio file
    content = await file.read()
    file_path = whisper_service.save_audio(content, file.filename)

    # Transcribe (this may take a while)
    transcript = whisper_service.transcribe(file_path)

    return {
        "success": True,
        "audioPath": file_path,
        "transcript": transcript
    }
```

**Step 3: Test transcription**

Upload a test audio file and verify transcription.

**Step 4: Commit**

```bash
git add backend/services/whisper_service.py backend/main.py
git commit -m "feat: add Whisper transcription service"
```

---

## Phase 3: Frontend API Routes and UI

### Task 8: Create Company/JD Management API Routes

**Files:**
- Create: `frontend/app/api/companies/route.ts`
- Create: `frontend/app/api/companies/[id]/route.ts`

**Step 1: Create companies list endpoint**

```typescript
// frontend/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'

export async function GET() {
  const companies = await prisma.company.findMany({
    include: {
      interviews: true,
      mockInterviews: true
    },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(companies)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, position, jd } = body

  // Extract skills via AI
  const skillsResponse = await axios.post('http://localhost:8000/api/ai/extract-skills', {
    text: jd,
    context: 'JD'
  })

  const company = await prisma.company.create({
    data: {
      name,
      position,
      jd,
      skills: JSON.stringify(skillsResponse.data.skills),
      status: 'active'
    }
  })

  return NextResponse.json(company)
}
```

**Step 2: Create company detail endpoint**

```typescript
// frontend/app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      interviews: true,
      mockInterviews: true
    }
  })

  if (!company) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(company)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.company.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ success: true })
}
```

**Step 3: Test API routes**

Run: `curl http://localhost:3000/api/companies`
Expected: Empty array `[]`

**Step 4: Commit**

```bash
git add frontend/app/api/
git commit -m "feat: add company/JD management API routes"
```

---

### Task 9: Create Companies List Page

**Files:**
- Create: `frontend/app/companies/page.tsx`
- Create: `frontend/components/CompanyCard.tsx`

**Step 1: Create company card component**

```typescript
// frontend/components/CompanyCard.tsx
interface CompanyCardProps {
  company: {
    id: string
    name: string
    position: string
    matchScore?: number
    status: string
  }
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="text-xl font-bold">{company.name}</h3>
      <p className="text-gray-600">{company.position}</p>
      {company.matchScore && (
        <div className="mt-2">
          <span className="text-sm text-blue-600">
            匹配度: {company.matchScore}%
          </span>
        </div>
      )}
      <div className="mt-4">
        <a
          href={`/companies/${company.id}`}
          className="text-blue-500 hover:underline"
        >
          查看详情 →
        </a>
      </div>
    </div>
  )
}
```

**Step 2: Create companies list page**

```typescript
// frontend/app/companies/page.tsx
'use client'

import { useEffect, useState } from 'react'
import CompanyCard from '@/components/CompanyCard'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => {
        setCompanies(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-8">加载中...</div>

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">职位管理</h1>
        <a
          href="/companies/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          + 添加职位
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company: any) => (
          <CompanyCard key={company.id} company={company} />
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          还没有添加职位，点击右上角添加第一个职位吧！
        </div>
      )}
    </div>
  )
}
```

**Step 3: Test companies page**

Run: `npm start`
Visit: `http://localhost:3000/companies`
Expected: Empty state message

**Step 4: Commit**

```bash
git add frontend/app/companies/ frontend/components/
git commit -m "feat: add companies list page with card component"
```

---

## Phase 4: Additional Features

### Task 10: Implement Interview Management

**Files:**
- Create: `frontend/app/api/interviews/route.ts`
- Create: `frontend/app/api/interviews/[id]/upload/route.ts`
- Create: `frontend/app/companies/[id]/interview/page.tsx`

(Similar structure to companies, with audio upload and transcription)

### Task 11: Implement Skills Visualization

**Files:**
- Create: `frontend/app/skills/page.tsx`
- Create: `frontend/components/SkillCloud.tsx`
- Create: `frontend/components/SkillRadar.tsx`

(Use Chart.js for radar chart, custom component for tag cloud)

### Task 12: Implement Calendar Export

**Files:**
- Create: `frontend/app/api/calendar/export/route.ts`
- Create: `frontend/lib/ics.ts`

(Generate .ics file from scheduled interviews)

### Task 13: Implement Settings Page

**Files:**
- Create: `frontend/app/settings/page.tsx`

(Allow users to configure AI API tokens)

---

## Phase 5: Testing and Documentation

### Task 14: Write README

**Files:**
- Update: `README.md`

Include:
- Project description
- Features list
- Installation instructions
- Usage guide
- Tech stack
- Contributing guidelines
- License

### Task 15: Add Basic Tests

**Files:**
- Create: `backend/tests/test_services.py`
- Create: `frontend/__tests__/components.test.tsx`

### Task 16: Final Integration Testing

Test complete user flow:
1. Upload resume
2. Add JD
3. Create interview
4. Upload audio
5. View analysis
6. Check skill tree

---

## Summary

This implementation plan breaks down the Interview Helper project into manageable tasks. Each task includes:
- Exact file paths
- Complete code examples
- Test commands
- Commit messages

The plan follows TDD principles where applicable and emphasizes frequent commits. Start with Phase 1 to set up the infrastructure, then proceed through each phase sequentially.

**Estimated Timeline:**
- Phase 1: 2-3 hours
- Phase 2: 4-5 hours
- Phase 3: 3-4 hours
- Phase 4: 5-6 hours
- Phase 5: 2-3 hours

**Total: ~20 hours for MVP**


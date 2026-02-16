# SwissJob 纯 Next.js 架构迁移实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将 SwissJob 从 Next.js + FastAPI 双架构迁移到纯 Next.js 单架构

**架构：** 删除 Python 后端，将所有功能迁移到 Next.js API Routes，使用 OpenAI SDK 和 pdf-parse 库

**技术栈：** Next.js 14, TypeScript, OpenAI SDK, pdf-parse, Prisma, SQLite

---

## Task 1: 安装依赖并更新 package.json

**Files:**
- Modify: `package.json`

**Step 1: 安装新依赖**

Run: `npm install openai pdf-parse`
Expected: 成功安装 openai 和 pdf-parse 包

**Step 2: 更新 package.json scripts**

Edit `package.json`:
```json
{
  "scripts": {
    "dev": "next dev --workspace=frontend",
    "build": "next build --workspace=frontend",
    "start": "next start --workspace=frontend"
  }
}
```

移除：
- `start:backend`
- `start:frontend`
- `start` (concurrently 脚本)

**Step 3: 移除 concurrently 依赖**

Run: `npm uninstall concurrently`
Expected: 成功移除 concurrently

**Step 4: 提交更改**

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies for Next.js-only architecture"
```

---

## Task 2: 创建 PDF 上传 API Route

**Files:**
- Create: `frontend/app/api/resume/upload/route.ts`

**Step 1: 创建目录结构**

Run: `mkdir -p frontend/app/api/resume`
Expected: 目录创建成功

**Step 2: 创建 PDF 上传 API**

Create `frontend/app/api/resume/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const RESUME_DIR = join(process.cwd(), 'data', 'resumes')

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 413 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse PDF
    const data = await pdf(buffer)
    const text = data.text.trim()

    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: 'Failed to parse PDF or PDF is empty' },
        { status: 400 }
      )
    }

    // Save file
    await mkdir(RESUME_DIR, { recursive: true })
    const fileId = randomUUID()
    const fileName = `${fileId}.pdf`
    const filePath = join(RESUME_DIR, fileName)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      success: true,
      fileId,
      text: text.substring(0, 500) // Preview
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}
```

**Step 3: 测试 API（手动）**

启动开发服务器：`npm run dev`
使用 curl 或 Postman 测试上传 PDF
Expected: 返回 fileId 和文本预览

**Step 4: 提交更改**

```bash
git add frontend/app/api/resume/upload/route.ts
git commit -m "feat: add PDF upload API route"
```

---

## Task 3: 创建 AI 服务 API Routes

**Files:**
- Create: `frontend/app/api/ai/extract-skills/route.ts`
- Create: `frontend/app/api/ai/extract-jd/route.ts`
- Create: `frontend/app/api/ai/analyze-interview/route.ts`
- Create: `frontend/app/api/ai/mock-questions/route.ts`

**Step 1: 创建目录结构**

Run: `mkdir -p frontend/app/api/ai/{extract-skills,extract-jd,analyze-interview,mock-questions}`
Expected: 所有目录创建成功

**Step 2: 创建所有 AI API Routes**

参考设计文档中的代码示例，创建四个 API routes。

**Step 3: 提交更改**

```bash
git add frontend/app/api/ai/
git commit -m "feat: add AI service API routes"
```

---

## Task 4: 创建 Whisper 转录 API Route

**Files:**
- Create: `frontend/app/api/transcribe/route.ts`

**Step 1: 创建 Whisper API**

参考设计文档中的代码示例创建。

**Step 2: 提交更改**

```bash
git add frontend/app/api/transcribe/
git commit -m "feat: add Whisper transcription API route"
```

---

## Task 5: 创建本地 Whisper 服务脚本（可选）

**Files:**
- Create: `scripts/whisper-server.py`
- Create: `scripts/requirements.txt`
- Create: `scripts/README.md`

**Step 1: 创建所有脚本文件**

参考设计文档中的代码示例。

**Step 2: 提交更改**

```bash
git add scripts/
git commit -m "feat: add optional local Whisper service"
```

---

## Task 6: 更新环境变量配置

**Files:**
- Modify: `.env.example`

**Step 1: 更新 .env.example**

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-api-key-here

# Whisper Mode (Optional)
# Options: none | api | local
WHISPER_MODE=none

# Database URL
DATABASE_URL="file:./dev.db"
```

**Step 2: 删除旧的 backend/.env**

Run: `rm -f backend/.env backend/.env.example`

**Step 3: 提交更改**

```bash
git add .env.example
git commit -m "chore: update environment configuration"
```

---

## Task 7: 更新 setup.sh 脚本

**Files:**
- Modify: `setup.sh`

**Step 1: 简化 setup.sh**

移除所有 Python 相关的安装步骤，只保留：
- Node.js 依赖安装
- 环境变量配置
- 数据库初始化

**Step 2: 提交更改**

```bash
git add setup.sh
git commit -m "chore: simplify setup script"
```

---

## Task 8: 更新 README 文档

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: 更新安装说明**

简化为只需要 Node.js 的安装流程。

**Step 2: 添加 Whisper 配置说明**

说明三种 Whisper 模式的配置方法。

**Step 3: 提交更改**

```bash
git add README.md README.zh-CN.md
git commit -m "docs: update README for simplified architecture"
```

---

## Task 9: 更新前端 API 调用

**Files:**
- Check all files in `frontend/`

**Step 1: 搜索旧的 API 调用**

Run: `grep -r "localhost:8000" frontend/`

**Step 2: 替换为新的 API 路径**

将 `http://localhost:8000/api/` 替换为 `/api/`

**Step 3: 提交更改**

```bash
git add frontend/
git commit -m "fix: update API calls to Next.js routes"
```

---

## Task 10: 删除 Python 后端

**Files:**
- Delete: `backend/`

**Step 1: 确认迁移完成**

确保所有功能已迁移并测试通过。

**Step 2: 删除 backend 目录**

Run: `rm -rf backend/`

**Step 3: 提交更改**

```bash
git add -A
git commit -m "chore: remove Python backend"
```

---

## Task 11: 最终测试

**Step 1: 清理并重新安装**

```bash
rm -rf node_modules
./setup.sh
```

**Step 2: 启动应用**

```bash
npm run dev
```

**Step 3: 测试所有功能**

- [ ] PDF 上传
- [ ] JD 解析
- [ ] 技能提取
- [ ] 面试分析
- [ ] 模拟问题生成
- [ ] Whisper 转录（如果启用）

**Step 4: 提交最终更改**

```bash
git add -A
git commit -m "chore: complete Next.js migration"
```

---

## Task 12: 推送到 GitHub

**Step 1: 推送代码**

```bash
git push origin main
```

**Step 2: 验证 GitHub 仓库**

访问 https://github.com/ZHHHH9980/SwissJob 确认更新成功。

---

## 完成检查清单

- [ ] 依赖已安装（openai, pdf-parse）
- [ ] API Routes 已创建
- [ ] Whisper 服务脚本已创建
- [ ] 环境变量已更新
- [ ] setup.sh 已简化
- [ ] README 已更新
- [ ] 前端 API 调用已更新
- [ ] Python 后端已删除
- [ ] 所有功能测试通过
- [ ] 代码已推送到 GitHub


# SwissJob 纯 Next.js 架构迁移设计

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将 SwissJob 从 Next.js + FastAPI 双架构简化为纯 Next.js 单架构，降低安装复杂度，同时保留所有核心功能。

**设计日期：** 2026-02-16

---

## 1. 架构概览

### 当前架构（复杂）
- 前端：Next.js + React + TypeScript
- 后端：FastAPI (Python)
- 数据库：Prisma + SQLite
- AI 服务：OpenAI API (通过 Python 后端)
- Whisper：faster-whisper (Python 本地库)

**问题：**
- 需要 Node.js + Python 双环境
- Python 依赖安装复杂（faster-whisper 在 Python 3.13 上有兼容问题）
- 部署复杂（需要同时运行两个服务）

### 新架构（简化）
- 前端：Next.js + React + TypeScript
- 后端：Next.js API Routes
- 数据库：Prisma + SQLite（保持不变）
- AI 服务：OpenAI API（直接从 Next.js 调用）
- Whisper：**可选功能**，支持三种模式

**优势：**
- 只需要 Node.js
- 安装简化为 `npm install`
- 单一服务运行
- 更容易部署（Vercel 一键部署）

---

## 2. 核心功能迁移

### 2.1 PDF 解析（简历上传）

**当前实现：** Python `pdfplumber` 库
**新实现：** Node.js `pdf-parse` 库

```typescript
// frontend/app/api/resume/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // 验证文件类型和大小
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 })
  }

  // 解析 PDF
  const buffer = Buffer.from(await file.arrayBuffer())
  const data = await pdf(buffer)

  return NextResponse.json({
    success: true,
    text: data.text
  })
}
```

### 2.2 AI 服务

**当前实现：** Python FastAPI 端点 → OpenAI API
**新实现：** Next.js API Routes → OpenAI API

迁移的端点：
1. `/api/ai/extract-skills` - 技能提取
2. `/api/ai/extract-jd` - JD 解析
3. `/api/ai/analyze-interview` - 面试分析
4. `/api/ai/mock-questions` - 模拟问题生成

```typescript
// frontend/app/api/ai/extract-jd/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  const { jd_text } = await request.json()

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Extract company, position, skills, and full JD from the job description..."
      },
      {
        role: "user",
        content: jd_text
      }
    ],
    response_format: { type: "json_object" }
  })

  return NextResponse.json(JSON.parse(completion.choices[0].message.content))
}
```

---

## 3. Whisper 转录（可选功能）

### 3.1 三种模式

**模式 1: none（默认）**
- 不提供语音转文本功能
- 面试记录页面隐藏音频上传
- 用户手动输入面试内容
- 无需任何额外配置

**模式 2: api**
- 使用 OpenAI Whisper API
- 需要配置 `OPENAI_API_KEY`
- 按使用量付费
- 实现简单，调用 OpenAI API 即可

**模式 3: local**
- 使用本地 faster-whisper
- 提供独立的 Python 脚本 `scripts/whisper-server.py`
- 用户手动启动：`python scripts/whisper-server.py`
- Next.js 通过 HTTP 调用 localhost:8001
- 免费，但需要 Python 环境

### 3.2 配置方式

`.env` 文件：
```env
# OpenAI API Key（必需，用于 AI 分析）
OPENAI_API_KEY=sk-xxx

# Whisper 模式（可选）
WHISPER_MODE=none  # 选项: "none" | "api" | "local"
```

### 3.3 实现细节

```typescript
// frontend/app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const WHISPER_MODE = process.env.WHISPER_MODE || 'none'

export async function POST(request: NextRequest) {
  if (WHISPER_MODE === 'none') {
    return NextResponse.json(
      { error: 'Whisper is disabled' },
      { status: 503 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (WHISPER_MODE === 'api') {
    // 调用 OpenAI Whisper API
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1"
    })
    return NextResponse.json({ transcript: transcription.text })
  }

  if (WHISPER_MODE === 'local') {
    // 调用本地 Whisper 服务
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('http://localhost:8001/transcribe', {
      method: 'POST',
      body: formData
    })

    return NextResponse.json(await response.json())
  }
}
```

本地 Whisper 服务（可选）：
```python
# scripts/whisper-server.py
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import uvicorn

app = FastAPI()
model = WhisperModel("base", device="cpu")

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # 保存临时文件
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # 转录
    segments, info = model.transcribe(temp_path)
    text = " ".join([segment.text for segment in segments])

    return {"transcript": text}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

## 4. 文件结构变化

### 删除的文件
```
backend/                    # 整个目录删除
├── main.py
├── services/
│   ├── ai_service.py
│   ├── resume_service.py
│   └── whisper_service.py
├── requirements.txt
└── venv/
```

### 新增的文件
```
frontend/app/api/
├── ai/
│   ├── extract-skills/route.ts
│   ├── extract-jd/route.ts
│   ├── analyze-interview/route.ts
│   └── mock-questions/route.ts
├── resume/
│   └── upload/route.ts
└── transcribe/
    └── route.ts

scripts/                    # 可选
└── whisper-server.py       # 仅当用户选择 local 模式时需要

.env.example                # 更新配置说明
```

### 修改的文件
```
package.json                # 添加依赖，移除 Python 脚本
setup.sh                    # 简化安装流程
README.md                   # 更新安装说明和配置说明
README.zh-CN.md             # 更新中文说明
```

---

## 5. 依赖变化

### package.json
```json
{
  "dependencies": {
    "openai": "^4.28.0",      // 新增
    "pdf-parse": "^1.1.1",    // 新增
    "@prisma/client": "^5.x", // 保持
    "next": "14.1.0",         // 保持
    // ... 其他现有依赖
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
    // 移除 start:backend, start:frontend, concurrently
  }
}
```

### 移除的依赖
- `concurrently` - 不再需要同时运行前后端

---

## 6. 安装流程变化

### 之前（复杂）
```bash
# 1. 安装 Node.js 依赖
npm install

# 2. 设置 Python 环境
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. 配置环境变量
cp backend/.env.example backend/.env

# 4. 初始化数据库
cd ../frontend
npx prisma generate
npx prisma db push

# 5. 启动应用（需要两个终端）
npm start  # 同时启动前后端
```

### 之后（简化）
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 启动应用
npm run dev
```

或者使用自动化脚本：
```bash
./setup.sh && npm run dev
```

---

## 7. 配置说明（README 更新）

### .env.example
```env
# OpenAI API Key（必需）
# 用于：技能提取、JD 解析、面试分析、模拟问题生成
# 如果选择 Whisper API 模式，也用于语音转文本
OPENAI_API_KEY=sk-your-api-key-here

# Whisper 转录模式（可选）
# - none: 不使用语音转文本功能（默认）
# - api: 使用 OpenAI Whisper API（需要付费）
# - local: 使用本地 Whisper 服务（需要 Python 环境）
WHISPER_MODE=none

# 数据库（自动生成，无需修改）
DATABASE_URL="file:./dev.db"
```

### README 配置部分
```markdown
## 配置

### 必需配置

1. 获取 OpenAI API Key：https://platform.openai.com/api-keys
2. 复制 `.env.example` 为 `.env`
3. 填入你的 API Key

### 可选：语音转文本

SwissJob 支持三种 Whisper 模式：

#### 模式 1: 不使用（默认）
```env
WHISPER_MODE=none
```
- 不提供语音转文本功能
- 面试记录需要手动输入

#### 模式 2: OpenAI API
```env
WHISPER_MODE=api
OPENAI_API_KEY=sk-xxx  # 同一个 API Key
```
- 使用 OpenAI Whisper API
- 按使用量付费（$0.006/分钟）
- 无需额外安装

#### 模式 3: 本地 Whisper
```env
WHISPER_MODE=local
```
- 免费使用
- 需要 Python 3.11+ 环境
- 安装步骤：
  ```bash
  cd scripts
  python3 -m venv venv
  source venv/bin/activate
  pip install fastapi uvicorn faster-whisper
  python whisper-server.py
  ```
- 在另一个终端启动 SwissJob：`npm run dev`
```

---

## 8. 迁移检查清单

- [ ] 删除 `backend/` 目录
- [ ] 创建 Next.js API Routes
  - [ ] `/api/resume/upload`
  - [ ] `/api/ai/extract-skills`
  - [ ] `/api/ai/extract-jd`
  - [ ] `/api/ai/analyze-interview`
  - [ ] `/api/ai/mock-questions`
  - [ ] `/api/transcribe`
- [ ] 创建 `scripts/whisper-server.py`（可选）
- [ ] 更新 `package.json`
  - [ ] 添加 `openai` 依赖
  - [ ] 添加 `pdf-parse` 依赖
  - [ ] 移除 Python 相关脚本
- [ ] 更新 `.env.example`
- [ ] 更新 `setup.sh`
- [ ] 更新 `README.md`
- [ ] 更新 `README.zh-CN.md`
- [ ] 测试所有功能
  - [ ] PDF 上传解析
  - [ ] JD 解析
  - [ ] 技能提取
  - [ ] 面试分析
  - [ ] 模拟问题生成
  - [ ] Whisper 转录（三种模式）
- [ ] 提交并推送到 GitHub

---

## 9. 风险和注意事项

### 风险
1. **PDF 解析准确度**：`pdf-parse` 可能不如 `pdfplumber` 准确
   - 缓解：对于简历和 JD 这种文本型 PDF，`pdf-parse` 足够用
   - 如果遇到问题，可以考虑其他库如 `pdf.js`

2. **Whisper 本地模式的复杂度**：用户仍需要 Python 环境
   - 缓解：这是可选功能，默认不启用
   - 提供清晰的文档说明

### 注意事项
1. 前端代码中所有调用 `http://localhost:8000` 的地方需要更新为 Next.js API Routes
2. 确保 OpenAI API Key 的安全性（不要提交到 Git）
3. 测试时注意 OpenAI API 的费用

---

## 10. 成功标准

- [ ] 安装只需要 `npm install`（不需要 Python）
- [ ] 启动只需要 `npm run dev`（单一命令）
- [ ] 所有核心功能正常工作（PDF 解析、AI 分析、数据管理）
- [ ] Whisper 三种模式都能正常工作
- [ ] README 清晰说明配置方式
- [ ] 代码推送到 GitHub

---

**设计完成日期：** 2026-02-16
**预计实施时间：** 2-3 小时
**复杂度：** 中等（主要是代码迁移，架构清晰）

# Interview Helper - 面试助手设计文档

**日期**: 2026-02-15
**状态**: 已批准
**版本**: 1.0

## 项目概述

面试助手是一个面向求职者的完整求职管理和辅助工具，帮助用户管理面试流程、分析面试表现、构建个人技能树。

### 核心价值

- 管理求职全流程（JD → 模拟面试 → 真实面试 → AI 复盘）
- 基于真实面试数据构建个人技能树和能力图谱
- 通过 AI 分析识别优势和短板，持续改进面试表现

### 目标用户

- 正在找工作的求职者
- 需要管理多个面试流程的候选人
- 希望通过数据分析提升面试能力的人

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────┐
│         Browser (用户界面)               │
│    Next.js 14 + React + Tailwind        │
└─────────────┬───────────────────────────┘
              │ HTTP/REST
              │
┌─────────────▼───────────────────────────┐
│      Next.js API Routes                 │
│  - JD 管理                               │
│  - 面试记录 CRUD                         │
│  - 文件上传                              │
│  - 调用 Python 服务                      │
└─────────────┬───────────────────────────┘
              │
              ├──────────────┐
              │              │
┌─────────────▼─────┐  ┌────▼──────────────┐
│   SQLite DB       │  │  Python FastAPI   │
│  (Prisma ORM)     │  │  - Whisper 转录   │
│  - users          │  │  - AI 分析        │
│  - companies      │  │  - 技能提取       │
│  - interviews     │  │  - 模拟面试生成   │
│  - skills         │  └───────────────────┘
│  - mock_interviews│
└───────────────────┘
              │
┌─────────────▼─────┐
│  Local File System│
│  - audio/         │
│  - resumes/       │
│  - exports/       │
└───────────────────┘
```

### 技术栈

**前端**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Prisma Client (数据库访问)
- Chart.js / D3.js (数据可视化)

**后端**
- Python 3.10+
- FastAPI
- Faster-Whisper (本地语音转录)
- PyPDF2 / pdfplumber (PDF 解析)
- SQLAlchemy (可选，用于 Python 侧数据访问)

**数据库**
- SQLite (本地存储)
- Prisma (ORM)

**AI 服务**
- 用户提供 API token
- 支持 OpenAI、Claude、国内大模型
- 可选：集成 LiteLLM 或 One API 统一接口

**部署方式**
- 本地运行（开发和生产）
- 统一启动：`npm install` + `npm start`
- 未来可选：Docker 容器化

### 项目结构

```
interview-helper/
├── package.json              # 根配置，workspaces 管理
├── README.md
├── docs/
│   └── plans/               # 设计文档
├── frontend/                # Next.js 应用
│   ├── package.json
│   ├── app/
│   │   ├── page.tsx        # Dashboard
│   │   ├── companies/      # 公司/JD 管理
│   │   ├── skills/         # 技能树可视化
│   │   ├── calendar/       # 日历视图
│   │   └── settings/       # 设置
│   ├── components/
│   ├── lib/
│   └── prisma/
│       └── schema.prisma   # 数据库模型
├── backend/                 # Python FastAPI
│   ├── main.py             # FastAPI 入口
│   ├── requirements.txt
│   ├── services/
│   │   ├── whisper_service.py
│   │   ├── ai_service.py
│   │   ├── resume_service.py
│   │   └── skill_extractor.py
│   └── models/
└── data/                    # 本地数据存储
    ├── interview.db        # SQLite 数据库
    ├── audio/              # 面试录音
    ├── resumes/            # 简历文件
    └── exports/            # 导出的日历文件
```

## 数据模型

### Prisma Schema

```prisma
// User - 用户信息和简历
model User {
  id          String    @id @default(cuid())
  name        String?
  email       String?
  resumePath  String?   // PDF 文件路径
  resumeText  String?   // 解析后的文本
  skills      String[]  // 从简历中提取的技能
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Company - 公司和职位信息
model Company {
  id          String      @id @default(cuid())
  name        String
  position    String
  jd          String      // 职位描述原文
  skills      String[]    // AI 提取的技能标签
  matchScore  Float?      // 与简历的匹配度 0-100
  status      String      // "active", "archived"
  createdAt   DateTime    @default(now())
  interviews  Interview[]
  mockInterviews MockInterview[]
}

// Interview - 面试记录
model Interview {
  id            String    @id @default(cuid())
  companyId     String
  company       Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  round         Int       // 1=一面, 2=二面, etc.
  scheduledAt   DateTime  // 面试时间
  status        String    // "scheduled", "completed", "cancelled"
  audioPath     String?   // 音频文件路径
  transcript    String?   // 转录文本
  aiAnalysis    Json?     // AI 分析结果
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Skill - 技能标签
model Skill {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String   // "frontend", "backend", "algorithm", "soft-skill", etc.
  frequency   Int      @default(1)  // 出现次数
  firstSeen   DateTime @default(now())
  lastSeen    DateTime @default(now())
}

// MockInterview - 模拟面试
model MockInterview {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  questions   Json     // AI 生成的问题列表
  createdAt   DateTime @default(now())
}
```

## 核心功能

### 1. 简历管理

**功能**
- 上传 PDF 简历
- 自动解析文本内容
- AI 提取技能标签
- 展示简历信息

**技术实现**
- 前端：文件上传组件
- 后端：PyPDF2/pdfplumber 解析 PDF
- AI：调用 LLM 提取技能

### 2. JD 管理

**功能**
- 手动粘贴 JD 文本
- AI 提取关键技能要求
- 计算与简历的匹配度
- 管理多个职位

**技术实现**
- 前端：富文本编辑器
- 后端：AI 分析 JD，提取技能
- 匹配算法：对比简历技能和 JD 技能

### 3. 面试管理

**功能**
- 创建面试记录（时间、轮次）
- 日历视图展示
- 导出 .ics 文件到 Mac 日历
- 面试状态管理

**技术实现**
- 前端：日历组件（react-big-calendar）
- .ics 生成：ics.js 库
- 状态：scheduled → completed/cancelled

### 4. 录音转录

**功能**
- 上传面试录音文件
- 本地 Whisper 转录
- 显示转录进度
- 保存转录文本

**技术实现**
- 前端：文件上传 + 进度条
- 后端：Faster-Whisper 处理
- 异步任务：转录可能需要几分钟

### 5. 模拟面试

**功能**
- 基于 JD 和简历生成面试题
- 展示问题列表
- 可选：录音练习回答

**技术实现**
- AI Prompt：结合 JD 要求和简历背景
- 生成 5-10 个针对性问题
- 存储到 MockInterview 表

### 6. AI 复盘分析

**功能**
- 综合分析面试表现
- 三要素输入：JD + 转录 + 简历
- 输出：优势、劣势、改进建议

**AI 分析维度**
1. 技能匹配度：展现的技能与 JD 要求的匹配
2. 表现优势：哪些问题回答得好
3. 表现劣势：哪些问题回答不足
4. 简历真实性：简历技能是否得到验证
5. 改进建议：下次如何提升

**技术实现**
```python
def analyze_interview(transcript: str, jd: str, resume: str) -> dict:
    prompt = f"""
    请分析这次面试表现：

    【职位要求】
    {jd}

    【候选人简历】
    {resume}

    【面试对话】
    {transcript}

    请从以下维度分析：
    1. 技能匹配度
    2. 表现优势
    3. 表现劣势
    4. 简历真实性
    5. 改进建议

    以 JSON 格式返回。
    """
    return call_llm_api(prompt)
```

### 7. 技能树可视化

**功能**
- 标签云：技能频率展示
- 树状图：技能分类层级
- 雷达图：多维度能力评分
- 时间线：技能成长轨迹

**技术实现**
- Chart.js：雷达图、时间线
- D3.js：树状图、标签云
- 数据来源：Skill 表 + Interview 分析结果

## 核心数据流

### 1. 上传简历并分析

```
用户上传 PDF
  ↓
POST /api/resume/upload
  ↓
保存到 data/resumes/
  ↓
Python API: POST /ai/parse-resume
  ↓
PyPDF2 解析 + AI 提取技能
  ↓
更新 User 表
  ↓
重新计算所有 JD 的匹配度
  ↓
返回结果
```

### 2. 添加 JD 并分析

```
用户输入 JD 文本
  ↓
POST /api/companies
  ↓
存储到 SQLite
  ↓
Python API: POST /ai/extract-skills
  ↓
AI 提取技能标签
  ↓
如果有简历，计算匹配度
  ↓
返回结果并更新 UI
```

### 3. 面试录音转录和分析

```
用户上传音频文件
  ↓
POST /api/interviews/:id/upload
  ↓
保存到 data/audio/
  ↓
Python API: POST /transcribe
  ↓
Faster-Whisper 转录（异步）
  ↓
Python API: POST /ai/analyze-interview
  传入：transcript + jd + resume
  ↓
AI 综合分析
  ↓
更新 Interview.aiAnalysis
更新 Skill 表
  ↓
返回分析结果
```

### 4. 生成模拟面试

```
用户点击"模拟面试"
  ↓
POST /api/mock-interview
  ↓
Python API: POST /ai/generate-questions
  传入：jd + resume
  ↓
AI 生成针对性问题
  ↓
存储到 MockInterview 表
  ↓
展示问题列表
```

### 5. 导出日历

```
用户点击"导出日历"
  ↓
GET /api/calendar/export
  ↓
查询所有 scheduled 状态的面试
  ↓
生成 .ics 文件
  ↓
下载到本地
  ↓
用户导入 Mac 日历
```

## 错误处理

### 1. 文件上传错误

**场景**
- 音频文件过大（>100MB）
- PDF 文件损坏
- 不支持的文件格式

**处理**
- 前端限制文件大小和格式
- 后端返回清晰错误信息
- 提供重试机制

### 2. Whisper 转录失败

**场景**
- 音频质量太差
- 音频时长过长（>2小时）
- Whisper 进程崩溃

**处理**
- 显示转录进度条
- 支持取消转录
- 失败后保留音频，允许重试
- 降级方案：使用 API 而非本地 Whisper

### 3. AI API 调用失败

**场景**
- API token 无效或过期
- API 限流或超时
- 网络连接问题

**处理**
- 清晰的错误提示
- 重试机制（最多 3 次）
- 降级方案：保存原始数据，稍后重试

### 4. 数据一致性

**场景**
- 简历更新后，匹配度过期
- 删除公司时，相关面试记录处理

**处理**
- 简历更新时，标记所有 matchScore 为 null，触发重新计算
- 删除公司时，级联删除相关记录（Prisma onDelete: Cascade）
- 使用数据库事务保证一致性

### 5. 本地存储管理

**场景**
- 音频文件占用大量磁盘空间
- 数据库文件损坏

**处理**
- 提供存储空间统计
- 支持删除旧音频文件
- 定期备份数据库（可选）

## 用户体验

### 安装和启动

```bash
# 克隆仓库
git clone https://github.com/username/interview-helper.git
cd interview-helper

# 安装所有依赖（前端 + 后端）
npm install

# 启动应用（前后端同时启动）
npm start
```

访问 `http://localhost:3000` 使用应用。

### 配置

**首次使用**
1. 进入设置页面
2. 配置 AI API token（OpenAI/Claude/其他）
3. 可选：配置 Whisper 模式（本地/API）

**数据存储**
- 所有数据存储在 `data/` 目录
- 可以手动备份整个目录

## 测试策略

### 前端测试
- 组件单元测试（Jest + React Testing Library）
- 关键流程 E2E 测试（Playwright）

### 后端测试
- API 端点测试（pytest + FastAPI TestClient）
- Whisper 转录测试（使用测试音频）
- AI 服务 mock 测试

### 手动测试清单
- [ ] 上传并解析 PDF 简历
- [ ] 添加 JD 并提取技能
- [ ] 计算简历与 JD 匹配度
- [ ] 创建面试记录
- [ ] 导出日历 .ics 文件
- [ ] 上传音频并转录
- [ ] AI 分析面试表现
- [ ] 生成模拟面试题
- [ ] 查看技能树各种可视化

## 未来扩展

### 短期（MVP 后）
- Docker 容器化部署
- 支持更多 AI 模型
- 优化 Whisper 转录速度
- 移动端适配

### 中期
- 云端同步（可选）
- 多用户支持
- 面试数据导出（PDF 报告）
- 面试准备资料库

### 长期（商业化）
- SaaS 云服务
- 付费云存储
- 高级 AI 分析功能
- 社区分享和学习

## 技术决策记录

### 为什么选择 Next.js + Python？
- Next.js：现代化前端框架，易于构建类似 Dify 的 UI
- Python：Whisper 和 AI 生态最成熟
- 分离架构：各自发挥优势，易于维护

### 为什么选择 SQLite？
- 本地存储，无需额外数据库服务
- 轻量级，适合个人工具
- Prisma 支持良好
- 易于备份和迁移

### 为什么选择 Faster-Whisper？
- 比原版 Whisper 快 4 倍
- 内存占用少 50%
- 保持相同的准确度
- 支持本地运行，保护隐私

### 为什么用户提供 API token？
- 开源工具，避免 API 成本
- 用户自由选择 AI 服务商
- 保护用户隐私（数据不经过第三方）

## 总结

这是一个面向求职者的完整面试管理和分析工具，通过 AI 技术帮助用户：
1. 管理求职流程
2. 分析面试表现
3. 构建个人技能树
4. 持续改进面试能力

技术栈成熟、架构清晰、用户体验友好，适合作为开源项目快速迭代。

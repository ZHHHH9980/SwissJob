# SwissJob

<div align="center">

**你的求职瑞士军刀**

[English](README.md) | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)

</div>

---

## 🎯 什么是 SwissJob？

SwissJob 是一个开源的、AI 驱动的求职管理平台 - 你找工作唯一需要的工具。就像瑞士军刀一样，它将求职过程中需要的所有功能整合到一个强大的工具中。

### ✨ 核心功能

- **🤖 AI 智能解析职位描述**：粘贴任何 JD，AI 自动提取公司名称、职位和所需技能
- **💬 对话式交互界面**：与 AI 自然对话，添加和完善职位信息
- **📊 流程管理**：通过 待处理 → 进行中 → 已完成 三个阶段追踪申请进度
- **🎙️ 面试录音与转写**：录制面试并获得 AI 驱动的转写（Whisper）
- **📄 简历分析**：上传简历，获得 AI 驱动的技能匹配分析
- **🎯 模拟面试生成器**：基于 JD 和你的简历生成定制化面试问题
- **📈 技能树可视化**：可视化你的技能并追踪成长轨迹
- **📅 日历集成**：将面试日程导出到你的日历

## 🚀 快速开始

### 前置要求

- **Node.js** 18+ 和 npm
- **Python** 3.11+（注意：Python 3.13 与某些音频库存在兼容性问题）
- **FFmpeg**（用于音频处理）：`brew install ffmpeg`（macOS）或 `apt install ffmpeg`（Linux）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/swissjob.git
   cd swissjob
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置 Python 环境**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. **配置环境变量**
   ```bash
   cp backend/.env.example backend/.env
   # 编辑 backend/.env 并添加你的 API 密钥（OpenAI、Anthropic 等）
   ```

5. **初始化数据库**
   ```bash
   cd frontend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

6. **启动应用**
   ```bash
   npm start
   ```

   这将启动：
   - 🎨 前端：http://localhost:3000
   - ⚡ 后端 API：http://localhost:8000

## 📖 使用指南

### 添加职位

1. 在仪表板点击 **"+ Add Position"**
2. 粘贴完整的职位描述
3. AI 将提取公司、职位和技能信息
4. 通过对话审核并确认或调整信息
5. 点击 **"确认并保存"**

### 管理你的求职流程

- **待处理（Pending）**：新添加的、正在考虑的职位
- **进行中（In Progress）**：活跃的申请和已安排的面试
- **已完成（Completed）**：已结束的面试（录用、拒绝或撤回）

### 录制面试

1. 进入公司详情页
2. 点击 **"Schedule Interview"**
3. 面试后上传录音文件
4. 获得 AI 驱动的转写和分析

## 🛠️ 技术栈

### 前端
- **Next.js 14** - 带 App Router 的 React 框架
- **TypeScript** - 类型安全开发
- **Tailwind CSS** - 实用优先的样式框架
- **Prisma** - 类型安全的数据库 ORM

### 后端
- **FastAPI** - 现代 Python Web 框架
- **Faster-Whisper** - 本地音频转写
- **PDFPlumber** - 简历解析
- **SQLite** - 轻量级数据库

### AI 集成
- **OpenAI API** - GPT-4 用于分析
- **Anthropic API** - Claude 用于对话
- 用户提供自己的 API 密钥（隐私优先）

## 📁 项目结构

```
swissjob/
├── frontend/              # Next.js 前端
│   ├── app/              # App router 页面
│   ├── components/       # React 组件
│   ├── lib/              # 工具函数
│   └── prisma/           # 数据库模式
├── backend/              # FastAPI 后端
│   ├── services/         # 业务逻辑
│   ├── models/           # 数据模型
│   └── main.py           # API 入口
├── data/                 # 本地数据存储
│   ├── audio/           # 面试录音
│   ├── resumes/         # 上传的简历
│   └── interview.db     # SQLite 数据库
└── docs/                # 文档
```

## 🤝 贡献

欢迎贡献！无论是：

- 🐛 Bug 报告
- 💡 功能建议
- 📝 文档改进
- 🔧 代码贡献

请随时提交 issue 或 pull request。

## 📝 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 使用 [Next.js](https://nextjs.org/) 构建
- 由 [FastAPI](https://fastapi.tiangolo.com/) 驱动
- 转写功能由 [Faster-Whisper](https://github.com/guillaumekln/faster-whisper) 提供
- AI 能力来自 [OpenAI](https://openai.com/) 和 [Anthropic](https://anthropic.com/)

## 📧 联系方式

有问题或建议？欢迎提交 issue 或联系我们！

---

<div align="center">
为全球求职者用心打造 ❤️
</div>

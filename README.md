# SwissJob

<div align="center">

**Your Swiss Army Knife for Job Hunting**

[English](README.md) | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)

</div>

---

## 🎯 What is SwissJob?

SwissJob is an open-source, AI-powered job search management platform - your all-in-one toolkit for landing your dream job. Just like a Swiss Army Knife, it combines everything you need for your job search journey into one powerful tool.

### ✨ Key Features

- **🤖 AI-Powered JD Analysis**: Paste any job description and let AI automatically extract company name, position, and required skills
- **💬 Conversational Interface**: Chat naturally with AI to add and refine job information
- **📊 Pipeline Management**: Track applications through Pending → In Progress → Completed stages
- **🎙️ Interview Recording & Transcription**: Record interviews and get AI-powered transcriptions (Whisper)
- **📄 Resume Analysis**: Upload your resume and get AI-powered skill matching
- **🎯 Mock Interview Generator**: Generate tailored interview questions based on JD and your resume
- **📈 Skill Tree Visualization**: Visualize your skills and track growth over time
- **📅 Calendar Integration**: Export interview schedules to your calendar

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ (Note: Python 3.13 has compatibility issues with audio libraries)
- **FFmpeg** (for audio processing): `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/swissjob.git
   cd swissjob
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Python environment**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

4. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your API keys (OpenAI, Anthropic, etc.)
   ```

5. **Initialize database**
   ```bash
   cd frontend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

6. **Start the application**
   ```bash
   npm start
   ```

   This will launch:
   - 🎨 Frontend: http://localhost:3000
   - ⚡ Backend API: http://localhost:8000

## 📖 Usage

### Adding a Job Position

1. Click **"+ Add Position"** on the dashboard
2. Paste the complete job description
3. AI will extract company, position, and skills
4. Review and confirm or make adjustments via chat
5. Click **"Confirm & Save"**

### Managing Your Pipeline

- **Pending**: Newly added positions you're considering
- **In Progress**: Active applications and scheduled interviews
- **Completed**: Finished interviews (accepted, rejected, or withdrawn)

### Recording Interviews

1. Navigate to a company's detail page
2. Click **"Schedule Interview"**
3. Upload audio recording after the interview
4. Get AI-powered transcription and analysis

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Prisma** - Type-safe database ORM

### Backend
- **FastAPI** - Modern Python web framework
- **Faster-Whisper** - Local audio transcription
- **PDFPlumber** - Resume parsing
- **SQLite** - Lightweight database

### AI Integration
- **OpenAI API** - GPT-4 for analysis
- **Anthropic API** - Claude for conversations
- User provides their own API keys (privacy-first)

## 📁 Project Structure

```
swissjob/
├── frontend/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── prisma/           # Database schema
├── backend/              # FastAPI backend
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   └── main.py           # API entry point
├── data/                 # Local data storage
│   ├── audio/           # Interview recordings
│   ├── resumes/         # Uploaded resumes
│   └── interview.db     # SQLite database
└── docs/                # Documentation
```

## 🤝 Contributing

Contributions are welcome! Whether it's:

- 🐛 Bug reports
- 💡 Feature suggestions
- 📝 Documentation improvements
- 🔧 Code contributions

Please feel free to open an issue or submit a pull request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [FastAPI](https://fastapi.tiangolo.com/)
- Transcription by [Faster-Whisper](https://github.com/guillaumekln/faster-whisper)
- AI capabilities from [OpenAI](https://openai.com/) and [Anthropic](https://anthropic.com/)

## 📧 Contact

Have questions or suggestions? Open an issue or reach out!

---

<div align="center">
Made with ❤️ for job seekers everywhere
</div>

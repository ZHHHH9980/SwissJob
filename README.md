# SwissJob

<div align="center">

**Your Swiss Army Knife for Job Hunting**

[English](README.md) | [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

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

### One-Command Setup

```bash
git clone https://github.com/ZHHHH9980/SwissJob.git
cd SwissJob
./setup.sh
```

That's it! The script will automatically:
- ✅ Install all dependencies
- ✅ Initialize the database
- ✅ Create configuration files

Then start the app:
```bash
npm run dev
```

Visit http://localhost:3000 to start using SwissJob!

### Prerequisites

- **Node.js** 18+ and npm

### Whisper Transcription (Optional)

SwissJob supports three modes for interview transcription:

1. **None** (default): Transcription disabled
2. **OpenAI API**: Use OpenAI's Whisper API (requires API key)
3. **Local**: Run Whisper locally (free, but requires Python setup)

To enable transcription, edit your `.env` file:

```bash
# For OpenAI API mode
WHISPER_MODE=api
OPENAI_API_KEY=your_key_here

# For local mode
WHISPER_MODE=local
WHISPER_API_URL=http://localhost:9000
```

For local mode setup, see [scripts/README.md](scripts/README.md).

### Manual Installation

<details>
<summary>Click to expand manual installation steps</summary>

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZHHHH9980/SwissJob.git
   cd SwissJob
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys (OpenAI, Anthropic, etc.)
   ```

4. **Initialize database**
   ```bash
   cd frontend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

5. **Start the application**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000

</details>

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
- **SQLite** - Lightweight database

### AI Integration
- **OpenAI API** - GPT-4 for analysis and Whisper for transcription
- **Anthropic API** - Claude for conversations
- User provides their own API keys (privacy-first)

## 📁 Project Structure

```
swissjob/
├── frontend/              # Next.js application
│   ├── app/              # App router pages & API routes
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── prisma/           # Database schema
├── scripts/              # Optional local Whisper server
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
- AI capabilities from [OpenAI](https://openai.com/) and [Anthropic](https://anthropic.com/)

## 📧 Contact

Have questions or suggestions? Open an issue or reach out!

---

<div align="center">
Made with ❤️ for job seekers everywhere
</div>

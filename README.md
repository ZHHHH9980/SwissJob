# Interview Helper

An open-source interview management tool designed to help job seekers organize, prepare for, and track their job interviews.

## Features

- **Interview Management**: Track all your upcoming and past interviews in one place
- **Company Research**: Store and organize research about companies you're interviewing with
- **Audio Transcription**: Record and transcribe interview sessions using Whisper AI
- **Document Processing**: Upload and extract information from job descriptions and company materials
- **Preparation Tools**: Create and manage interview preparation notes and questions
- **Progress Tracking**: Monitor your interview pipeline and application status

## Tech Stack

### Frontend
- **Next.js 14**: React framework for production
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Prisma**: Database ORM

### Backend
- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Faster Whisper**: Audio transcription
- **PDFPlumber**: PDF document processing

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (Python 3.13 has compatibility issues with some audio libraries)
- FFmpeg (for audio processing): `brew install ffmpeg`

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Python virtual environment and install backend dependencies:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

   **Note**: If you encounter issues installing `faster-whisper` on Python 3.13, you can:
   - Use Python 3.11 or 3.12 instead, OR
   - Skip Whisper for now and install other dependencies manually:
     ```bash
     pip install fastapi uvicorn python-multipart pdfplumber httpx python-dotenv
     ```

4. Configure environment variables:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your API keys
   ```

## Usage

Start both frontend and backend servers:
```bash
npm start
```

This will run:
- Backend API on `http://localhost:8000`
- Frontend application on `http://localhost:3000`

### Individual Commands

Start only the frontend:
```bash
npm run start:frontend
```

Start only the backend:
```bash
npm run start:backend
```

## Development

This is an open-source tool built for job seekers to better manage their interview process. Contributions are welcome!

## License

Open Source - Free to use for personal and commercial purposes.

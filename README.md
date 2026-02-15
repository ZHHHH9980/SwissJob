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

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

This will install both frontend and backend dependencies automatically.

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

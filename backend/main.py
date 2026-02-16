from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from services.resume_service import ResumeService
from services.ai_service import AIService
from services.whisper_service import WhisperService

load_dotenv()

resume_service = ResumeService()
ai_service = AIService()
whisper_service = WhisperService()

app = FastAPI(title="SwissJob API")

# Add this constant near the top
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

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
    return {"message": "SwissJob API"}


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...)):
    # Validate file type
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 10MB limit")

    # Save file with unique name
    file_path, file_id = resume_service.save_resume(content, file.filename)

    # Parse PDF
    text = resume_service.parse_pdf(file_path)

    if not text or len(text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Failed to parse PDF or PDF is empty")

    return {
        "success": True,
        "fileId": file_id,
        "text": text[:500]  # Preview
    }


# AI Service Endpoints

class ExtractSkillsRequest(BaseModel):
    text: str
    context: str = "resume"


class ExtractJDRequest(BaseModel):
    jd_text: str


class AnalyzeInterviewRequest(BaseModel):
    transcript: str
    jd: str
    resume: str


class GenerateMockQuestionsRequest(BaseModel):
    jd: str
    resume: str
    num_questions: Optional[int] = 8


@app.post("/api/ai/extract-skills")
async def extract_skills(request: ExtractSkillsRequest):
    """Extract skills from resume or JD"""
    try:
        skills = await ai_service.extract_skills(request.text, request.context)
        return {"skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/extract-jd")
async def extract_jd(request: ExtractJDRequest):
    """Extract structured information from job description"""
    try:
        info = await ai_service.extract_jd_info(request.jd_text)
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/analyze-interview")
async def analyze_interview(request: AnalyzeInterviewRequest):
    """Analyze interview performance"""
    try:
        analysis = await ai_service.analyze_interview(
            request.transcript,
            request.jd,
            request.resume
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/generate-mock-questions")
async def generate_mock_questions(request: GenerateMockQuestionsRequest):
    """Generate mock interview questions"""
    try:
        questions = await ai_service.generate_mock_questions(
            request.jd,
            request.resume,
            request.num_questions
        )
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# Whisper Transcription Endpoints

class TranscribeRequest(BaseModel):
    language: Optional[str] = "zh"


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...), language: str = "zh"):
    """Transcribe audio file to text"""
    if not whisper_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Whisper service is not available. Please install faster-whisper with Python 3.11 or 3.12."
        )

    # Validate file type (audio files)
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/x-wav", "audio/x-m4a"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only audio files are allowed")

    # Read file content
    content = await file.read()

    # Validate file size (max 50MB for audio)
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds 50MB limit")

    try:
        # Save audio file
        file_path, file_id = whisper_service.save_audio(content, file.filename)

        # Transcribe
        transcript = whisper_service.transcribe(file_path, language)

        return {
            "success": True,
            "fileId": file_id,
            "transcript": transcript
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/transcribe/status")
async def transcribe_status():
    """Check if transcription service is available"""
    return {
        "available": whisper_service.is_available(),
        "message": "Whisper service is ready" if whisper_service.is_available() 
                   else "Whisper service is not available. Install faster-whisper with Python 3.11/3.12."
    }

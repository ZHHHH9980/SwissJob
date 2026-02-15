from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from services.resume_service import ResumeService

load_dotenv()

resume_service = ResumeService()

app = FastAPI(title="Interview Helper API")

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
    return {"message": "Interview Helper API"}

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

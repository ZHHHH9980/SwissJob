from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from services.resume_service import ResumeService

load_dotenv()

resume_service = ResumeService()

app = FastAPI(title="Interview Helper API")

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
    # Save file
    content = await file.read()
    file_path = resume_service.save_resume(content, file.filename)

    # Parse PDF
    text = resume_service.parse_pdf(file_path)

    if not text:
        return {"error": "Failed to parse PDF"}

    return {
        "success": True,
        "filePath": file_path,
        "text": text[:500]  # Preview
    }

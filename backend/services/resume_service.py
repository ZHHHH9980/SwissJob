import pdfplumber
from pathlib import Path
from typing import Optional

class ResumeService:
    def parse_pdf(self, file_path: str) -> Optional[str]:
        """Extract text from PDF resume"""
        try:
            with pdfplumber.open(file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text.strip()
        except Exception as e:
            print(f"Error parsing PDF: {e}")
            return None

    def save_resume(self, file_content: bytes, filename: str) -> str:
        """Save resume file to data/resumes/"""
        resume_dir = Path("../data/resumes")
        resume_dir.mkdir(parents=True, exist_ok=True)

        file_path = resume_dir / filename
        with open(file_path, 'wb') as f:
            f.write(file_content)

        return str(file_path)

import pdfplumber
from pathlib import Path
from typing import Optional
import uuid
import os

class ResumeService:
    def __init__(self):
        # Use absolute path based on backend directory
        backend_dir = Path(__file__).parent.parent
        self.resume_dir = backend_dir.parent / "data" / "resumes"
        self.resume_dir.mkdir(parents=True, exist_ok=True)

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

    def save_resume(self, file_content: bytes, original_filename: str) -> tuple[str, str]:
        """Save resume file with unique name to data/resumes/

        Returns:
            tuple: (file_path, file_id)
        """
        # Sanitize filename - only keep the basename
        safe_filename = Path(original_filename).name

        # Generate unique filename with UUID
        file_id = str(uuid.uuid4())
        file_extension = Path(safe_filename).suffix
        unique_filename = f"{file_id}{file_extension}"

        file_path = self.resume_dir / unique_filename

        with open(file_path, 'wb') as f:
            f.write(file_content)

        return str(file_path), file_id

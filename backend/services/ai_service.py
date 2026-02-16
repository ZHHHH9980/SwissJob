import httpx
import os
import json
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


class AIService:
    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    async def call_openai(self, prompt: str, model: str = "gpt-4") -> str:
        """Call OpenAI API"""
        if not self.openai_key:
            raise ValueError("OPENAI_API_KEY not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7
                },
                timeout=60.0
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    async def extract_skills(self, text: str, context: str = "resume") -> List[str]:
        """Extract skills from text (resume or JD)"""
        prompt = f"""Extract technical skills and key competencies from the following {context}.
Return ONLY a JSON array of skill names, nothing else.

Text:
{text}

Return format: ["skill1", "skill2", "skill3"]
"""

        try:
            response = await self.call_openai(prompt)
            # Try to parse JSON response
            skills = json.loads(response)
            if isinstance(skills, list):
                return skills
            return []
        except Exception as e:
            print(f"Error extracting skills: {e}")
            return []

    async def analyze_interview(
        self,
        transcript: str,
        jd: str,
        resume: str
    ) -> Dict[str, Any]:
        """Analyze interview performance"""
        prompt = f"""Analyze this interview performance based on the job requirements and candidate's resume.

【Job Requirements】
{jd}

【Candidate Resume】
{resume}

【Interview Transcript】
{transcript}

Provide analysis in JSON format:
{{
  "matchScore": 85,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "summary": "Overall assessment summary"
}}
"""

        try:
            response = await self.call_openai(prompt)
            analysis = json.loads(response)
            return analysis
        except Exception as e:
            print(f"Error analyzing interview: {e}")
            return {
                "matchScore": 0,
                "strengths": [],
                "weaknesses": [],
                "suggestions": [],
                "summary": "Analysis failed"
            }

    async def generate_mock_questions(
        self,
        jd: str,
        resume: str,
        num_questions: int = 8
    ) -> List[str]:
        """Generate mock interview questions"""
        prompt = f"""Generate {num_questions} targeted interview questions based on the job requirements and candidate's background.

【Job Requirements】
{jd}

【Candidate Resume】
{resume}

Return ONLY a JSON array of questions: ["question1", "question2", ...]
"""

        try:
            response = await self.call_openai(prompt)
            questions = json.loads(response)
            if isinstance(questions, list):
                return questions
            return []
        except Exception as e:
            print(f"Error generating questions: {e}")
            return []

    async def extract_jd_info(self, jd_text: str) -> Dict[str, Any]:
        """Extract structured information from job description"""
        prompt = f"""Extract key information from this job description and return as JSON.

Job Description:
{jd_text}

Return format:
{{
  "company": "Company name",
  "position": "Job title",
  "skills": ["skill1", "skill2", "skill3"],
  "location": "Location if mentioned",
  "salary": "Salary range if mentioned"
}}

If any field is not found, use null.
"""

        try:
            response = await self.call_openai(prompt)
            info = json.loads(response)
            return info
        except Exception as e:
            print(f"Error extracting JD info: {e}")
            return {
                "company": None,
                "position": None,
                "skills": [],
                "location": None,
                "salary": None
            }

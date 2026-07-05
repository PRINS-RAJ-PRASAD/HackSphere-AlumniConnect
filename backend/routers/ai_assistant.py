from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import pdfplumber
import json
import requests
import logging

# Set up logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

import os
from dotenv import load_dotenv

# Load the hidden variables from the .env file
load_dotenv()

# Pull the key securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Updated to the current active 2026 Lite model
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={GEMINI_API_KEY}"


# ---------------------------------------------------------
# DATA MODELS
# ---------------------------------------------------------
class ProfileData(BaseModel):
    skills: List[str]
    experience: str
    department: str

class InterviewRequest(BaseModel):
    job_description: str
    profile_data: ProfileData

class ReferralPitchRequest(BaseModel):
    company: str
    alumni_name: str
    alumni_role: str
    student_name: str
    student_skills: List[str]

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------
def call_gemini_api(prompt: str):
    headers = {"Content-Type": "application/json"}
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        logger.info(f"API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"API Error Response: {response.text}")
            raise Exception(f"Gemini API Error: {response.status_code}")
        
        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text']
        
        # HARDENED PARSING: Aggressively strip markdown formatting
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
        return json.loads(cleaned.strip())
    except Exception as e:
        logger.error(f"Error in call_gemini_api: {str(e)}")
        raise Exception(f"AI Service Failure: {str(e)}")

# ---------------------------------------------------------
# API ENDPOINTS
# ---------------------------------------------------------
@router.post("/analyze-resume")
async def analyze_resume(
    job_description: str = Form(...),
    resume: UploadFile = File(...)
):
    try:
        extracted_text = ""
        with pdfplumber.open(resume.file) as pdf:
            for page in pdf.pages:
                txt = page.extract_text()
                if txt: extracted_text += txt + "\n"
        
        # FIXED: Enforced strict JSON structure so the frontend doesn't crash
        prompt = f"""
        You are an expert ATS (Applicant Tracking System). Analyze the resume against the job description.
        Job Description: {job_description}
        Resume Text: {extracted_text}
        
        You MUST return ONLY a valid JSON object. Do not include any extra text. Use exactly these keys:
        {{
            "ats_score": <integer from 0 to 100>,
            "missing_keywords": [<array of strings>],
            "upskilling_roadmap": [<array of 3 short action steps>]
        }}
        """
        return call_gemini_api(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mock-interview")
async def mock_interview(request: InterviewRequest):
    try:
        prompt = f"""
        Generate exactly 5 highly technical mock interview questions for this scenario.
        Job Description: {request.job_description}
        Candidate Profile: {request.profile_data.model_dump_json()}
        
        You MUST return ONLY a valid JSON object. Use exactly this format:
        {{
            "questions": [
                {{"question": "Question text here", "focus_area": "Skill being tested"}}
            ]
        }}
        """
        response_data = call_gemini_api(prompt)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/referral-pitch")
async def referral_pitch(request: ReferralPitchRequest):
    try:
        prompt = f"""
        Write a highly professional, concise LinkedIn referral pitch message.
        Company: {request.company}
        Alumni Name: {request.alumni_name}
        Student Name: {request.student_name}
        Student Skills: {', '.join(request.student_skills)}
        
        You MUST return ONLY a valid JSON object. Use exactly this format:
        {{
            "subject": "Email subject line",
            "message": "The full email body text"
        }}
        """
        return call_gemini_api(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
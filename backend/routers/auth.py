from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import date
import re
from schemas.user_schema import UserRegister, UserLogin
from config.database import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])

NITJSR_REGEX = re.compile(r"^(\d{4})UG(CM|CS|EC|PI|EE|ME|CE|MM)(\d{3})@nitjsr\.ac\.in$", re.IGNORECASE)

DEPT_MAP = {
    'CM': 'Engineering and Computational Mechanics',
    'CS': 'Computer Science',
    'EC': 'Electronics and Communication',
    'PI': 'Production Engineering',
    'EE': 'Electrical Engineering',
    'ME': 'Mechanical Engineering',
    'CE': 'Civil Engineering',
    'MM': 'Metallurgy and Materials Engineering'
}

class ForgotPasswordRequest(BaseModel):
    email: str

@router.post("/register")
async def register_user(payload: UserRegister):
    match = NITJSR_REGEX.match(payload.email)
    if not match:
        raise HTTPException(status_code=400, detail="Must use official NIT JSR email.")
        
    extracted_graduation_year = int(match.group(1)) + 4
    extracted_department = DEPT_MAP.get(match.group(2).upper(), "Unknown Department")
    current_year = date.today().year
    assigned_role = "Student" if extracted_graduation_year > current_year else "Alumni"

    try:
        # Sign up in Supabase Auth
        auth_response = supabase.auth.sign_up({"email": payload.email, "password": payload.password})
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Registration failed.")

        # Insert user profile manually
        user_data = {
            "id": auth_response.user.id,
            "email": payload.email,
            "full_name": payload.full_name,
            "graduation_year": extracted_graduation_year,
            "department": extracted_department,
            "role": assigned_role
        }
        supabase.table("users").insert(user_data).execute()

        # Insert specific sub-profiles
        if assigned_role == "Alumni":
            supabase.table("alumni_profiles").insert({"user_id": auth_response.user.id}).execute()
        else:
            supabase.table("student_profiles").insert({"user_id": auth_response.user.id}).execute()

        return {"message": "Registration successful", "user_id": auth_response.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login_user(payload: UserLogin):
    if not NITJSR_REGEX.match(payload.email):
        raise HTTPException(status_code=400, detail="Invalid NIT JSR email.")
        
    try:
        auth_response = supabase.auth.sign_in_with_password({"email": payload.email, "password": payload.password})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    try:
        db_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        if not db_response.data:
             raise HTTPException(status_code=404, detail="Profile not found. Please register again.")
             
        return {
            "access_token": auth_response.session.access_token,
            "user": db_response.data[0] 
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    try:
        supabase.auth.reset_password_for_email(payload.email)
        return {"message": "Reset link sent."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
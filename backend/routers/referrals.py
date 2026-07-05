from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from config.database import supabase

router = APIRouter()

class ReferralRequestCreate(BaseModel):
    job_id: UUID
    alumni_id: UUID
    message: Optional[str] = "I am highly interested in this role and would love to request a referral."

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def request_referral(
    req: ReferralRequestCreate,
    x_user_id: UUID = Header(..., description="User ID of the requesting Student")
):
    try:
        request_data = {
            "job_id": str(req.job_id),
            "alumni_id": str(req.alumni_id),
            "student_id": str(x_user_id),
            "status": "Pending",
            "message": req.message
        }
        
        insert_res = supabase.table('referral_requests').insert(request_data).execute()
        
        if not insert_res.data:
             raise Exception("Database blocked the insert.")
             
        return {"message": "Referral requested successfully!", "data": insert_res.data[0]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# --- UPDATED: ALUMNI INBOX (NOW FETCHES STUDENT & JOB INFO) ---
@router.get("/inbox")
async def get_inbox(x_user_id: UUID = Header(..., description="User ID of the Alumni")):
    try:
        # 1. Fetch pending requests
        res = supabase.table('referral_requests').select('*').eq('alumni_id', str(x_user_id)).eq('status', 'Pending').execute()
        
        enriched_data = []
        for req in res.data:
            # 2. Fetch the Student's details
            student_res = supabase.table('users').select('full_name').eq('id', req['student_id']).execute()
            student_name = student_res.data[0]['full_name'] if student_res.data else "Unknown Student"
            
            # 3. Fetch the Job details
            job_res = supabase.table('jobs_and_referrals').select('company, role').eq('id', req['job_id']).execute()
            company = job_res.data[0]['company'] if job_res.data else "Unknown Company"
            role = job_res.data[0]['role'] if job_res.data else "Unknown Role"
            
            # 4. Attach the new info to the request payload
            req['student_name'] = student_name
            req['job_company'] = company
            req['job_role'] = role
            
            enriched_data.append(req)
            
        return enriched_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- APPROVE REFERRAL & AWARD POINTS ---
@router.post("/approve/{request_id}")
async def approve_request(request_id: UUID, x_user_id: UUID = Header(...)):
    try:
        update_res = supabase.table('referral_requests').update({'status': 'Approved'}).eq('id', str(request_id)).eq('alumni_id', str(x_user_id)).execute()
        
        if not update_res.data:
            raise HTTPException(status_code=400, detail="Failed to approve. Request not found or unauthorized.")
            
        profile = supabase.table('alumni_profiles').select('*').eq('user_id', str(x_user_id)).execute()
        
        if profile.data:
            current_referrals = profile.data[0].get('successful_referrals') or 0
            current_points = profile.data[0].get('total_contribution_points') or 0
            
            supabase.table('alumni_profiles').update({
                'successful_referrals': current_referrals + 1,
                'total_contribution_points': current_points + 50
            }).eq('user_id', str(x_user_id)).execute()
            
        return {"message": "Referral approved successfully! You earned 50 points."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
# --- NEW: STUDENT REFERRAL TRACKING ---
@router.get("/my-requests")
async def get_student_requests(x_user_id: UUID = Header(..., description="User ID of the Student")):
    try:
        # Fetch all requests made by this student
        res = supabase.table('referral_requests').select('*').eq('student_id', str(x_user_id)).execute()
        
        enriched_data = []
        for req in res.data:
            # Fetch the company and role they applied for
            job_res = supabase.table('jobs_and_referrals').select('company, role').eq('id', req['job_id']).execute()
            req['company'] = job_res.data[0]['company'] if job_res.data else "Unknown Company"
            req['role'] = job_res.data[0]['role'] if job_res.data else "Unknown Role"
            enriched_data.append(req)
            
        return enriched_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
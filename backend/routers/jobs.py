from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from config.database import supabase

router = APIRouter()

# -----------------------------------------
# Pydantic Schemas
# -----------------------------------------
class JobCreate(BaseModel):
    company: str
    role: str
    eligibility: Optional[str] = None
    required_skills: List[str] = []
    deadline: Optional[datetime] = None
    application_link: Optional[str] = None

class JobResponse(JobCreate):
    id: UUID
    posted_by: UUID
    created_at: datetime
    total_contribution_points: Optional[int] = 0
    successful_referrals: Optional[int] = 0
    alumni_name: Optional[str] = None

# -----------------------------------------
# API Endpoints
# -----------------------------------------
@router.post("/post", status_code=status.HTTP_201_CREATED)
async def post_job(
    job: JobCreate, 
    x_user_id: UUID = Header(..., description="User ID of the posting Alumni")
):
    try:
        # 1. Verify user is an Alumni
        user_res = supabase.table('users').select('role').eq('id', str(x_user_id)).single().execute()
        if not user_res.data or user_res.data['role'] != 'Alumni':
            raise HTTPException(status_code=403, detail="Only verified Alumni can post referrals.")
            
        # 2. Insert the Job
        job_data = job.model_dump(mode='json', exclude_none=True)
        job_data['posted_by'] = str(x_user_id)
        insert_res = supabase.table('jobs_and_referrals').insert(job_data).execute()
        
        # 3. AUTOMATED GAMIFICATION: Reward the Alumni with +10 Points
        # Fetch current points
        profile_res = supabase.table('alumni_profiles').select('total_contribution_points').eq('user_id', str(x_user_id)).execute()
        
        if profile_res.data:
            current_points = profile_res.data[0].get('total_contribution_points') or 0
            new_points = current_points + 10
            
            # Update the database with the new score
            supabase.table('alumni_profiles').update(
                {'total_contribution_points': new_points}
            ).eq('user_id', str(x_user_id)).execute()

        return insert_res.data[0]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/board", response_model=List[JobResponse])
async def get_job_board():
    try:
        res = supabase.table('jobs_with_alumni_stats').select('*').execute()
        
        if not res.data:
            return []

        ranked_jobs = sorted(
            res.data,
            key=lambda x: (
                x.get('total_contribution_points', 0) or 0,
                x.get('successful_referrals', 0) or 0,
                x.get('created_at', '')
            ),
            reverse=True
        )
        
        return ranked_jobs
             
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ranking engine error: {str(e)}")
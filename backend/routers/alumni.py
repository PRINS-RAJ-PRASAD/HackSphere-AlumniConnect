from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from config.database import supabase

router = APIRouter()

@router.get("/search")
async def search_alumni(q: Optional[str] = None):
    try:
        # 1. Fetch Alumni Profiles and their user details
        alumni_response = supabase.table("alumni_profiles") \
            .select("user_id, company, job_role, total_contribution_points, users(full_name, department, graduation_year)") \
            .execute()
            
        # 2. Fetch ALL posted jobs so we can link them to the alumni who posted them
        jobs_response = supabase.table("jobs_and_referrals").select("posted_by, company, role").execute()
        
        alumni_data = alumni_response.data or []
        jobs_data = jobs_response.data or []
        
        results = []

        for item in alumni_data:
            user_id = item.get('user_id')
            user_info = item.get('users') or {}
            name = user_info.get('full_name', 'Unknown Alumni')
            
            # Find all jobs posted by this specific alumni
            posted_jobs = [j for j in jobs_data if j.get('posted_by') == user_id]
            
            # THE MAGIC: If their profile company is blank, use the company from the job they posted!
            display_company = item.get('company') or (posted_jobs[0]['company'] if posted_jobs else 'Verified Network')
            display_role = item.get('job_role') or (posted_jobs[0]['role'] if posted_jobs else 'Alumni')
            
            # Combine all their info (name, profile, and ALL jobs they posted) into one giant hidden string
            searchable_text = f"{name} {display_company} {display_role}".lower()
            for job in posted_jobs:
                searchable_text += f" {job.get('company','')} {job.get('role','')} ".lower()
            
            # UNIVERSAL SEARCH: Check if what the student typed exists anywhere in that giant string
            if q:
                q_lower = q.lower().strip()
                if q_lower not in searchable_text:
                    continue  # Skip them if the word isn't found anywhere
            
            # Algorithmic Score
            score = round((item.get('total_contribution_points', 0) / 100.0), 2)
            
            results.append({
                "name": name,
                "company": display_company,
                "role": display_role,
                "department": user_info.get('department', 'N/A'),
                "graduation_batch": user_info.get('graduation_year', 0),
                "algorithmic_match_score": score,
                "contribution_points": item.get('total_contribution_points', 0)
            })

        # Rank results by the calculated algorithmic score
        results.sort(key=lambda x: x["algorithmic_match_score"], reverse=True)
        
        return {"status": "success", "ranked_results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# --- LEADERBOARD LOGIC ---
# --- LEADERBOARD LOGIC ---
class LeaderboardResponse(BaseModel):
    full_name: str
    department: str
    points: int
    referrals: int

@router.get("/leaderboard", response_model=List[LeaderboardResponse])
async def get_leaderboard():
    """Fetches the top 5 alumni based on contribution points from Supabase."""
    try:
        # FIXED: Added 'successful_referrals' to the select query
        res = supabase.table('alumni_profiles') \
            .select('total_contribution_points, successful_referrals, users(full_name, department)') \
            .order('total_contribution_points', desc=True) \
            .limit(5) \
            .execute()
            
        formatted = []
        for item in (res.data or []):
            if item.get('users'):
                formatted.append({
                    "full_name": item['users']['full_name'],
                    "department": item['users']['department'],
                    "points": item.get('total_contribution_points', 0),
                    # FIXED: Removed the hardcoded 0 and dynamically pull the real count
                    "referrals": item.get('successful_referrals', 0)
                })
        return formatted
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
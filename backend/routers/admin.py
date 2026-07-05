from fastapi import APIRouter, HTTPException
from config.database import supabase

router = APIRouter()

@router.get("/analytics")
async def get_platform_analytics():
    """Fetches real-time system metrics for the Admin Command Center."""
    try:
        # Fetch data safely to avoid Supabase python client count syntax errors
        users = supabase.table("users").select("id, role").execute()
        jobs = supabase.table("jobs_and_referrals").select("id").execute()
        requests = supabase.table("referral_requests").select("id, status").execute()
        
        user_data = users.data or []
        jobs_data = jobs.data or []
        req_data = requests.data or []

        # Calculate specific metrics
        students = len([u for u in user_data if u.get("role") == "Student"])
        alumni = len([u for u in user_data if u.get("role") == "Alumni"])
        approved = len([r for r in req_data if r.get("status") == "Approved"])

        return {
            "status": "success",
            "metrics": {
                "total_users": len(user_data),
                "total_students": students,
                "total_alumni": alumni,
                "total_jobs": len(jobs_data),
                "total_requests": len(req_data),
                "approved_requests": approved
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics Engine Error: {str(e)}")
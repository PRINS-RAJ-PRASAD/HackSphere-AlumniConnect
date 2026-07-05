from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# Added the new admin router here
from routers import auth, alumni, jobs, ai_assistant, referrals, admin 

app = FastAPI(
    title="AlumniConnect API",
    description="Backend API for the HackSphere 48-Hour Hackathon",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*", 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register application routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(alumni.router, prefix="/alumni", tags=["AI Alumni Engine"])
app.include_router(jobs.router, prefix="/jobs", tags=["Gamified Job Board"])
app.include_router(ai_assistant.router, prefix="/ai", tags=["AI Copilot"])
app.include_router(referrals.router, prefix="/referrals", tags=["Referrals"])
# NEW: Registered the Admin Command Center
app.include_router(admin.router, prefix="/admin", tags=["System Administration"])

@app.get("/", summary="API Health Status")
async def root_health_check():
    return JSONResponse(
        content={
            "status": "operational",
            "api_version": "1.0.0",
            "message": "AlumniConnect API is running and ready to accept requests."
        }
    )
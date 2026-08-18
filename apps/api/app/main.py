from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import scan, cards, lms, voice, analytics, auth, portfolio
from app.core.security import SecurityAuditMiddleware
from app.db.database import init_db

# Initialize Database tables
init_db()

app = FastAPI(
    title="EduMechanic 3D Backend API Engine",
    version="0.2.0",
    description="AI Vision VLM + RAG + CadQuery Parametric CAD & DB Persistence Pipeline"
)

app.add_middleware(SecurityAuditMiddleware, max_requests_per_minute=100)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1", tags=["User Authentication & Sessions"])
app.include_router(portfolio.router, prefix="/api/v1", tags=["3D Exploration Portfolio & Persistence"])
app.include_router(scan.router, prefix="/api/v1", tags=["Scan & AI Pipeline"])
app.include_router(cards.router, prefix="/api/v1", tags=["Exploration Cards & Fork"])
app.include_router(lms.router, prefix="/api/v1", tags=["Google Classroom LMS Integration"])
app.include_router(voice.router, prefix="/api/v1", tags=["AI Voice Habrutha Tutor Mechamong"])
app.include_router(analytics.router, prefix="/api/v1", tags=["Teacher Analytics & Auto-Grading"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "EduMechanic 3D API Engine",
        "version": "v1.1.0",
        "persistence": "SQLite / PostgreSQL ORM active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

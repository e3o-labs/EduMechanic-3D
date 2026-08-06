from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import scan, cards

app = FastAPI(
    title="EduMechanic 3D Backend API Engine",
    version="0.1.0",
    description="AI Vision VLM + RAG + CadQuery Parametric CAD Pipeline Engine"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api/v1", tags=["Scan & AI Pipeline"])
app.include_router(cards.router, prefix="/api/v1", tags=["Exploration Cards & Fork"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "EduMechanic 3D API Engine",
        "version": "v1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

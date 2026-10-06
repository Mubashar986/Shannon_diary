from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import entities, search, ai

app = FastAPI(
    title="Shannons Diary - Hackathon API",
    description="Model-agnostic, pgvector & Supabase-powered backend API engine",
    version="1.0.0"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(entities.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
async def health_check():
    """Liveness probe and system status."""
    return {
        "status": "online",
        "environment": settings.environment,
        "supabase_configured": bool(settings.supabase_anon_key and "your-project" not in settings.supabase_url)
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "app": "Shannons Diary API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

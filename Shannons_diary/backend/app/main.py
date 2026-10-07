from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.db import UpstreamError
from app.routers import entities, search, ai

app = FastAPI(
    title="Hackathon API (heisenberg-lite)",
    description="FastAPI + Supabase. Per-user RLS enforced by forwarding the caller's access token.",
    version="1.1.0"
)


@app.exception_handler(UpstreamError)
async def upstream_error_handler(request: Request, exc: UpstreamError):
    """Backstop so a Supabase message can never become a 500 with internals in it."""
    detail = exc.message if settings.environment == "development" else "Request could not be completed"
    return JSONResponse(status_code=exc.status_code, content={"detail": detail})


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
    """Liveness probe. Each flag is a capability actually configured, not a scaffolded table."""
    return {
        "status": "online",
        "environment": settings.environment,
        "supabase_configured": bool(
            settings.supabase_anon_key and "your-project" not in settings.supabase_url
        ),
        "ai_configured": bool(settings.gemini_api_key),
        "auth_required": True,
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

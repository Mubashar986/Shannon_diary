import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import User, get_current_user
from app.config import settings
from app.schemas.entity import AICompletionRequest, AICompletionResponse, ALLOWED_MODELS

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

GEMINIS = {
    "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
    "gemini-2.5-flash": "gemini-2.5-flash",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.0-flash",
}


@router.post("/complete", response_model=AICompletionResponse)
async def ai_complete(payload: AICompletionRequest, user: User = Depends(get_current_user)):
    """Gemini-backed completion. Authenticated, because every call spends a paid quota.

    Only Gemini is implemented. The previous version answered with a fake string
    whenever the real call failed, so the UI could never tell a working model from
    an unconfigured one.
    """
    if payload.model not in ALLOWED_MODELS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Unsupported model. Choose one of: {', '.join(sorted(ALLOWED_MODELS))}"
        )
    if not settings.gemini_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI provider not configured (GEMINI_API_KEY is empty)")

    model = GEMINIS[payload.model]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {
        "contents": [{"role": "user", "parts": [{"text": f"{payload.system_instruction}\n\n{payload.prompt}"}]}],
        "generationConfig": {"temperature": payload.temperature, "maxOutputTokens": payload.max_tokens},
    }
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0)) as client:
            resp = await client.post(url, params={"key": settings.gemini_api_key}, json=body)
    except httpx.HTTPError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "AI provider unreachable") from exc

    if resp.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"AI provider returned {resp.status_code}")
    try:
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (ValueError, KeyError, IndexError) as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "AI provider returned an unexpected response") from exc

    return AICompletionResponse(
        model=model,
        result=text,
        usage={"total_tokens": data.get("usageMetadata", {}).get("totalTokenCount", 0)},
    )

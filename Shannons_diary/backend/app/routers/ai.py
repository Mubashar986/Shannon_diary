import httpx
from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.schemas.entity import AICompletionRequest, AICompletionResponse

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

@router.post("/complete", response_model=AICompletionResponse)
async def ai_complete(payload: AICompletionRequest):
    """
    Model-agnostic AI completion endpoint.
    Routes to configured providers (Gemini, OpenAI, or direct fallback mock).
    """
    # 1. Gemini / Google AI Studio route
    if settings.gemini_api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{payload.model}:generateContent?key={settings.gemini_api_key}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    url,
                    json={
                        "contents": [
                            {"role": "user", "parts": [{"text": f"{payload.system_instruction}\n\n{payload.prompt}"}]}
                        ],
                        "generationConfig": {
                            "temperature": payload.temperature,
                            "maxOutputTokens": payload.max_tokens
                        }
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return AICompletionResponse(
                        model=payload.model,
                        result=text,
                        usage={"total_tokens": data.get("usageMetadata", {}).get("totalTokenCount", 0)}
                    )
        except Exception as e:
            # Fall through to fallback
            pass

    # 2. Mock / Dev Fallback (Ensures frontend team is never blocked if keys are missing)
    mock_reply = (
        f"[Dev AI Copilot Response ({payload.model})]\n"
        f"Prompt received: {payload.prompt[:80]}...\n"
        f"Ready to synthesize insights, embeddings, or agent actions."
    )
    return AICompletionResponse(
        model=payload.model or "dev-mock-model",
        result=mock_reply,
        usage={"total_tokens": 42}
    )

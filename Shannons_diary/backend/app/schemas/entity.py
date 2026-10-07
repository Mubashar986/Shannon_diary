from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import BaseModel, Field

# Interpolated into the Gemini REST URL, so anything not listed here is rejected.
ALLOWED_MODELS = {"gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-2.5-flash-lite"}


class EntityBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Primary title or identifier")
    content: Optional[str] = Field(None, description="Detailed text or body content")
    category: Optional[str] = Field("general", max_length=64, description="Logical category / partition")
    status: Optional[str] = Field("active", max_length=32, description="Lifecycle status")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary JSON metadata")
    is_public: Optional[bool] = Field(False, description="Visible to other users when true")


class EntityCreate(EntityBase):
    """No user_id: ownership is taken from the verified bearer token, never the payload."""


class EntityUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=64)
    status: Optional[str] = Field(None, max_length=32)
    metadata: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None


class EntityResponse(EntityBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=200, description="Text searched in title and content")
    category: Optional[str] = Field(None, max_length=64)
    limit: Optional[int] = Field(10, ge=1, le=50)


class AICompletionRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    system_instruction: Optional[str] = "You are an intelligent, precise AI copilot."
    model: Optional[str] = "gemini-2.5-flash"
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(1000, ge=1, le=8192)


class AICompletionResponse(BaseModel):
    model: str
    result: str
    usage: Optional[Dict[str, Any]] = None

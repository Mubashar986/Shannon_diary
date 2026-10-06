from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class EntityBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Primary title or identifier")
    content: Optional[str] = Field(None, description="Detailed text or body content")
    category: Optional[str] = Field("general", description="Logical category / partition")
    status: Optional[str] = Field("active", description="Lifecycle status")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary JSON metadata")
    is_public: Optional[bool] = Field(False, description="Publicly viewable flag")

class EntityCreate(EntityBase):
    user_id: Optional[str] = Field(None, description="Owner UUID")

class EntityUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None

class EntityResponse(EntityBase):
    id: str
    user_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, description="Search query string")
    category: Optional[str] = None
    limit: Optional[int] = Field(10, ge=1, le=50)
    use_vector: Optional[bool] = Field(False, description="Whether to perform semantic embedding search")

class AICompletionRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system_instruction: Optional[str] = "You are an intelligent, precise AI copilot."
    model: Optional[str] = "gemini-2.5-flash"
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000

class AICompletionResponse(BaseModel):
    model: str
    result: str
    usage: Optional[Dict[str, Any]] = None

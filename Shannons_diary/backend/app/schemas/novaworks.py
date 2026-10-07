from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    role: str
    specialization: Optional[str] = None
    skills: List[str] = Field(default_factory=list)


class LoginResponse(BaseModel):
    token: str
    user: UserProfile


class TaskResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    assignee_id: str
    assignee_name: Optional[str] = None
    deadline: str
    estimated_hours: float


class ProjectResponse(BaseModel):
    id: str
    name: str
    client_name: str
    description: Optional[str] = None
    manager_id: str
    manager_name: Optional[str] = None
    deadline: str
    task_count: int = 0
    total_hours: float = 0.0


class ProjectDetailResponse(ProjectResponse):
    tasks: List[TaskResponse] = Field(default_factory=list)


class TranscriptRequest(BaseModel):
    transcript: str = Field(..., min_length=20)


class TranscriptResponse(BaseModel):
    message: str
    projects_created: int
    tasks_created: int
    projects: List[ProjectResponse]

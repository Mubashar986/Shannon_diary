from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import User, get_current_user
from app.config import settings
from app.db import UpstreamError, rest_delete, rest_insert, rest_select, rest_update
from app.schemas.entity import EntityCreate, EntityResponse, EntityUpdate

router = APIRouter(prefix="/entities", tags=["Entities"])


def _visibility(user: User) -> str:
    return f"(user_id.eq.{user.id},is_public.eq.true)"


def _raise(exc: UpstreamError) -> None:
    detail = exc.message if settings.environment == "development" else "Request could not be completed"
    raise HTTPException(exc.status_code, detail)


@router.get("", response_model=List[EntityResponse])
async def list_entities(
    user: User = Depends(get_current_user),
    category: Optional[str] = Query(None, max_length=64),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Rows owned by the caller, plus rows marked public."""
    params: dict = {"or": _visibility(user)}
    if category:
        params["category"] = f"eq.{category}"
    try:
        return await rest_select(
            user.token, "entities", params=params, order="created_at.desc", limit=limit, offset=offset
        )
    except UpstreamError as exc:
        _raise(exc)


@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(entity_id: UUID, user: User = Depends(get_current_user)):
    try:
        rows = await rest_select(
            user.token, "entities", params={"id": f"eq.{entity_id}", "or": _visibility(user)}, limit=1
        )
    except UpstreamError as exc:
        _raise(exc)
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Entity not found")
    return rows[0]


@router.post("", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
async def create_entity(payload: EntityCreate, user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    data["user_id"] = user.id
    try:
        created = await rest_insert(user.token, "entities", data)
    except UpstreamError as exc:
        _raise(exc)
    if not created:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Failed to create entity")
    return created


@router.patch("/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: UUID, payload: EntityUpdate, user: User = Depends(get_current_user)
):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields provided to update")
    try:
        # user_id in the filter means a non-owner gets nothing back, even if RLS ever slips.
        return await rest_update(
            user.token, "entities", data, {"id": f"eq.{entity_id}", "user_id": f"eq.{user.id}"}
        )
    except UpstreamError as exc:
        _raise(exc)


@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(entity_id: UUID, user: User = Depends(get_current_user)):
    try:
        await rest_delete(user.token, "entities", {"id": f"eq.{entity_id}", "user_id": f"eq.{user.id}"})
    except UpstreamError as exc:
        _raise(exc)
    return None

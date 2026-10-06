from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.db import get_supabase
from app.schemas.entity import EntityCreate, EntityUpdate, EntityResponse

router = APIRouter(prefix="/entities", tags=["Entities"])

@router.get("", response_model=List[EntityResponse])
async def list_entities(
    category: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Retrieve entities, optionally filtered by category."""
    try:
        supabase = get_supabase()
        query = supabase.table("entities").select("*")
        if category:
            query = query.eq("category", category)
        l = int(limit) if isinstance(limit, (int, str)) else 20
        o = int(offset) if isinstance(offset, (int, str)) else 0
        response = query.order("created_at", desc=True).range(o, o + l - 1).execute()
        return response.data or []
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

@router.get("/{entity_id}", response_model=EntityResponse)
async def get_entity(entity_id: str):
    """Retrieve a single entity by ID."""
    try:
        supabase = get_supabase()
        response = supabase.table("entities").select("*").eq("id", entity_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")
        return response.data
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
async def create_entity(payload: EntityCreate):
    """Create a new generic entity."""
    try:
        supabase = get_supabase()
        data = payload.model_dump(exclude_unset=True)
        response = supabase.table("entities").insert(data).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create entity")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.patch("/{entity_id}", response_model=EntityResponse)
async def update_entity(entity_id: str, payload: EntityUpdate):
    """Update an existing entity."""
    try:
        supabase = get_supabase()
        data = payload.model_dump(exclude_unset=True)
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields provided to update")
        response = supabase.table("entities").update(data).eq("id", entity_id).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found or update failed")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entity(entity_id: str):
    """Delete an entity."""
    try:
        supabase = get_supabase()
        supabase.table("entities").delete().eq("id", entity_id).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

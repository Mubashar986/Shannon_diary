from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import User, get_current_user
from app.config import settings
from app.db import UpstreamError, rest_select
from app.schemas.entity import SearchQuery

router = APIRouter(prefix="/search", tags=["Search"])

# PostgREST reads these as filter-list separators, so they cannot come from a user.
_UNSAFE = {"(", ")", ",", "%", '"', "'"}

# Semantic search was scaffolded but never wired: the embeddings table is empty and
# no code produces vectors. It stays unimplemented rather than pretending to work.


def _safe(term: str) -> str:
    return "".join(ch for ch in term if ch not in _UNSAFE).strip()


@router.post("", response_model=List[Any])
async def search_records(query: SearchQuery, user: User = Depends(get_current_user)):
    """Text search over the caller's rows plus public ones."""
    term = _safe(query.query)
    if not term:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Query contains no searchable characters")

    # One nested logic tree: (visibility) AND (text match). PostgREST spells the inner
    # operators or(...); or_() is only valid as a top-level query parameter.
    params: dict[str, Any] = {
        "and": (
            f"(or(user_id.eq.{user.id},is_public.eq.true),"
            f"or(title.ilike.*{term}*,content.ilike.*{term}*))"
        )
    }
    if query.category:
        params["category"] = f"eq.{query.category}"

    try:
        rows = await rest_select(
            user.token, "entities", params=params, order="created_at.desc", limit=query.limit or 10
        )
    except UpstreamError as exc:
        detail = exc.message if settings.environment == "development" else "Search failed"
        raise HTTPException(exc.status_code, detail) from exc
    return rows

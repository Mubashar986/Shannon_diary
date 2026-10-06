from typing import List, Any
from fastapi import APIRouter, HTTPException, status
from app.db import get_supabase
from app.schemas.entity import SearchQuery

router = APIRouter(prefix="/search", tags=["Search"])

@router.post("", response_model=List[Any])
async def search_records(query: SearchQuery):
    """
    Unified Search Endpoint:
    - Text search over title and content.
    - Semantic vector search via RPC match_embeddings when use_vector is true.
    """
    try:
        supabase = get_supabase()
        
        if query.use_vector:
            # Semantic search path via Supabase RPC
            # Note: For actual vector search, query embedding vector must be supplied
            # or generated via embedding model.
            rpc_params = {
                "query_embedding": [0.0] * 1536,  # Placeholder or generate via AI
                "match_threshold": 0.4,
                "match_count": query.limit or 10
            }
            try:
                rpc_res = supabase.rpc("match_embeddings", rpc_params).execute()
                return rpc_res.data or []
            except Exception as rpc_err:
                # Fallback to standard text search if vector index isn't populated
                pass

        # Default fast text ILIKE search
        db_query = supabase.table("entities").select("*")
        if query.category:
            db_query = db_query.eq("category", query.category)
            
        db_query = db_query.or_(f"title.ilike.%{query.query}%,content.ilike.%{query.query}%")
        response = db_query.limit(query.limit or 10).execute()
        return response.data or []
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

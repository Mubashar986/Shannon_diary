import logging
from typing import Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase() -> Client:
    """Returns the standard Supabase client with Anon key."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or "your-project" in settings.supabase_url or not settings.supabase_anon_key:
            logger.warning("Supabase credentials not fully configured in .env. Initializing in offline/mock mode.")
        try:
            _supabase_client = create_client(settings.supabase_url, settings.supabase_anon_key or "anon-placeholder")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise
    return _supabase_client

def get_supabase_admin() -> Client:
    """Returns the Supabase client with Service Role Key (bypasses RLS for backend admin tasks)."""
    global _supabase_admin_client
    if _supabase_admin_client is None:
        key = settings.supabase_service_role_key or settings.supabase_anon_key or "admin-placeholder"
        try:
            _supabase_admin_client = create_client(settings.supabase_url, key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase admin client: {e}")
            raise
    return _supabase_admin_client

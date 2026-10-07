"""Supabase access for the FastAPI backend.

Two rules shape this module:

1. Every database call carries the *caller's* access token, so Postgres RLS — not
   Python — decides which rows exist for a request. A shared service-role client
   would silently return every user's rows the moment a filter is forgotten.
2. Everything here is async. The sync supabase-py client blocks the event loop.
"""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

POSTGREST = f"{settings.supabase_url}/rest/v1"
GOTRUE = f"{settings.supabase_url}/auth/v1"

_request_timeout = httpx.Timeout(20.0, connect=8.0)
_token_cache: dict[str, tuple[str, float]] = {}
_TOKEN_CACHE_TTL = 60.0
_TOKEN_CACHE_MAX = 4096


class UpstreamError(RuntimeError):
    """A Supabase failure mapped onto an HTTP status, with the raw body kept for logs."""

    def __init__(self, status_code: int, message: str, code: str | None = None, raw: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.message = message
        self.code = code
        self.raw = raw


def _base_headers(token: str) -> dict[str, str]:
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def _classify(status: int, body: Any) -> UpstreamError:
    message = "Upstream request failed"
    code = None
    if isinstance(body, dict):
        message = body.get("message") or message
        code = body.get("code")
    if status in (401, 403):
        status = 401
    elif code == "PGRST116":
        status = 404
    elif code in {"22P02", "23503", "23505", "23514", "PGRST102", "PGRST204", "PGRST205"}:
        status = 400
    elif status >= 500:
        status = 502
    return UpstreamError(status, message, code, body)


async def _request(method: str, url: str, token: str, *, params: dict | None = None,
                   json_body: Any = None, headers: dict | None = None) -> Any:
    hdrs = _base_headers(token)
    if headers:
        hdrs.update(headers)
    async with httpx.AsyncClient(timeout=_request_timeout) as client:
        resp = await client.request(method, url, headers=hdrs, params=params, json=json_body)
    if resp.status_code >= 400:
        try:
            body = resp.json()
        except ValueError:
            body = {"message": resp.text[:300]}
        error = _classify(resp.status_code, body)
        logger.warning("supabase %s %s -> %s %s", method, url, resp.status_code, error.raw)
        raise error
    if resp.status_code == 204 or not resp.content:
        return None
    return resp.json()


async def rest_select(token: str, table: str, *, params: dict,
                      order: str | None = None, limit: int | None = None,
                      offset: int | None = None) -> list[dict[str, Any]]:
    query: dict[str, Any] = {"select": params.get("select", "*")}
    query.update({k: v for k, v in params.items() if k != "select"})
    if order:
        query["order"] = order
    if limit:
        query["limit"] = limit
    if offset:
        query["offset"] = offset
    data = await _request("GET", f"{POSTGREST}/{table}", token, params=query)
    return data or []


async def rest_insert(token: str, table: str, payload: dict) -> dict[str, Any]:
    data = await _request("POST", f"{POSTGREST}/{table}", token, json_body=payload,
                          headers={"Prefer": "return=representation"})
    return (data or [{}])[0] if isinstance(data, list) else (data or {})


async def rest_update(token: str, table: str, payload: dict, filters: dict) -> dict[str, Any]:
    data = await _request("PATCH", f"{POSTGREST}/{table}", token, params=filters, json_body=payload,
                          headers={"Prefer": "return=representation"})
    if not data:
        raise UpstreamError(404, "No matching row", "PGRST116")
    return (data or [{}])[0] if isinstance(data, list) else (data or {})


async def rest_delete(token: str, table: str, filters: dict) -> None:
    await _request("DELETE", f"{POSTGREST}/{table}", token, params=filters,
                   headers={"Prefer": "return=representation"})


async def verify_access_token(token: str) -> str | None:
    """Resolve an access token to a user id.

    GoTrue is asked rather than decoding locally, so both the legacy HS256 project
    secret and the newer JWT key system work, and a revoked or deleted user stops
    working at once instead of at token expiry.
    """
    cached = _token_cache.get(token)
    if cached and cached[1] > time.monotonic():
        return cached[0]
    try:
        async with httpx.AsyncClient(timeout=_request_timeout) as client:
            resp = await client.get(f"{GOTRUE}/user", headers=_base_headers(token))
    except httpx.HTTPError as exc:
        logger.error("auth check unreachable: %s", exc)
        raise UpstreamError(502, "Authentication service unreachable") from exc
    if resp.status_code != 200:
        return None
    try:
        payload = resp.json() or {}
    except ValueError:
        return None
    uid = payload.get("id") if isinstance(payload, dict) else None
    if not uid:
        return None
    if len(_token_cache) > _TOKEN_CACHE_MAX:
        _token_cache.clear()
    _token_cache[token] = (uid, time.monotonic() + _TOKEN_CACHE_TTL)
    return uid

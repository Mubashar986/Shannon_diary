from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import UpstreamError, verify_access_token

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class User:
    id: str
    token: str


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> User:
    if creds is None or not creds.credentials:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Missing bearer token", {"WWW-Authenticate": "Bearer"}
        )
    try:
        uid = await verify_access_token(creds.credentials)
    except UpstreamError as exc:
        raise HTTPException(exc.status_code, exc.message) from exc
    if not uid:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, "Invalid or expired session", {"WWW-Authenticate": "Bearer"}
        )
    return User(id=uid, token=creds.credentials)

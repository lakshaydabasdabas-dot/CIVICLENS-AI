"""
ADMIN GUARD SERVICE

Utility for protecting selected backend routes with bearer auth.
"""

from __future__ import annotations

from fastapi import Header, HTTPException

from APP.SERVICES.AUTH_SERVICE import decode_access_token


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid authorization scheme.")

    return authorization[len(prefix):].strip()


def require_admin_user(authorization: str | None = Header(default=None)) -> dict:
    token = extract_bearer_token(authorization)

    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    role = payload.get("role", "")
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    return payload
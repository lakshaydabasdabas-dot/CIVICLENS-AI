"""
AUTH API ROUTES
"""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from APP.SERVICES.AUTH_SERVICE import (
    create_access_token,
    decode_access_token,
    verify_admin_credentials,
)

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


def extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header.")

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        raise HTTPException(status_code=401, detail="Invalid authorization scheme.")

    return authorization[len(prefix):].strip()


@router.post("/login")
def login(payload: LoginRequest):
    username = payload.username.strip()
    password = payload.password

    if not verify_admin_credentials(username, password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_access_token(username=username, role="admin")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": username,
            "role": "admin",
        },
    }


@router.get("/me")
def get_current_user(authorization: str | None = Header(default=None)):
    token = extract_bearer_token(authorization)

    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return {
        "username": payload["sub"],
        "role": payload.get("role", "admin"),
        "expires_at": payload["exp"],
    }
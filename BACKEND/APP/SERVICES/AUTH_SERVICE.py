"""
AUTH SERVICE

Simple admin authentication for CivicLens AI.

Current version:
- uses environment variables for admin credentials
- returns signed bearer tokens
- supports role-aware protected routes

Environment variables supported:
- CIVICLENS_ADMIN_USERNAME
- CIVICLENS_ADMIN_PASSWORD
- CIVICLENS_AUTH_SECRET
- CIVICLENS_AUTH_TTL_HOURS
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Dict, Any


DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "civiclens123"
DEFAULT_SECRET = "change-this-secret-in-production"
DEFAULT_TTL_HOURS = 12


def _get_username() -> str:
    return os.getenv("CIVICLENS_ADMIN_USERNAME", DEFAULT_USERNAME)


def _get_password() -> str:
    return os.getenv("CIVICLENS_ADMIN_PASSWORD", DEFAULT_PASSWORD)


def _get_secret() -> str:
    return os.getenv("CIVICLENS_AUTH_SECRET", DEFAULT_SECRET)


def _get_ttl_hours() -> int:
    try:
        return int(os.getenv("CIVICLENS_AUTH_TTL_HOURS", str(DEFAULT_TTL_HOURS)))
    except ValueError:
        return DEFAULT_TTL_HOURS


def verify_admin_credentials(username: str, password: str) -> bool:
    return username == _get_username() and password == _get_password()


def _b64_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def _sign(payload_text: str) -> str:
    secret = _get_secret().encode("utf-8")
    signature = hmac.new(secret, payload_text.encode("utf-8"), hashlib.sha256).digest()
    return _b64_encode(signature)


def create_access_token(username: str, role: str = "admin") -> str:
    expires_at = int(time.time()) + (_get_ttl_hours() * 3600)

    payload = {
        "sub": username,
        "role": role,
        "exp": expires_at,
    }

    payload_text = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    payload_encoded = _b64_encode(payload_text.encode("utf-8"))
    signature = _sign(payload_encoded)

    return f"{payload_encoded}.{signature}"


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        payload_encoded, signature = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid token format.") from exc

    expected_signature = _sign(payload_encoded)
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid token signature.")

    payload_bytes = _b64_decode(payload_encoded)
    payload = json.loads(payload_bytes.decode("utf-8"))

    if int(payload.get("exp", 0)) < int(time.time()):
        raise ValueError("Token expired.")

    return payload
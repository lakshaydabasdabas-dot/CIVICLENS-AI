from __future__ import annotations

import os
from typing import Any, Dict, List


def email_enabled() -> bool:
    return os.getenv("CIVICLENS_EMAIL_ENABLED", "false").lower() == "true"


def get_default_sender() -> str:
    return os.getenv("CIVICLENS_EMAIL_FROM", "no-reply@civiclens.local")


def build_email_payload(
    *,
    to: List[str],
    subject: str,
    body: str,
    metadata: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    return {
        "from": get_default_sender(),
        "to": to,
        "subject": subject,
        "body": body,
        "metadata": metadata or {},
        "delivery_mode": "console" if not email_enabled() else "provider",
    }


def send_email(
    *,
    to: List[str],
    subject: str,
    body: str,
    metadata: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    payload = build_email_payload(
        to=to,
        subject=subject,
        body=body,
        metadata=metadata,
    )

    print("CIVICLENS EMAIL DEBUG:", payload)

    return {
        "success": True,
        "message": "Email payload prepared successfully.",
        "payload": payload,
    }
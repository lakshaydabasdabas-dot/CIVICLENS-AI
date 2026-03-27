"""
UTILITY HELPERS

Reusable helper functions for CivicLens AI.
These are general-purpose helpers that are safe for MVP and
can be reused across services and API routes.
"""

from datetime import datetime


def get_current_utc_time() -> datetime:
    """
    Return current UTC datetime.
    """
    return datetime.utcnow()


def normalize_text(value: str | None) -> str:
    """
    Safely normalize text input by stripping whitespace.
    Returns empty string if value is None.
    """
    if value is None:
        return ""
    return value.strip()


def safe_upper(value: str | None) -> str:
    """
    Convert text to uppercase safely.
    Returns empty string if value is None.
    """
    if value is None:
        return ""
    return value.upper()


def safe_lower(value: str | None) -> str:
    """
    Convert text to lowercase safely.
    Returns empty string if value is None.
    """
    if value is None:
        return ""
    return value.lower()
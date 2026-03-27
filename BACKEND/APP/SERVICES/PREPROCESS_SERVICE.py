"""
TEXT PREPROCESSING SERVICE

This service handles basic complaint text cleaning for CivicLens AI.
It is intentionally lightweight and stable for the MVP.
"""

import re


def clean_text(text: str) -> str:
    """
    Clean incoming complaint text by:
    - converting to lowercase
    - removing extra spaces
    - removing special characters except basic word characters
    """
    if not text:
        return ""

    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text
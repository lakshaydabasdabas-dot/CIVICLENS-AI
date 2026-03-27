"""
SIMILARITY SERVICE

This module calculates complaint similarity using:
- text similarity
- location similarity
- category similarity

This is intentionally lightweight and dependency-free for now.

Later you can upgrade this module with:
- sentence-transformer embeddings
- vector search
- duplicate cluster generation
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Optional


def normalize_text(text: Optional[str]) -> str:
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def safe_ratio(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def compute_text_similarity(title_1: str, description_1: str, title_2: str, description_2: str) -> float:
    text_1 = normalize_text(f"{title_1} {description_1}")
    text_2 = normalize_text(f"{title_2} {description_2}")
    return round(safe_ratio(text_1, text_2), 4)


def compute_location_similarity(location_1: Optional[str], location_2: Optional[str]) -> float:
    a = normalize_text(location_1)
    b = normalize_text(location_2)

    if not a or not b:
        return 0.0

    if a == b:
        return 1.0

    return round(safe_ratio(a, b), 4)


def compute_category_similarity(category_1: Optional[str], category_2: Optional[str]) -> float:
    if not category_1 or not category_2:
        return 0.0
    return 1.0 if category_1 == category_2 else 0.0


def compute_duplicate_score(
    title_1: str,
    description_1: str,
    location_1: Optional[str],
    category_1: Optional[str],
    title_2: str,
    description_2: str,
    location_2: Optional[str],
    category_2: Optional[str],
) -> float:
    text_score = compute_text_similarity(title_1, description_1, title_2, description_2)
    location_score = compute_location_similarity(location_1, location_2)
    category_score = compute_category_similarity(category_1, category_2)

    # weighted score
    final_score = (0.7 * text_score) + (0.2 * location_score) + (0.1 * category_score)
    return round(final_score, 4)
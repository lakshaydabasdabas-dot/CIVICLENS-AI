from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Optional


def normalize_text(text: Optional[str]) -> str:
    text = str(text or "").lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def safe_ratio(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def compute_text_similarity(
    title_1: str,
    description_1: str,
    title_2: str,
    description_2: str,
) -> float:
    left = normalize_text(f"{title_1} {description_1}")
    right = normalize_text(f"{title_2} {description_2}")
    return round(safe_ratio(left, right), 4)


def compute_location_similarity(location_1: Optional[str], location_2: Optional[str]) -> float:
    left = normalize_text(location_1)
    right = normalize_text(location_2)

    if not left or not right:
        return 0.0

    if left == right:
        return 1.0

    return round(safe_ratio(left, right), 4)


def compute_category_similarity(category_1: Optional[str], category_2: Optional[str]) -> float:
    left = str(category_1 or "").upper().strip()
    right = str(category_2 or "").upper().strip()

    if not left or not right:
        return 0.0

    return 1.0 if left == right else 0.0


def compute_duplicate_score(
    *,
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

    score = (0.72 * text_score) + (0.18 * location_score) + (0.10 * category_score)
    return round(score, 4)
"""
PRIORITY SERVICE

This service computes a complaint priority score from:
- urgency
- complaint category
- duplicate likelihood
- region/locality importance keywords

Priority score range: 0 to 100
"""

from __future__ import annotations

from typing import Optional


HIGH_IMPACT_CATEGORIES = {
    "SEWAGE",
    "DRAINAGE",
    "WATER_SUPPLY",
    "PUBLIC_SAFETY",
    "ROADS",
    "STREETLIGHTS",
}

MEDIUM_IMPACT_CATEGORIES = {
    "WASTE_MANAGEMENT",
    "SANITATION",
    "ENCROACHMENT",
    "ANIMAL_CONTROL",
    "PARKS_PUBLIC_SPACES",
}


def compute_priority_score(
    *,
    urgency: Optional[str],
    category: Optional[str],
    similarity_score: Optional[float] = None,
) -> float:
    score = 0.0

    urgency = (urgency or "").upper().strip()
    category = (category or "").upper().strip()

    if urgency == "HIGH":
        score += 50
    elif urgency == "MEDIUM":
        score += 30
    elif urgency == "LOW":
        score += 15

    if category in HIGH_IMPACT_CATEGORIES:
        score += 25
    elif category in MEDIUM_IMPACT_CATEGORIES:
        score += 15
    else:
        score += 8

    if similarity_score is not None:
        if similarity_score >= 0.90:
            score += 20
        elif similarity_score >= 0.80:
            score += 15
        elif similarity_score >= 0.72:
            score += 10

    return round(min(score, 100.0), 2)


def priority_band(priority_score: Optional[float]) -> str:
    if priority_score is None:
        return "UNASSIGNED"

    if priority_score >= 75:
        return "CRITICAL"
    if priority_score >= 50:
        return "HIGH"
    if priority_score >= 30:
        return "MEDIUM"
    return "LOW"
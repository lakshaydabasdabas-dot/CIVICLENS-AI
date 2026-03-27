from __future__ import annotations

from typing import Optional


CRITICAL_CATEGORIES = {
    "PUBLIC_SAFETY",
    "ELECTRICAL",
    "SEWAGE",
    "DRAINAGE",
}

HIGH_IMPACT_CATEGORIES = {
    "STREETLIGHTS",
    "WATER_SUPPLY",
    "ROADS",
    "WASTE_MANAGEMENT",
    "SANITATION",
}

MEDIUM_IMPACT_CATEGORIES = {
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

    urgency = str(urgency or "").upper().strip()
    category = str(category or "").upper().strip()

    if urgency == "HIGH":
        score += 52
    elif urgency == "MEDIUM":
        score += 34
    elif urgency == "LOW":
        score += 16

    if category in CRITICAL_CATEGORIES:
        score += 30
    elif category in HIGH_IMPACT_CATEGORIES:
        score += 22
    elif category in MEDIUM_IMPACT_CATEGORIES:
        score += 14
    else:
        score += 8

    if similarity_score is not None:
        if similarity_score >= 0.90:
            score += 16
        elif similarity_score >= 0.80:
            score += 12
        elif similarity_score >= 0.72:
            score += 8

    return round(min(score, 100.0), 2)


def priority_band(priority_score: Optional[float]) -> str:
    if priority_score is None:
        return "UNASSIGNED"
    if priority_score >= 80:
        return "CRITICAL"
    if priority_score >= 55:
        return "HIGH"
    if priority_score >= 32:
        return "MEDIUM"
    return "LOW"
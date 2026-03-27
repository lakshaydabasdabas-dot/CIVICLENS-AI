"""
ANALYSIS SERVICE

NOTE:
The file name is retained for compatibility with the existing codebase,
but this version is a modular civic complaint analysis pipeline.

It performs:
- rule-based category classification
- urgency classification
- department routing
- summary generation
- confidence scoring
"""

from __future__ import annotations

import re
from typing import Dict

from APP.SERVICES.ROUTING_SERVICE import route_department
from APP.SERVICES.SUMMARIZATION_SERVICE import build_complaint_summary


CATEGORY_RULES = {
    "WATER_SUPPLY": [
        "water supply", "no water", "water shortage", "water leakage",
        "water pipe", "pipeline", "dirty water", "drinking water"
    ],
    "SEWAGE": [
        "sewage", "sewer", "gutter overflow", "sewer overflow",
        "septic", "dirty drain water"
    ],
    "DRAINAGE": [
        "drainage", "drain", "waterlogging", "water logging",
        "stagnant water", "flooded road"
    ],
    "ROADS": [
        "road broken", "pothole", "potholes", "damaged road",
        "road damage", "road crack", "broken street"
    ],
    "STREETLIGHTS": [
        "streetlight", "street light", "light not working",
        "dark street", "pole light", "electric pole light"
    ],
    "WASTE_MANAGEMENT": [
        "garbage", "trash", "waste", "dump", "overflowing bin",
        "bin full", "litter", "solid waste"
    ],
    "SANITATION": [
        "unclean", "dirty street", "cleaning issue", "sanitation",
        "hygiene issue", "public toilet dirty"
    ],
    "ENCROACHMENT": [
        "encroachment", "illegal occupation", "illegal parking blockage",
        "footpath blocked", "road blocked by shops"
    ],
    "PARKS_PUBLIC_SPACES": [
        "park damaged", "public park", "playground damaged",
        "broken bench", "public space maintenance"
    ],
    "ANIMAL_CONTROL": [
        "stray dog", "dog bite", "stray cattle", "animal nuisance",
        "monkey issue", "dead animal"
    ],
    "PUBLIC_SAFETY": [
        "dangerous", "accident risk", "unsafe", "open wire",
        "open manhole", "fire risk", "collapse risk"
    ],
}


HIGH_URGENCY_KEYWORDS = {
    "urgent", "emergency", "immediately", "dangerous", "unsafe",
    "accident", "flooded", "overflow", "fire", "injury", "open manhole",
    "electrocution", "severe", "critical"
}

MEDIUM_URGENCY_KEYWORDS = {
    "soon", "issue", "problem", "damaged", "broken", "not working",
    "overflowing", "blocked", "dirty"
}


def _normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


def _keyword_hits(text: str, keywords: list[str]) -> int:
    score = 0
    for keyword in keywords:
        if keyword in text:
            score += 1
    return score


def classify_category(text: str) -> str:
    normalized = _normalize_text(text)

    best_category = "OTHER"
    best_score = 0

    for category, keywords in CATEGORY_RULES.items():
        hits = _keyword_hits(normalized, keywords)
        if hits > best_score:
            best_score = hits
            best_category = category

    return best_category


def classify_urgency(text: str, category: str) -> str:
    normalized = _normalize_text(text)

    high_hits = sum(1 for keyword in HIGH_URGENCY_KEYWORDS if keyword in normalized)
    medium_hits = sum(1 for keyword in MEDIUM_URGENCY_KEYWORDS if keyword in normalized)

    if category in {"PUBLIC_SAFETY", "SEWAGE", "DRAINAGE"} and medium_hits >= 1:
        return "HIGH"

    if high_hits >= 1:
        return "HIGH"
    if medium_hits >= 2:
        return "MEDIUM"
    if medium_hits == 1:
        return "MEDIUM"

    if category in {"ROADS", "STREETLIGHTS", "WATER_SUPPLY", "WASTE_MANAGEMENT"}:
        return "MEDIUM"

    return "LOW"


def estimate_confidence(text: str, category: str) -> float:
    normalized = _normalize_text(text)

    if category == "OTHER":
        return 0.55

    keyword_count = len(normalized.split())
    if keyword_count >= 20:
        return 0.86
    if keyword_count >= 10:
        return 0.78
    return 0.68


def analyzeComplaint(text: str) -> Dict[str, object]:
    category = classify_category(text)
    urgency = classify_urgency(text, category)
    department = route_department(category)
    ai_summary = build_complaint_summary(
        title="Complaint Report",
        description=text,
        location=None,
        category=category,
        urgency=urgency,
        department=department,
    )
    model_confidence = estimate_confidence(text, category)

    return {
        "category": category,
        "urgency": urgency,
        "department": department,
        "ai_summary": ai_summary,
        "model_confidence": model_confidence,
    }
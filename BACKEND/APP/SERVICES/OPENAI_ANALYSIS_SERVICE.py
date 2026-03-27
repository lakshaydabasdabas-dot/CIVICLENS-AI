from __future__ import annotations

import re
from typing import Dict

from APP.SERVICES.ROUTING_SERVICE import route_agency_from_department, route_department
from APP.SERVICES.SUMMARIZATION_SERVICE import build_complaint_summary


CATEGORY_RULES = {
    "ELECTRICAL": [
        "electricity",
        "electric",
        "power cut",
        "power outage",
        "no power",
        "no electricity",
        "transformer",
        "short circuit",
        "wire sparking",
        "sparking wire",
        "electric fault",
        "feeder problem",
        "voltage issue",
        "electric pole",
        "live wire",
    ],
    "STREETLIGHTS": [
        "streetlight",
        "street light",
        "streetlights",
        "street lights",
        "light not working",
        "pole light",
        "dark street",
        "street lamp",
        "lamp post",
    ],
    "WATER_SUPPLY": [
        "water supply",
        "no water",
        "water shortage",
        "water leakage",
        "water leak",
        "water pipe",
        "pipeline",
        "dirty water",
        "drinking water",
        "water tank",
    ],
    "SEWAGE": [
        "sewage",
        "sewer",
        "sewer overflow",
        "gutter overflow",
        "dirty drain water",
        "septic",
        "sewer blockage",
    ],
    "DRAINAGE": [
        "drainage",
        "drain",
        "waterlogging",
        "water logging",
        "stagnant water",
        "flooded road",
        "clogged drain",
    ],
    "ROADS": [
        "road broken",
        "broken road",
        "pothole",
        "potholes",
        "damaged road",
        "road damage",
        "road crack",
        "broken street",
        "road cave in",
    ],
    "WASTE_MANAGEMENT": [
        "garbage",
        "trash",
        "waste",
        "dump",
        "overflowing bin",
        "bin full",
        "litter",
        "solid waste",
        "garbage pile",
    ],
    "SANITATION": [
        "dirty street",
        "sanitation",
        "cleaning issue",
        "unclean",
        "public toilet dirty",
        "hygiene issue",
        "unclean area",
    ],
    "ENCROACHMENT": [
        "encroachment",
        "illegal occupation",
        "footpath blocked",
        "road blocked by shops",
        "illegal parking blockage",
    ],
    "PARKS_PUBLIC_SPACES": [
        "park damaged",
        "public park",
        "playground damaged",
        "broken bench",
        "public space maintenance",
    ],
    "ANIMAL_CONTROL": [
        "stray dog",
        "dog bite",
        "stray cattle",
        "animal nuisance",
        "monkey issue",
        "dead animal",
    ],
    "PUBLIC_SAFETY": [
        "dangerous",
        "unsafe",
        "accident risk",
        "open manhole",
        "fire risk",
        "collapse risk",
        "public hazard",
        "risk to life",
    ],
}


HIGH_URGENCY_KEYWORDS = {
    "urgent",
    "emergency",
    "immediately",
    "dangerous",
    "unsafe",
    "accident",
    "fire",
    "injury",
    "electrocution",
    "critical",
    "severe",
    "live wire",
    "sparking",
    "overflowing",
    "flooded",
    "not working since night",
}

MEDIUM_URGENCY_KEYWORDS = {
    "not working",
    "broken",
    "issue",
    "problem",
    "blocked",
    "dirty",
    "leakage",
    "dark",
    "outage",
    "overflow",
}


def _normalize_text(text: str) -> str:
    text = str(text or "").lower().strip()
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

    if category in {"PUBLIC_SAFETY", "ELECTRICAL", "SEWAGE", "DRAINAGE"} and (
        high_hits >= 1 or medium_hits >= 1
    ):
        return "HIGH"

    if category == "STREETLIGHTS" and ("dark street" in normalized or "unsafe" in normalized):
        return "HIGH"

    if high_hits >= 1:
        return "HIGH"

    if medium_hits >= 2:
        return "MEDIUM"

    if medium_hits == 1:
        return "MEDIUM"

    if category in {
        "STREETLIGHTS",
        "WATER_SUPPLY",
        "ROADS",
        "WASTE_MANAGEMENT",
        "SANITATION",
    }:
        return "MEDIUM"

    return "LOW"


def estimate_confidence(text: str, category: str) -> float:
    normalized = _normalize_text(text)

    if category == "OTHER":
        return 0.54

    token_count = len(normalized.split())

    if token_count >= 24:
        return 0.89
    if token_count >= 14:
        return 0.80
    return 0.71


def analyzeComplaint(text: str) -> Dict[str, object]:
    category = classify_category(text)
    urgency = classify_urgency(text, category)
    department = route_department(category)
    target_agency = route_agency_from_department(department)

    ai_summary = build_complaint_summary(
        title="Complaint Report",
        description=text,
        location=None,
        category=category,
        urgency=urgency,
        department=department,
    )

    if target_agency:
        ai_summary = f"{ai_summary} Likely forwarding agency: {target_agency}."

    model_confidence = estimate_confidence(text, category)

    return {
        "category": category,
        "urgency": urgency,
        "department": department,
        "target_agency": target_agency,
        "ai_summary": ai_summary,
        "model_confidence": model_confidence,
    }
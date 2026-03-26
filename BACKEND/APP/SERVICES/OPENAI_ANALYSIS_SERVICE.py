"""
OPENAI ANALYSIS SERVICE

Structured complaint analysis using the OpenAI Responses API.
This replaces the legacy dataset/rule classifier in the request path while
keeping a small deterministic fallback for local development and API failures.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from APP.CORE.CONFIG import settings


ALLOWED_CATEGORIES = (
    "ELECTRICITY",
    "WATER_SUPPLY",
    "SEWAGE",
    "ROADS",
    "SANITATION",
    "TRAFFIC",
    "GENERAL_ADMINISTRATION",
)

ALLOWED_URGENCY = ("LOW", "MEDIUM", "HIGH", "CRITICAL")

CATEGORY_TO_DEPARTMENT = {
    "ELECTRICITY": "ELECTRICAL_MAINTENANCE",
    "WATER_SUPPLY": "WATER_SERVICES",
    "SEWAGE": "SEWAGE_AND_DRAINAGE",
    "ROADS": "ROAD_MAINTENANCE",
    "SANITATION": "SANITATION_TEAM",
    "TRAFFIC": "TRAFFIC_MANAGEMENT",
    "GENERAL_ADMINISTRATION": "GENERAL_ADMINISTRATION",
}

SEWAGE_KEYWORDS = (
    "sewage",
    "sewer",
    "drain",
    "drainage",
    "manhole",
    "gutter",
    "wastewater",
    "waste water",
    "septic",
    "blocked drain",
    "overflowing drain",
)

SYSTEM_PROMPT = """
You are the complaint triage engine for CivicLens AI.

Classify each civic complaint into exactly one category from this fixed list:
- ELECTRICITY
- WATER_SUPPLY
- SEWAGE
- ROADS
- SANITATION
- TRAFFIC
- GENERAL_ADMINISTRATION

Urgency must be exactly one of:
- LOW
- MEDIUM
- HIGH
- CRITICAL

Hard classification rules:
- Any complaint about sewage, sewer lines, drainage blockage, manholes, wastewater, gutters, or drain overflow MUST be SEWAGE.
- Sewage-related complaints MUST NEVER be GENERAL_ADMINISTRATION.
- Use GENERAL_ADMINISTRATION only when the complaint clearly does not fit any other allowed category.
- Return concise operational language, not a conversation.

Return strict JSON only and follow the schema exactly.
""".strip()

ANALYSIS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "category": {
            "type": "string",
            "enum": list(ALLOWED_CATEGORIES),
        },
        "urgency": {
            "type": "string",
            "enum": list(ALLOWED_URGENCY),
        },
        "ai_summary": {
            "type": "string",
        },
    },
    "required": ["category", "urgency", "ai_summary"],
}


def analyzeComplaint(text: str) -> dict[str, str]:
    """
    Analyze complaint text and return a normalized structured result.
    """

    normalized_text = " ".join((text or "").split())

    if not normalized_text:
        raise ValueError("Complaint text is required.")

    try:
        if settings.OPENAI_API_KEY:
            model_result = _analyze_with_openai(normalized_text)
        else:
            model_result = _fallback_analysis(normalized_text)
    except Exception as error:
        print(f"[OPENAI ANALYSIS SERVICE] Falling back after error: {error}")
        model_result = _fallback_analysis(normalized_text)

    return _normalize_analysis(normalized_text, model_result)


def _analyze_with_openai(text: str) -> dict[str, Any]:
    response = httpx.post(
        "https://api.openai.com/v1/responses",
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.OPENAI_MODEL,
            "instructions": SYSTEM_PROMPT,
            "input": text,
            "max_output_tokens": 250,
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "civiclens_complaint_analysis",
                    "strict": True,
                    "schema": ANALYSIS_SCHEMA,
                }
            },
        },
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    payload = response.json()
    output_text = _extract_output_text(payload)
    return json.loads(output_text)


def _extract_output_text(payload: dict[str, Any]) -> str:
    direct_output_text = payload.get("output_text")

    if isinstance(direct_output_text, str) and direct_output_text.strip():
        return direct_output_text

    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "refusal":
                raise ValueError(content.get("refusal") or "Model refused the request.")

            if content.get("type") == "output_text":
                text = content.get("text", "").strip()

                if text:
                    return text

    raise ValueError("No structured output returned by OpenAI.")


def _normalize_analysis(text: str, raw_analysis: dict[str, Any]) -> dict[str, str]:
    keyword_category = _keyword_category(text)
    category = str(raw_analysis.get("category") or "").upper()
    urgency = str(raw_analysis.get("urgency") or "").upper()

    if category not in ALLOWED_CATEGORIES:
        category = keyword_category

    if keyword_category == "SEWAGE":
        category = "SEWAGE"

    if category == "GENERAL_ADMINISTRATION" and keyword_category != "GENERAL_ADMINISTRATION":
        category = keyword_category

    if urgency not in ALLOWED_URGENCY:
        urgency = _keyword_urgency(text)

    ai_summary = str(raw_analysis.get("ai_summary") or "").strip()

    if not ai_summary:
        ai_summary = _build_summary(category, urgency)

    return {
        "category": category,
        "urgency": urgency,
        "department": CATEGORY_TO_DEPARTMENT[category],
        "ai_summary": ai_summary,
    }


def _fallback_analysis(text: str) -> dict[str, str]:
    category = _keyword_category(text)
    urgency = _keyword_urgency(text)

    return {
        "category": category,
        "urgency": urgency,
        "ai_summary": _build_summary(category, urgency),
    }


def _keyword_category(text: str) -> str:
    lowered_text = text.lower()

    ordered_rules = (
        ("SEWAGE", SEWAGE_KEYWORDS),
        (
            "ELECTRICITY",
            (
                "electricity",
                "power",
                "streetlight",
                "street light",
                "transformer",
                "voltage",
                "wire",
                "electric",
                "outage",
                "blackout",
            ),
        ),
        (
            "WATER_SUPPLY",
            (
                "water supply",
                "no water",
                "water shortage",
                "low pressure",
                "tap water",
                "pipeline leak",
                "water pipeline",
                "drinking water",
                "water connection",
                "tanker",
                "borewell",
            ),
        ),
        (
            "ROADS",
            (
                "road",
                "pothole",
                "footpath",
                "sidewalk",
                "street surface",
                "carriageway",
                "speed breaker",
                "road repair",
            ),
        ),
        (
            "SANITATION",
            (
                "garbage",
                "trash",
                "waste collection",
                "unclean",
                "dirty",
                "cleaning",
                "sweeping",
                "bin",
                "litter",
                "public toilet",
                "sanitation",
            ),
        ),
        (
            "TRAFFIC",
            (
                "traffic",
                "signal",
                "parking",
                "congestion",
                "jam",
                "intersection",
                "vehicle movement",
                "traffic light",
            ),
        ),
    )

    for category, keywords in ordered_rules:
        if any(keyword in lowered_text for keyword in keywords):
            return category

    return "GENERAL_ADMINISTRATION"


def _keyword_urgency(text: str) -> str:
    lowered_text = text.lower()

    if any(
        keyword in lowered_text
        for keyword in (
            "electrocution",
            "live wire",
            "fire",
            "accident",
            "collapsed",
            "burst sewer",
            "major overflow",
            "emergency",
        )
    ):
        return "CRITICAL"

    if any(
        keyword in lowered_text
        for keyword in (
            "power outage",
            "no water",
            "blocked drain",
            "overflow",
            "unsafe",
            "deep pothole",
            "traffic signal not working",
            "severe",
        )
    ):
        return "HIGH"

    if any(
        keyword in lowered_text
        for keyword in (
            "not working",
            "problem",
            "issue",
            "repair",
            "maintenance",
            "delay",
        )
    ):
        return "MEDIUM"

    return "LOW"


def _build_summary(category: str, urgency: str) -> str:
    return (
        f"Complaint classified as {category} with {urgency} urgency and routed "
        f"to {CATEGORY_TO_DEPARTMENT[category]}."
    )

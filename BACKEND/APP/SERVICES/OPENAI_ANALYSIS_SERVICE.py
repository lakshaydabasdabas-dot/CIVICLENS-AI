"""
AI ANALYSIS SERVICE

Hierarchical complaint classification with an AI-first flow.
DeepSeek is treated as the primary decision-maker, while a minimal
keyword fallback is only used when the AI response is invalid or uncertain.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from APP.CORE.CONFIG import settings


DEEPSEEK_CHAT_COMPLETIONS_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

ALLOWED_MAIN_CATEGORIES = (
    "utilities",
    "infrastructure",
    "sanitation",
    "transportation",
    "environment",
    "public_safety",
    "governance",
    "health",
    "education",
    "other",
)

ALLOWED_SUBCATEGORIES = {
    "utilities": (
        "sewage",
        "water_supply",
        "electricity",
        "drainage",
        "pipeline_leak",
        "water_contamination",
        "power_outage",
        "transformer_issue",
        "billing_issue",
        "meter_problem",
    ),
    "infrastructure": (
        "road_damage",
        "potholes",
        "construction_delay",
        "bridge_issue",
        "footpath_damage",
        "encroachment",
        "public_property_damage",
        "illegal_construction",
        "maintenance_issue",
        "signage_problem",
    ),
    "sanitation": (
        "garbage_collection",
        "garbage_overflow",
        "street_cleaning",
        "public_toilet_issue",
        "waste_dumping",
        "recycling_issue",
        "dead_animal",
        "foul_smell",
        "mosquito_breeding",
        "sewage_overflow",
    ),
    "transportation": (
        "traffic_congestion",
        "signal_not_working",
        "parking_issue",
        "illegal_parking",
        "accident_risk",
        "public_transport_issue",
        "bus_delay",
        "metro_issue",
        "road_block",
        "diversion_problem",
    ),
    "environment": (
        "air_pollution",
        "water_pollution",
        "noise_pollution",
        "illegal_dumping",
        "tree_cutting",
        "green_cover_loss",
        "industrial_pollution",
        "dust_issue",
        "burning_waste",
        "climate_issue",
    ),
    "public_safety": (
        "streetlight_not_working",
        "unsafe_area",
        "theft",
        "vandalism",
        "harassment",
        "fire_hazard",
        "broken_infrastructure",
        "open_manhole",
        "exposed_wires",
        "emergency_issue",
    ),
    "governance": (
        "corruption",
        "delay_in_service",
        "documentation_issue",
        "complaint_not_resolved",
        "staff_behavior",
        "mismanagement",
        "policy_issue",
        "verification_delay",
        "system_error",
        "general_admin",
    ),
    "health": (
        "hospital_issue",
        "ambulance_delay",
        "sanitation_hazard",
        "disease_outbreak",
        "water_quality_issue",
        "medical_staff_issue",
        "facility_shortage",
        "hygiene_issue",
        "waste_mismanagement",
        "public_health_risk",
    ),
    "education": (
        "school_infrastructure",
        "teacher_issue",
        "facility_problem",
        "safety_issue",
        "transport_issue",
        "fee_issue",
        "administration_problem",
        "exam_issue",
        "attendance_issue",
        "resource_shortage",
    ),
    "other": ("uncategorized",),
}
SUBCATEGORY_TO_MAIN_CATEGORY = {
    subcategory: main_category
    for main_category, subcategories in ALLOWED_SUBCATEGORIES.items()
    for subcategory in subcategories
}

ALLOWED_DEPARTMENTS = (
    "sewage_department",
    "water_department",
    "electricity_board",
    "road_authority",
    "municipal_corporation",
    "traffic_police",
    "pollution_control_board",
    "health_department",
    "education_department",
    "general_administration",
)

ALLOWED_URGENCY = ("low", "medium", "high", "critical")

SYSTEM_PROMPT = """
You are the primary complaint classification engine for CivicLens AI.

Return valid JSON only. Do not return markdown. Do not return explanations.

Use a two-stage classification:
1. main_category
2. subcategory

Allowed main_category values:
- utilities
- infrastructure
- sanitation
- transportation
- environment
- public_safety
- governance
- health
- education
- other

Allowed subcategory values:
utilities: sewage, water_supply, electricity, drainage, pipeline_leak, water_contamination, power_outage, transformer_issue, billing_issue, meter_problem
infrastructure: road_damage, potholes, construction_delay, bridge_issue, footpath_damage, encroachment, public_property_damage, illegal_construction, maintenance_issue, signage_problem
sanitation: garbage_collection, garbage_overflow, street_cleaning, public_toilet_issue, waste_dumping, recycling_issue, dead_animal, foul_smell, mosquito_breeding, sewage_overflow
transportation: traffic_congestion, signal_not_working, parking_issue, illegal_parking, accident_risk, public_transport_issue, bus_delay, metro_issue, road_block, diversion_problem
environment: air_pollution, water_pollution, noise_pollution, illegal_dumping, tree_cutting, green_cover_loss, industrial_pollution, dust_issue, burning_waste, climate_issue
public_safety: streetlight_not_working, unsafe_area, theft, vandalism, harassment, fire_hazard, broken_infrastructure, open_manhole, exposed_wires, emergency_issue
governance: corruption, delay_in_service, documentation_issue, complaint_not_resolved, staff_behavior, mismanagement, policy_issue, verification_delay, system_error, general_admin
health: hospital_issue, ambulance_delay, sanitation_hazard, disease_outbreak, water_quality_issue, medical_staff_issue, facility_shortage, hygiene_issue, waste_mismanagement, public_health_risk
education: school_infrastructure, teacher_issue, facility_problem, safety_issue, transport_issue, fee_issue, administration_problem, exam_issue, attendance_issue, resource_shortage
other: uncategorized

Return this exact JSON shape:
{
  "main_category": "...",
  "subcategory": "...",
  "department": "...",
  "urgency": "low | medium | high | critical",
  "confidence": 0.0,
  "summary": "..."
}

Urgency rules:
- critical: accidents, crashes, fires, injuries, electrocution, life-threatening issues, and active emergencies
- high: sewage overflow, flooding, severe drainage failure, major infrastructure failure, and major public hazards
- medium: garbage accumulation, sanitation issues, non-emergency service disruption, and standard civic issues needing prompt action
- low: minor inconveniences and low-impact non-urgent complaints
- Never downgrade a serious issue to a lower urgency.
- Be consistent and deterministic.

Department guidance:
- sewage and drainage issues should usually go to sewage_department
- electricity and streetlight issues should usually go to electricity_board
- road damage and potholes should usually go to road_authority
- garbage and sanitation issues should usually go to municipal_corporation
- traffic issues should usually go to traffic_police
- environment issues should usually go to pollution_control_board
- health issues should usually go to health_department
- education issues should usually go to education_department
- water supply, contamination, leaks, billing, and meter issues should usually go to water_department
- governance issues should usually go to general_administration

Strict rules:
- AI is the primary decision maker.
- Always choose the most specific subcategory.
- Never default to other unless the complaint is genuinely unclear.
- Do not use general_administration unless necessary.
- Confidence must be a number between 0.0 and 1.0.
""".strip()


def classifyComplaint(text: str) -> dict[str, Any]:
    normalized_text = " ".join((text or "").split())

    if not normalized_text:
        raise ValueError("Complaint text is required.")

    print("AI FUNCTION CALLED")

    if not settings.AI_API_KEY:
        print("[AI ANALYSIS SERVICE] AI API key is not configured. Using fallback.")
        final_result = _fallback_classification(normalized_text)
        print("FINAL OUTPUT:", final_result)
        return final_result

    try:
        ai_response = _classify_with_ai(normalized_text)
        print("AI PARSED RESPONSE:", ai_response)
        print("AI CONFIDENCE:", ai_response.get("confidence"))
        final_result = {
            **_validate_ai_result(ai_response),
            "source": "ai",
        }
    except Exception as error:
        print("AI ERROR:", error)
        final_result = _fallback_classification(normalized_text)
        print("FINAL OUTPUT:", final_result)
        return final_result

    print("FINAL OUTPUT:", final_result)
    return final_result


def analyzeComplaint(text: str) -> dict[str, Any]:
    return classifyComplaint(text)


def testDeepSeekConnection() -> str:
    print("AI FUNCTION CALLED")

    if not settings.AI_API_KEY:
        error = RuntimeError("AI API key is not configured.")
        print("AI ERROR:", error)
        raise error

    request_payload = _build_request_payload(
        system_prompt="You are a classifier.",
        user_content="hello",
        max_tokens=64,
    )
    payload = _send_deepseek_request(request_payload)
    message_content = _extract_message_content(payload)

    if not message_content:
        error = ValueError("AI RETURNED EMPTY RESPONSE")
        print("AI ERROR:", error)
        raise error

    return message_content


def _get_deepseek_request_url() -> str:
    configured_url = (settings.AI_BASE_URL or "").strip().rstrip("/")

    if configured_url and configured_url != DEEPSEEK_CHAT_COMPLETIONS_URL:
        print(
            "[AI ANALYSIS SERVICE] Overriding configured AI_BASE_URL with DeepSeek chat completions endpoint."
        )

    return DEEPSEEK_CHAT_COMPLETIONS_URL


def _build_request_payload(
    *,
    system_prompt: str,
    user_content: str,
    max_tokens: int,
) -> dict[str, Any]:
    return {
        "model": DEEPSEEK_MODEL,
        "temperature": 0,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_content,
            },
        ],
    }


def _send_deepseek_request(request_payload: dict[str, Any]) -> dict[str, Any]:
    request_url = _get_deepseek_request_url()

    print("AI REQUEST SENT")
    print("AI REQUEST PAYLOAD:", json.dumps(request_payload, indent=2))

    try:
        response = httpx.post(
            request_url,
            headers={
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=request_payload,
            timeout=settings.AI_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as error:
        print("AI ERROR:", error)
        raise

    print("AI RAW RESPONSE:", json.dumps(payload, indent=2))
    return payload


def _classify_with_ai(text: str) -> dict[str, Any]:
    request_payload = _build_request_payload(
        system_prompt=SYSTEM_PROMPT,
        user_content=text,
        max_tokens=400,
    )
    payload = _send_deepseek_request(request_payload)
    message_content = _extract_message_content(payload)
    return _parse_message_json(message_content)


def _extract_message_content(payload: dict[str, Any]) -> str:
    choices = payload.get("choices") or []

    if not choices:
        error = ValueError("No choices returned by the model.")
        print("AI ERROR:", error)
        raise error

    message = choices[0].get("message") or {}
    content = message.get("content")

    if isinstance(content, str) and content.strip():
        return content.strip()

    print("AI RETURNED EMPTY RESPONSE")
    raise ValueError("AI RETURNED EMPTY RESPONSE")


def _parse_message_json(message_content: str) -> dict[str, Any]:
    normalized_content = message_content.strip()

    if normalized_content.startswith("```"):
        normalized_content = normalized_content.split("\n", 1)[-1]

        if normalized_content.endswith("```"):
            normalized_content = normalized_content[:-3]

        normalized_content = normalized_content.strip()

    if not normalized_content.startswith("{"):
        json_start = normalized_content.find("{")
        json_end = normalized_content.rfind("}")

        if json_start == -1 or json_end == -1 or json_end < json_start:
            error = ValueError("AI response did not contain a JSON object.")
            print("AI ERROR:", error)
            raise error

        normalized_content = normalized_content[json_start : json_end + 1]

    try:
        return json.loads(normalized_content)
    except json.JSONDecodeError as error:
        print("AI ERROR:", error)
        raise


def _validate_ai_result(raw_result: dict[str, Any]) -> dict[str, Any]:
    main_category = str(
        raw_result.get("main_category") or raw_result.get("category") or ""
    ).strip().lower()
    subcategory = str(raw_result.get("subcategory") or "").strip().lower()
    department = str(raw_result.get("department") or "").strip().lower()
    urgency = str(raw_result.get("urgency") or "").strip().lower()
    summary = str(raw_result.get("summary") or raw_result.get("ai_summary") or "").strip()

    expected_main_category = SUBCATEGORY_TO_MAIN_CATEGORY.get(subcategory)

    if main_category not in ALLOWED_MAIN_CATEGORIES:
        raise ValueError(f"Invalid main_category: {main_category}")

    if expected_main_category and main_category != expected_main_category:
        print(
            "[AI ANALYSIS SERVICE] Normalizing main_category from subcategory:",
            {"from": main_category, "to": expected_main_category, "subcategory": subcategory},
        )
        main_category = expected_main_category

    if subcategory not in ALLOWED_SUBCATEGORIES[main_category]:
        raise ValueError(f"Invalid subcategory for {main_category}: {subcategory}")

    if department not in ALLOWED_DEPARTMENTS:
        raise ValueError(f"Invalid department: {department}")

    if urgency not in ALLOWED_URGENCY:
        raise ValueError(f"Invalid urgency: {urgency}")

    confidence = _parse_confidence(raw_result.get("confidence"))

    if not summary:
        raise ValueError("Missing summary.")

    return {
        "main_category": main_category,
        "category": main_category,
        "subcategory": subcategory,
        "department": department,
        "urgency": urgency,
        "confidence": confidence,
        "summary": summary,
        "ai_summary": summary,
    }


def _parse_confidence(value: Any) -> float:
    confidence = float(value)

    if confidence < 0 or confidence > 1:
        raise ValueError(f"Invalid confidence: {confidence}")

    return confidence


def _fallback_classification(text: str) -> dict[str, Any]:
    lowered_text = text.lower()

    def fallback_urgency(default_urgency: str) -> str:
        critical_keywords = (
            "accident",
            "crash",
            "collision",
            "injury",
            "injured",
            "bleeding",
            "fire",
            "smoke",
            "electrocution",
            "life threatening",
            "life-threatening",
            "emergency",
        )
        high_keywords = (
            "sewage overflow",
            "overflowing drain",
            "overflowing sewer",
            "flood",
            "flooding",
            "waterlogging",
            "major collapse",
            "bridge collapse",
            "building collapse",
            "major infrastructure failure",
        )
        medium_keywords = (
            "garbage",
            "trash",
            "waste",
            "sanitation",
            "dirty",
            "unclean",
        )

        if any(keyword in lowered_text for keyword in critical_keywords):
            return "critical"

        if any(keyword in lowered_text for keyword in high_keywords):
            return "high"

        if any(keyword in lowered_text for keyword in medium_keywords):
            return "medium"

        return default_urgency

    fallback_rules = (
        (
            ("accident", "crash", "collision"),
            {
                "main_category": "transportation",
                "category": "transportation",
                "subcategory": "accident_risk",
                "department": "traffic_police",
                "urgency": "critical",
                "summary": "Complaint routed as a transportation emergency based on fallback keywords.",
            },
        ),
        (
            ("fire", "smoke", "injury", "injured", "electrocution", "emergency"),
            {
                "main_category": "public_safety",
                "category": "public_safety",
                "subcategory": "emergency_issue",
                "department": "general_administration",
                "urgency": "critical",
                "summary": "Complaint routed as a public safety emergency based on fallback keywords.",
            },
        ),
        (
            ("sewage", "sewer", "dirty water", "manhole", "septic", "overflowing drain"),
            {
                "main_category": "utilities",
                "category": "utilities",
                "subcategory": "sewage",
                "department": "sewage_department",
                "urgency": fallback_urgency("high"),
                "summary": "Complaint routed as a sewage utility issue based on fallback keywords.",
            },
        ),
        (
            ("drain", "drainage", "waterlogging", "blocked drain"),
            {
                "main_category": "utilities",
                "category": "utilities",
                "subcategory": "drainage",
                "department": "sewage_department",
                "urgency": fallback_urgency("medium"),
                "summary": "Complaint routed as a drainage utility issue based on fallback keywords.",
            },
        ),
        (
            ("streetlight", "street light", "light not working", "lamp post"),
            {
                "main_category": "public_safety",
                "category": "public_safety",
                "subcategory": "streetlight_not_working",
                "department": "electricity_board",
                "urgency": fallback_urgency("medium"),
                "summary": "Complaint routed as a streetlight public safety issue based on fallback keywords.",
            },
        ),
        (
            ("garbage", "waste", "trash", "dumping"),
            {
                "main_category": "sanitation",
                "category": "sanitation",
                "subcategory": "waste_dumping" if "dump" in lowered_text else "garbage_overflow",
                "department": "municipal_corporation",
                "urgency": fallback_urgency("medium"),
                "summary": "Complaint routed as a sanitation issue based on fallback keywords.",
            },
        ),
        (
            ("pothole", "road damage", "road", "footpath"),
            {
                "main_category": "infrastructure",
                "category": "infrastructure",
                "subcategory": "potholes" if "pothole" in lowered_text else "road_damage",
                "department": "road_authority",
                "urgency": fallback_urgency("medium"),
                "summary": "Complaint routed as an infrastructure issue based on fallback keywords.",
            },
        ),
    )

    for keywords, result in fallback_rules:
        if any(keyword in lowered_text for keyword in keywords):
            return {
                **result,
                "confidence": 0.0,
                "source": "fallback",
                "ai_summary": result["summary"],
            }

    return {
        "main_category": "other",
        "category": "other",
        "subcategory": "uncategorized",
        "department": "general_administration",
        "urgency": "low",
        "confidence": 0.0,
        "summary": "Complaint remained uncategorized after fallback classification.",
        "ai_summary": "Complaint remained uncategorized after fallback classification.",
        "source": "fallback",
    }

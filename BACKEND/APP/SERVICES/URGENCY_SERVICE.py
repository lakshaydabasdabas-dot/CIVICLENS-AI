"""
URGENCY SERVICE

This service predicts how urgent a complaint is.
It uses a rule-based approach for the MVP so the system
works immediately without ML training.
"""


def predict_urgency(text: str) -> str:
    """
    Predict urgency level from complaint text.
    Returns one of: LOW, MEDIUM, HIGH, CRITICAL
    """

    text = text.lower()

    critical_keywords = [
        "fire",
        "electric shock",
        "collapse",
        "explosion",
        "injury",
        "gas leak",
        "emergency"
    ]

    high_keywords = [
        "power outage",
        "water leakage",
        "broken",
        "unsafe",
        "danger",
        "flood",
        "severe"
    ]

    medium_keywords = [
        "not working",
        "issue",
        "problem",
        "repair",
        "maintenance"
    ]

    for word in critical_keywords:
        if word in text:
            return "CRITICAL"

    for word in high_keywords:
        if word in text:
            return "HIGH"

    for word in medium_keywords:
        if word in text:
            return "MEDIUM"

    return "LOW"
"""
ROUTER SERVICE

This service maps a complaint to the most likely department.
It uses the predicted category first, and falls back to simple
text-based checks where needed.
"""


def predict_department(category: str, text: str) -> str:
    """
    Predict the responsible department for a complaint.
    """

    category = (category or "").upper()
    text = (text or "").lower()

    category_to_department = {
        "WATER": "WATER_SERVICES",
        "ELECTRICITY": "ELECTRICAL_MAINTENANCE",
        "SANITATION": "SANITATION_TEAM",
        "SAFETY": "CAMPUS_SAFETY",
        "HOSTEL": "HOSTEL_ADMINISTRATION",
        "ACADEMIC": "ACADEMIC_OFFICE",
        "INFRASTRUCTURE": "INFRASTRUCTURE_MAINTENANCE",
        "IT": "IT_SUPPORT",
        "OTHER": "GENERAL_ADMINISTRATION"
    }

    if category in category_to_department:
        return category_to_department[category]

    if "wifi" in text or "internet" in text or "portal" in text:
        return "IT_SUPPORT"

    if "hostel" in text or "warden" in text or "mess" in text:
        return "HOSTEL_ADMINISTRATION"

    if "classroom" in text or "lab" in text or "faculty" in text:
        return "ACADEMIC_OFFICE"

    return "GENERAL_ADMINISTRATION"
"""
SUMMARIZATION SERVICE

Creates a short structured summary for complaints.
"""

from __future__ import annotations

from typing import Optional


def build_complaint_summary(
    *,
    title: str,
    description: str,
    location: Optional[str],
    category: Optional[str],
    urgency: Optional[str],
    department: Optional[str],
) -> str:
    title = (title or "").strip()
    description = (description or "").strip()
    location = (location or "Location not provided").strip()
    category = (category or "OTHER").replace("_", " ").title()
    urgency = (urgency or "UNASSIGNED").title()
    department = (department or "General Civic Administration").strip()

    short_desc = description[:180].strip()
    if len(description) > 180:
        short_desc += "..."

    return (
        f"A {urgency.lower()} priority {category.lower()} complaint has been reported"
        f" at {location}. Title: {title}. Summary: {short_desc} "
        f"Recommended routing: {department}."
    )
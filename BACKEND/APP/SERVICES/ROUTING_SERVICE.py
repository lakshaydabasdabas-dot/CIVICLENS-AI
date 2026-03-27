"""
ROUTING SERVICE

Maps complaint category to responsible civic department.
"""

from __future__ import annotations

from typing import Optional


CATEGORY_TO_DEPARTMENT = {
    "WATER_SUPPLY": "Water Department",
    "SEWAGE": "Sewerage Department",
    "DRAINAGE": "Drainage Department",
    "ROADS": "Public Works Department",
    "STREETLIGHTS": "Electrical Department",
    "WASTE_MANAGEMENT": "Sanitation Department",
    "SANITATION": "Sanitation Department",
    "ENCROACHMENT": "Enforcement Department",
    "PARKS_PUBLIC_SPACES": "Horticulture Department",
    "ANIMAL_CONTROL": "Veterinary / Animal Control Department",
    "PUBLIC_SAFETY": "Emergency / Public Safety Department",
    "OTHER": "General Civic Administration",
}


def route_department(category: Optional[str]) -> str:
    category = (category or "OTHER").upper().strip()
    return CATEGORY_TO_DEPARTMENT.get(category, "General Civic Administration")
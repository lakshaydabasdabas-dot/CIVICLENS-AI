from __future__ import annotations

from typing import Optional


CATEGORY_TO_DEPARTMENT = {
    "ELECTRICAL": "Electrical Department",
    "STREETLIGHTS": "Electrical Department",
    "WATER_SUPPLY": "Water Department",
    "SEWAGE": "Sewerage Department",
    "DRAINAGE": "Drainage Department",
    "ROADS": "Public Works Department",
    "WASTE_MANAGEMENT": "Sanitation Department",
    "SANITATION": "Sanitation Department",
    "ENCROACHMENT": "Enforcement Department",
    "PARKS_PUBLIC_SPACES": "Horticulture Department",
    "ANIMAL_CONTROL": "Veterinary / Animal Control Department",
    "PUBLIC_SAFETY": "Emergency / Public Safety Department",
    "OTHER": "General Civic Administration",
}


DEPARTMENT_TO_AGENCY = {
    "Electrical Department": "NDPL / Electrical Utility",
    "Water Department": "Delhi Jal Board",
    "Sewerage Department": "Delhi Jal Board",
    "Drainage Department": "MCD / Drainage Wing",
    "Public Works Department": "PWD / MCD",
    "Sanitation Department": "MCD",
    "Enforcement Department": "MCD Enforcement Wing",
    "Horticulture Department": "MCD Horticulture Wing",
    "Veterinary / Animal Control Department": "MCD Veterinary Services",
    "Emergency / Public Safety Department": "Emergency / Civic Safety Control",
    "General Civic Administration": "MCD General Administration",
}


def route_department(category: Optional[str]) -> str:
    normalized = str(category or "OTHER").upper().strip()
    return CATEGORY_TO_DEPARTMENT.get(normalized, "General Civic Administration")


def route_agency_from_department(department: Optional[str]) -> str:
    normalized = str(department or "General Civic Administration").strip()
    return DEPARTMENT_TO_AGENCY.get(normalized, "MCD General Administration")
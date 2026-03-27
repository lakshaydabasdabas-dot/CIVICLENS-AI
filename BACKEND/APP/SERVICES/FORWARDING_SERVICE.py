from __future__ import annotations

from typing import Any, Dict


def build_forwarding_note(complaint: Dict[str, Any]) -> str:
    return (
        f"Forwarding Complaint #{complaint.get('id', 'N/A')}\n\n"
        f"Title: {complaint.get('title', 'N/A')}\n"
        f"Description: {complaint.get('description', 'N/A')}\n"
        f"Location: {complaint.get('location', 'N/A')}\n"
        f"Locality: {complaint.get('locality', 'UNKNOWN')}\n"
        f"Region: {complaint.get('region', 'UNCLASSIFIED')}\n"
        f"Category: {complaint.get('category', 'UNASSIGNED')}\n"
        f"Urgency: {complaint.get('urgency', 'UNASSIGNED')}\n"
        f"Priority Score: {complaint.get('priority_score', 'N/A')}\n"
        f"Department: {complaint.get('department', 'UNASSIGNED')}\n"
        f"AI Summary: {complaint.get('ai_summary', 'N/A')}\n"
    )


def build_authority_payload(complaint: Dict[str, Any]) -> Dict[str, Any]:
    department = complaint.get("department", "General Civic Administration")

    authority_map = {
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

    authority = authority_map.get(department, "MCD General Administration")

    return {
        "target_authority": authority,
        "department": department,
        "forwarding_note": build_forwarding_note(complaint),
    }
"""
DASHBOARD API ROUTES
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint
from APP.SERVICES.PRIORITY_SERVICE import priority_band

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_complaints = db.query(func.count(Complaint.id)).scalar() or 0
    new_complaints = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.status == "NEW")
        .scalar()
        or 0
    )
    in_progress_complaints = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.status == "IN_PROGRESS")
        .scalar()
        or 0
    )
    resolved_complaints = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.status == "RESOLVED")
        .scalar()
        or 0
    )

    duplicates_detected = (
        db.query(func.count(Complaint.id))
        .filter(Complaint.duplicate_of.isnot(None))
        .scalar()
        or 0
    )

    complaints_by_category = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )

    complaints_by_urgency = (
        db.query(Complaint.urgency, func.count(Complaint.id))
        .group_by(Complaint.urgency)
        .all()
    )

    complaints_by_department = (
        db.query(Complaint.department, func.count(Complaint.id))
        .group_by(Complaint.department)
        .all()
    )

    complaints_by_region = (
        db.query(Complaint.region, func.count(Complaint.id))
        .group_by(Complaint.region)
        .all()
    )

    complaints_by_locality = (
        db.query(Complaint.locality, func.count(Complaint.id))
        .group_by(Complaint.locality)
        .order_by(func.count(Complaint.id).desc())
        .limit(10)
        .all()
    )

    priority_rows = db.query(Complaint.priority_score).all()
    priority_summary = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNASSIGNED": 0}
    for (score,) in priority_rows:
        band = priority_band(score)
        priority_summary[band] = priority_summary.get(band, 0) + 1

    return {
        "total_complaints": total_complaints,
        "new_complaints": new_complaints,
        "in_progress_complaints": in_progress_complaints,
        "resolved_complaints": resolved_complaints,
        "duplicates_detected": duplicates_detected,
        "complaints_by_category": [
            {"category": category if category else "UNASSIGNED", "count": count}
            for category, count in complaints_by_category
        ],
        "complaints_by_urgency": [
            {"urgency": urgency if urgency else "UNASSIGNED", "count": count}
            for urgency, count in complaints_by_urgency
        ],
        "complaints_by_department": [
            {"department": department if department else "UNASSIGNED", "count": count}
            for department, count in complaints_by_department
        ],
        "complaints_by_region": [
            {"region": region if region else "UNCLASSIFIED", "count": count}
            for region, count in complaints_by_region
        ],
        "complaints_by_locality": [
            {"locality": locality if locality else "UNKNOWN", "count": count}
            for locality, count in complaints_by_locality
        ],
        "complaints_by_priority_band": [
            {"band": key, "count": value}
            for key, value in priority_summary.items()
        ],
    }
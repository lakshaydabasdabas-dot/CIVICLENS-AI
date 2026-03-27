"""
DASHBOARD API ROUTES

This file provides dashboard statistics for CivicLens AI.
It is designed to remain useful as the project grows, so the
basic counters and grouped summaries are already included.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Return high-level dashboard statistics.
    """

    total_complaints = db.query(func.count(Complaint.id)).scalar() or 0
    new_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "NEW").scalar() or 0
    in_progress_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "IN_PROGRESS").scalar() or 0
    resolved_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "RESOLVED").scalar() or 0

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

    return {
        "total_complaints": total_complaints,
        "new_complaints": new_complaints,
        "in_progress_complaints": in_progress_complaints,
        "resolved_complaints": resolved_complaints,
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
        ]
    }
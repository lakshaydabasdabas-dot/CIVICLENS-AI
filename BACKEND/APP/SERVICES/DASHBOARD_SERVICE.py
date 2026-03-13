"""
DASHBOARD SERVICE

This service contains reusable dashboard aggregation helpers.
It is optional for the MVP but useful for future cleanup.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func

from APP.MODELS.COMPLAINT import Complaint


def get_dashboard_summary(db: Session) -> dict:
    total_complaints = db.query(func.count(Complaint.id)).scalar() or 0
    new_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "NEW").scalar() or 0
    in_progress_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "IN_PROGRESS").scalar() or 0
    resolved_complaints = db.query(func.count(Complaint.id)).filter(Complaint.status == "RESOLVED").scalar() or 0

    return {
        "total_complaints": total_complaints,
        "new_complaints": new_complaints,
        "in_progress_complaints": in_progress_complaints,
        "resolved_complaints": resolved_complaints
    }
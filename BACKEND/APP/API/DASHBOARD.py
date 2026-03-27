from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint

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

    return {
        "total_complaints": total_complaints,
        "new_complaints": new_complaints,
        "in_progress_complaints": in_progress_complaints,
        "resolved_complaints": resolved_complaints,
        "duplicates_detected": duplicates_detected,
    }
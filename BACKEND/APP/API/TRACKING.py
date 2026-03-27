from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint
from APP.SCHEMAS.COMPLAINT_SCHEMA import ComplaintResponse
from APP.SERVICES.PRIORITY_SERVICE import priority_band

router = APIRouter()


@router.get("/user", response_model=List[ComplaintResponse])
def get_complaints_by_username(
    username: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    normalized_username = username.strip()

    complaints = (
        db.query(Complaint)
        .filter(Complaint.submitted_by == normalized_username)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    return complaints


@router.get("/summary")
def get_tracking_summary(
    username: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    normalized_username = username.strip()

    complaints = (
        db.query(Complaint)
        .filter(Complaint.submitted_by == normalized_username)
        .order_by(Complaint.created_at.desc())
        .all()
    )

    if not complaints:
      raise HTTPException(status_code=404, detail="No complaints found for this username.")

    highest_priority_complaint = max(
        complaints,
        key=lambda complaint: complaint.priority_score if complaint.priority_score is not None else -1,
    )

    ranked_queue = sorted(
        complaints,
        key=lambda complaint: (
            -(complaint.priority_score or 0),
            complaint.created_at,
        ),
    )

    queue_positions = {
        complaint.id: index + 1
        for index, complaint in enumerate(ranked_queue)
    }

    return {
        "username": normalized_username,
        "total_complaints": len(complaints),
        "open_complaints": len(
            [complaint for complaint in complaints if complaint.status != "RESOLVED"]
        ),
        "resolved_complaints": len(
            [complaint for complaint in complaints if complaint.status == "RESOLVED"]
        ),
        "highest_priority_complaint": {
            "id": highest_priority_complaint.id,
            "title": highest_priority_complaint.title,
            "priority_score": highest_priority_complaint.priority_score,
            "priority_band": priority_band(highest_priority_complaint.priority_score),
            "status": highest_priority_complaint.status,
            "department": highest_priority_complaint.department,
        },
        "queue_positions": queue_positions,
    }
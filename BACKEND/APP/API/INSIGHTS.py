from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint
from APP.SERVICES.INSIGHT_SERVICE import build_admin_insights

router = APIRouter()


@router.get("/admin-summary")
def get_admin_summary(db: Session = Depends(get_db)):
    complaints = db.query(Complaint).all()

    complaint_dicts = [
        {
            "id": complaint.id,
            "title": complaint.title,
            "description": complaint.description,
            "location": complaint.location,
            "locality": complaint.locality,
            "region": complaint.region,
            "category": complaint.category,
            "urgency": complaint.urgency,
            "priority_score": complaint.priority_score,
            "department": complaint.department,
            "status": complaint.status,
        }
        for complaint in complaints
    ]

    return build_admin_insights(complaint_dicts)
"""
COMPLAINT API ROUTES

This file handles complaint creation, retrieval, and status updates.
Complaint creation automatically runs the AI analysis pipeline
before storing the complaint in the database.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from APP.CORE.DATABASE import get_db
from APP.MODELS.COMPLAINT import Complaint
from APP.SCHEMAS.COMPLAINT_SCHEMA import ComplaintCreate, ComplaintResponse

from APP.SERVICES.PREPROCESS_SERVICE import clean_text
from APP.SERVICES.CLASSIFIER_SERVICE import predict_category
from APP.SERVICES.URGENCY_SERVICE import predict_urgency
from APP.SERVICES.ROUTER_SERVICE import predict_department
from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate

router = APIRouter()


class ComplaintStatusUpdate(BaseModel):
    status: str


@router.post("/", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a new complaint entry and automatically run
    the AI analysis pipeline before saving.
    """
    combined_text = f"{payload.title} {payload.description}".strip()
    cleaned_text = clean_text(combined_text)

    category = predict_category(cleaned_text)
    urgency = predict_urgency(cleaned_text)
    department = predict_department(category, cleaned_text)
    duplicate_result = find_possible_duplicate(cleaned_text)

    ai_summary = (
        f"Complaint categorized as {category}, marked {urgency} urgency, "
        f"and routed to {department}."
    )

    new_complaint = Complaint(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        submitted_by=payload.submitted_by,
        category=category,
        urgency=urgency,
        department=department,
        ai_summary=ai_summary,
        duplicate_of=duplicate_result["duplicate_of"],
        similarity_score=duplicate_result["similarity_score"],
        status="NEW"
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


@router.get("/", response_model=List[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    """
    Return all complaints ordered by newest first.
    """
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_by_id(complaint_id: int, db: Session = Depends(get_db)):
    """
    Return a single complaint by ID.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return complaint


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update complaint status.
    Allowed demo statuses: NEW, IN_PROGRESS, RESOLVED
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    allowed_statuses = {"NEW", "IN_PROGRESS", "RESOLVED"}
    new_status = payload.status.strip().upper()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Allowed values: NEW, IN_PROGRESS, RESOLVED"
        )

    complaint.status = new_status
    db.commit()
    db.refresh(complaint)

    return complaint
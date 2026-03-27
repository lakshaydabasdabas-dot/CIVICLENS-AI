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

from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate
from APP.SERVICES.EMAIL_SERVICE import send_complaint_status_email
from APP.SERVICES.OTP_SERVICE import consume_email_verification, is_email_verified
from APP.SERVICES.OPENAI_ANALYSIS_SERVICE import classifyComplaint
from APP.SERVICES.PREPROCESS_SERVICE import clean_text

router = APIRouter()


class ComplaintStatusUpdate(BaseModel):
    status: str


def attach_classification_metadata(complaint: Complaint, analysis: dict | None = None) -> Complaint:
    complaint.subcategory = analysis["subcategory"] if analysis else None
    complaint.confidence = analysis["confidence"] if analysis else None
    complaint.source = analysis["source"] if analysis else None
    return complaint

@router.post("/", response_model=ComplaintResponse)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Create a new complaint entry and automatically run
    the AI analysis pipeline before saving.
    """
    if not is_email_verified(payload.email):
        raise HTTPException(status_code=400, detail="Verify your email before submitting the complaint.")

    combined_text = f"{payload.title} {payload.description}".strip()
    cleaned_text = clean_text(combined_text)
    analysis_input = (
        f"Title: {payload.title}\n"
        f"Description: {payload.description}\n"
        f"Location: {payload.location or 'Not provided'}"
    )

    analysis = classifyComplaint(analysis_input)
    duplicate_result = find_possible_duplicate(cleaned_text)

    new_complaint = Complaint(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        submitted_by=payload.submitted_by or payload.email,
        email=payload.email,
        category=analysis["category"],
        urgency=analysis["urgency"],
        department=analysis["department"],
        ai_summary=analysis["summary"],
        duplicate_of=duplicate_result["duplicate_of"],
        similarity_score=duplicate_result["similarity_score"],
        status="NEW"
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    consume_email_verification(payload.email)

    return attach_classification_metadata(new_complaint, analysis)


@router.get("/", response_model=List[ComplaintResponse])
def get_all_complaints(db: Session = Depends(get_db)):
    """
    Return all complaints ordered by newest first.
    """
    complaints = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    return [attach_classification_metadata(complaint) for complaint in complaints]


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint_by_id(complaint_id: int, db: Session = Depends(get_db)):
    """
    Return a single complaint by ID.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    return attach_classification_metadata(complaint)


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
    send_complaint_status_email(complaint.email or "", new_status)

    return attach_classification_metadata(complaint)

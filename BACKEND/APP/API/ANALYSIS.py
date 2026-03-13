"""
ANALYSIS API ROUTES

This file handles AI-style complaint analysis for CivicLens AI.
Right now it uses a stable placeholder pipeline so the backend
works immediately. Later, the internal service logic can become
more advanced without changing this API file.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from APP.SERVICES.PREPROCESS_SERVICE import clean_text
from APP.SERVICES.URGENCY_SERVICE import predict_urgency
from APP.SERVICES.ROUTER_SERVICE import predict_department
from APP.SERVICES.CLASSIFIER_SERVICE import predict_category
from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate

router = APIRouter()


class AnalysisRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None


@router.post("/")
def analyze_complaint(payload: AnalysisRequest):
    """
    Analyze a complaint and return category, urgency,
    department, summary, and duplicate hint.
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

    return {
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "cleaned_text": cleaned_text,
        "category": category,
        "urgency": urgency,
        "department": department,
        "ai_summary": ai_summary,
        "duplicate_of": duplicate_result["duplicate_of"],
        "similarity_score": duplicate_result["similarity_score"]
    }
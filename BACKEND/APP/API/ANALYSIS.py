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

from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate
from APP.SERVICES.OPENAI_ANALYSIS_SERVICE import analyzeComplaint
from APP.SERVICES.PREPROCESS_SERVICE import clean_text

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
    analysis_input = (
        f"Title: {payload.title}\n"
        f"Description: {payload.description}\n"
        f"Location: {payload.location or 'Not provided'}"
    )
    analysis = analyzeComplaint(analysis_input)
    duplicate_result = find_possible_duplicate(cleaned_text)

    return {
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "cleaned_text": cleaned_text,
        "category": analysis["category"],
        "urgency": analysis["urgency"],
        "department": analysis["department"],
        "ai_summary": analysis["ai_summary"],
        "duplicate_of": duplicate_result["duplicate_of"],
        "similarity_score": duplicate_result["similarity_score"]
    }

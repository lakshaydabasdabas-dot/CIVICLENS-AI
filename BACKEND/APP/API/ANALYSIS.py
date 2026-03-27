from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from APP.CORE.DATABASE import get_db
from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate
from APP.SERVICES.LOCATION_INTELLIGENCE_SERVICE import build_location_intelligence
from APP.SERVICES.OPENAI_ANALYSIS_SERVICE import analyzeComplaint
from APP.SERVICES.PRIORITY_SERVICE import compute_priority_score, priority_band

router = APIRouter()


class AnalysisRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.post("/")
def analyze_complaint(payload: AnalysisRequest, db: Session = Depends(get_db)):
    analysis_input = (
        f"Title: {payload.title}\n"
        f"Description: {payload.description}\n"
        f"Location: {payload.location or 'Not provided'}"
    )

    analysis = analyzeComplaint(analysis_input)
    location_intelligence = build_location_intelligence(payload.location)

    duplicate_result = find_possible_duplicate(
        db,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        category=analysis["category"],
    )

    score = compute_priority_score(
        urgency=analysis["urgency"],
        category=analysis["category"],
        similarity_score=duplicate_result["similarity_score"],
    )

    return {
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "lat": payload.lat,
        "lng": payload.lng,
        "category": analysis["category"],
        "urgency": analysis["urgency"],
        "priority_score": score,
        "priority_band": priority_band(score),
        "department": analysis["department"],
        "target_agency": analysis.get("target_agency"),
        "ai_summary": analysis["ai_summary"],
        "model_confidence": analysis.get("model_confidence", 0.75),
        "location_intelligence": location_intelligence,
        "duplicate_of": duplicate_result["duplicate_of"],
        "duplicate_cluster_id": duplicate_result["duplicate_cluster_id"],
        "similarity_score": duplicate_result["similarity_score"],
        "top_similar_cases": duplicate_result["top_similar_cases"],
    }
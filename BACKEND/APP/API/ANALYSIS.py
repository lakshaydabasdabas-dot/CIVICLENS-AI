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
from APP.SERVICES.OPENAI_ANALYSIS_SERVICE import classifyComplaint, testDeepSeekConnection
from APP.SERVICES.PREPROCESS_SERVICE import clean_text

router = APIRouter()


class AnalysisRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None


class BatchAnalysisRequest(BaseModel):
    complaints: list[AnalysisRequest]


def build_analysis_output(payload: AnalysisRequest) -> dict:
    combined_text = f"{payload.title} {payload.description}".strip()
    cleaned_text = clean_text(combined_text)
    analysis_input = (
        f"Title: {payload.title}\n"
        f"Description: {payload.description}\n"
        f"Location: {payload.location or 'Not provided'}"
    )
    analysis = classifyComplaint(analysis_input)
    duplicate_result = find_possible_duplicate(cleaned_text)

    return {
        "title": payload.title,
        "description": payload.description,
        "location": payload.location,
        "cleaned_text": cleaned_text,
        "main_category": analysis["main_category"],
        "category": analysis["category"],
        "subcategory": analysis["subcategory"],
        "urgency": analysis["urgency"],
        "department": analysis["department"],
        "confidence": analysis["confidence"],
        "summary": analysis["summary"],
        "ai_summary": analysis["summary"],
        "source": analysis["source"],
        "duplicate_of": duplicate_result["duplicate_of"],
        "similarity_score": duplicate_result["similarity_score"],
    }


@router.post("/")
def analyze_complaint(payload: AnalysisRequest):
    """
    Analyze a complaint and return category, urgency,
    department, summary, and duplicate hint.
    """
    return build_analysis_output(payload)


@router.post("/batch")
def analyze_multiple_complaints(payload: BatchAnalysisRequest):
    """
    Analyze multiple complaints using the DeepSeek-backed classifier.
    """
    return {
        "count": len(payload.complaints),
        "results": [build_analysis_output(complaint) for complaint in payload.complaints],
    }


@router.get("/test-deepseek")
def test_deepseek():
    """
    Send a minimal DeepSeek test message and return the raw text response.
    """
    return {
        "provider": "deepseek",
        "model": "deepseek-chat",
        "response": testDeepSeekConnection(),
    }

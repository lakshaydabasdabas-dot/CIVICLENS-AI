"""
COMPLAINT SCHEMAS

This file defines the request and response data structures
used by the CivicLens AI API for complaint operations.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ComplaintCreate(BaseModel):
    """
    Schema used when a user submits a new complaint.
    """

    title: str
    description: str
    location: Optional[str] = None
    submitted_by: Optional[str] = None


class ComplaintAIResult(BaseModel):
    """
    Schema used to represent AI analysis output.
    """

    category: Optional[str] = None
    urgency: Optional[str] = None
    department: Optional[str] = None
    ai_summary: Optional[str] = None
    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None


class ComplaintResponse(BaseModel):
    """
    Schema returned when the API sends complaint data.
    """

    id: int
    title: str
    description: str
    location: Optional[str] = None

    category: Optional[str] = None
    urgency: Optional[str] = None
    department: Optional[str] = None

    ai_summary: Optional[str] = None

    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None

    status: str
    submitted_by: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
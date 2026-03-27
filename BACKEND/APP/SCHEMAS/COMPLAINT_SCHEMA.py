"""
COMPLAINT SCHEMAS

This file defines the request and response data structures
used by the CivicLens AI API for complaint operations.
"""

import re
from pydantic import BaseModel, field_validator
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
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized_value = value.strip().lower()

        if not normalized_value:
            raise ValueError("Email address is required")

        if not re.fullmatch(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", normalized_value):
            raise ValueError("Enter a valid email address")

        return normalized_value


class ComplaintAIResult(BaseModel):
    """
    Schema used to represent AI analysis output.
    """

    category: Optional[str] = None
    subcategory: Optional[str] = None
    urgency: Optional[str] = None
    department: Optional[str] = None
    ai_summary: Optional[str] = None
    confidence: Optional[float] = None
    source: Optional[str] = None
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
    subcategory: Optional[str] = None
    urgency: Optional[str] = None
    department: Optional[str] = None

    ai_summary: Optional[str] = None
    confidence: Optional[float] = None
    source: Optional[str] = None

    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None

    status: str
    submitted_by: Optional[str] = None
    email: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

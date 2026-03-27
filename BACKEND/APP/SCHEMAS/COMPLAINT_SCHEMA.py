"""
COMPLAINT SCHEMAS
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ComplaintCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    submitted_by: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    location: Optional[str] = None

    formatted_address: Optional[str] = None
    normalized_location: Optional[str] = None
    locality: Optional[str] = None
    sub_locality: Optional[str] = None
    district: Optional[str] = None
    region: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None

    lat: Optional[float] = None
    lng: Optional[float] = None

    category: Optional[str] = None
    urgency: Optional[str] = None
    priority_score: Optional[float] = None
    department: Optional[str] = None
    ai_summary: Optional[str] = None
    model_confidence: Optional[float] = None

    duplicate_of: Optional[int] = None
    duplicate_cluster_id: Optional[str] = None
    similarity_score: Optional[float] = None

    status: str
    submitted_by: Optional[str] = None

    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
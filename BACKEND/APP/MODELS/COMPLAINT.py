"""
COMPLAINT DATABASE MODEL

This file defines the main complaint table for CivicLens AI.
"""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Float, DateTime

from APP.CORE.DATABASE import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)

    formatted_address = Column(String(255), nullable=True)
    normalized_location = Column(String(255), nullable=True)
    locality = Column(String(120), nullable=True)
    sub_locality = Column(String(120), nullable=True)
    district = Column(String(120), nullable=True)
    region = Column(String(120), nullable=True)
    ward = Column(String(120), nullable=True)
    zone = Column(String(120), nullable=True)

    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)

    category = Column(String(100), nullable=True)
    urgency = Column(String(50), nullable=True)
    priority_score = Column(Float, nullable=True)
    department = Column(String(100), nullable=True)
    ai_summary = Column(Text, nullable=True)
    model_confidence = Column(Float, nullable=True)

    duplicate_of = Column(Integer, nullable=True)
    duplicate_cluster_id = Column(String(100), nullable=True)
    similarity_score = Column(Float, nullable=True)

    status = Column(String(50), nullable=False, default="NEW")
    submitted_by = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
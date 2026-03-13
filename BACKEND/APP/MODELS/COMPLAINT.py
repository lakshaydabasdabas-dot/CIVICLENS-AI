"""
COMPLAINT DATABASE MODEL

This file defines the main complaint table for CivicLens AI.
It is designed to support complaint intake, AI classification,
urgency scoring, department routing, duplicate detection,
and status tracking.
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from datetime import datetime

from APP.CORE.DATABASE import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)

    category = Column(String(100), nullable=True)
    urgency = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)

    ai_summary = Column(Text, nullable=True)

    duplicate_of = Column(Integer, nullable=True)
    similarity_score = Column(Float, nullable=True)

    status = Column(String(50), nullable=False, default="NEW")
    submitted_by = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
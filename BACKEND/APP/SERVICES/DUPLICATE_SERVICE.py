"""
DUPLICATE DETECTION SERVICE

This service checks whether an incoming complaint is likely
a duplicate of an existing complaint.

Current version:
- queries existing complaints from the database
- compares title + description + location + category
- returns the best match if above threshold

Later upgrades can add:
- embeddings
- vector search
- duplicate clusters across all complaints
"""

from __future__ import annotations

from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from APP.MODELS.COMPLAINT import Complaint
from APP.SERVICES.SIMILARITY_SERVICE import compute_duplicate_score


DUPLICATE_THRESHOLD = 0.72
CANDIDATE_LIMIT = 50


def build_cluster_id(complaint_id: int) -> str:
    return f"cluster-{complaint_id}"


def find_possible_duplicate(
    db: Session,
    *,
    title: str,
    description: str,
    location: Optional[str] = None,
    category: Optional[str] = None,
) -> Dict[str, Any]:
    candidates: List[Complaint] = (
        db.query(Complaint)
        .order_by(Complaint.created_at.desc())
        .limit(CANDIDATE_LIMIT)
        .all()
    )

    best_match = None
    best_score = 0.0

    for candidate in candidates:
        score = compute_duplicate_score(
            title,
            description,
            location,
            category,
            candidate.title,
            candidate.description,
            candidate.location,
            candidate.category,
        )

        if score > best_score:
            best_score = score
            best_match = candidate

    if best_match and best_score >= DUPLICATE_THRESHOLD:
        cluster_id = best_match.duplicate_cluster_id or build_cluster_id(best_match.id)
        return {
            "duplicate_of": best_match.id,
            "similarity_score": round(best_score, 4),
            "duplicate_cluster_id": cluster_id,
            "top_similar_cases": [
                {
                    "id": best_match.id,
                    "title": best_match.title,
                    "location": best_match.location,
                    "similarity_score": round(best_score, 4),
                }
            ],
        }

    return {
        "duplicate_of": None,
        "similarity_score": round(best_score, 4),
        "duplicate_cluster_id": None,
        "top_similar_cases": [],
    }
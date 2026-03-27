from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from APP.MODELS.COMPLAINT import Complaint
from APP.SERVICES.SIMILARITY_SERVICE import compute_duplicate_score


DUPLICATE_THRESHOLD = 0.72
CANDIDATE_LIMIT = 100


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

    scored_candidates: List[Dict[str, Any]] = []

    for candidate in candidates:
        score = compute_duplicate_score(
            title_1=title,
            description_1=description,
            location_1=location,
            category_1=category,
            title_2=candidate.title,
            description_2=candidate.description,
            location_2=candidate.location,
            category_2=candidate.category,
        )

        scored_candidates.append(
            {
                "id": candidate.id,
                "title": candidate.title,
                "location": candidate.location,
                "category": candidate.category,
                "similarity_score": score,
                "duplicate_cluster_id": candidate.duplicate_cluster_id,
            }
        )

    scored_candidates.sort(key=lambda item: item["similarity_score"], reverse=True)
    top_similar_cases = scored_candidates[:5]

    if top_similar_cases and top_similar_cases[0]["similarity_score"] >= DUPLICATE_THRESHOLD:
        best_match = top_similar_cases[0]
        cluster_id = best_match["duplicate_cluster_id"] or build_cluster_id(best_match["id"])

        return {
            "duplicate_of": best_match["id"],
            "similarity_score": best_match["similarity_score"],
            "duplicate_cluster_id": cluster_id,
            "top_similar_cases": top_similar_cases,
        }

    return {
        "duplicate_of": None,
        "similarity_score": top_similar_cases[0]["similarity_score"] if top_similar_cases else 0.0,
        "duplicate_cluster_id": None,
        "top_similar_cases": top_similar_cases,
    }
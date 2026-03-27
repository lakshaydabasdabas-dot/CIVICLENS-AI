from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


def build_admin_insights(complaints: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not complaints:
        return {
            "summary": "No complaints available for insight generation.",
            "top_localities": [],
            "top_categories": [],
            "top_departments": [],
            "critical_count": 0,
        }

    locality_counter = Counter()
    category_counter = Counter()
    department_counter = Counter()
    critical_count = 0

    for complaint in complaints:
        locality_counter[complaint.get("locality") or "UNKNOWN"] += 1
        category_counter[complaint.get("category") or "UNASSIGNED"] += 1
        department_counter[complaint.get("department") or "UNASSIGNED"] += 1

        score = complaint.get("priority_score")
        if score is not None and float(score) >= 80:
            critical_count += 1

    top_localities = locality_counter.most_common(5)
    top_categories = category_counter.most_common(5)
    top_departments = department_counter.most_common(5)

    summary = (
        f"Top complaint pressure is concentrated in {top_localities[0][0] if top_localities else 'UNKNOWN'} "
        f"with recurring issues mostly in {top_categories[0][0] if top_categories else 'UNASSIGNED'}. "
        f"There are currently {critical_count} critical-priority complaints that require urgent attention."
    )

    return {
        "summary": summary,
        "top_localities": top_localities,
        "top_categories": top_categories,
        "top_departments": top_departments,
        "critical_count": critical_count,
    }
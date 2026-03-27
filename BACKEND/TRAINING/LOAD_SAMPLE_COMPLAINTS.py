"""
LOAD SAMPLE COMPLAINTS

This script loads sample complaints from DATA/SAMPLE/SAMPLE_COMPLAINTS.csv
into the CivicLens database using the same AI pipeline logic.
"""

from pathlib import Path
import pandas as pd

from APP.CORE.DATABASE import SessionLocal
from APP.MODELS.COMPLAINT import Complaint
from APP.SERVICES.PREPROCESS_SERVICE import clean_text
from APP.SERVICES.CLASSIFIER_SERVICE import predict_category
from APP.SERVICES.URGENCY_SERVICE import predict_urgency
from APP.SERVICES.ROUTER_SERVICE import predict_department
from APP.SERVICES.DUPLICATE_SERVICE import find_possible_duplicate


BASE_DIR = Path(__file__).resolve().parents[2]
SAMPLE_FILE = BASE_DIR / "DATA" / "SAMPLE" / "SAMPLE_COMPLAINTS.csv"


def main():
    if not SAMPLE_FILE.exists():
        raise FileNotFoundError(f"Sample complaints file not found: {SAMPLE_FILE}")

    df = pd.read_csv(SAMPLE_FILE)
    db = SessionLocal()

    try:
        for _, row in df.iterrows():
            title = str(row["title"])
            description = str(row["description"])
            location = str(row["location"])

            combined_text = f"{title} {description}".strip()
            cleaned_text = clean_text(combined_text)

            category = predict_category(cleaned_text)
            urgency = predict_urgency(cleaned_text)
            department = predict_department(category, cleaned_text)
            duplicate_result = find_possible_duplicate(cleaned_text)

            ai_summary = (
                f"Complaint categorized as {category}, marked {urgency} urgency, "
                f"and routed to {department}."
            )

            complaint = Complaint(
                title=title,
                description=description,
                location=location,
                submitted_by="SYSTEM_SAMPLE_IMPORT",
                category=category,
                urgency=urgency,
                department=department,
                ai_summary=ai_summary,
                duplicate_of=duplicate_result["duplicate_of"],
                similarity_score=duplicate_result["similarity_score"],
                status="NEW"
            )

            db.add(complaint)

        db.commit()
        print("Sample complaints imported successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
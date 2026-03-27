import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

RAW_FILE = BASE_DIR / "DATA" / "RAW" / "NYC_311_RAW.csv"
OUTPUT_FILE = BASE_DIR / "DATA" / "PROCESSED" / "COMPLAINTS_CLEAN.csv"

USEFUL_COLUMNS = [
    "Complaint Type",
    "Descriptor",
    "Agency"
]

TARGET_ROWS = 200000


def assign_category_and_department(complaint_type: str):
    text = str(complaint_type).lower()

    if "water" in text or "sewer" in text:
        return "WATER", "WATER_SERVICES"

    if "electric" in text or "light" in text:
        return "ELECTRICITY", "ELECTRICAL_MAINTENANCE"

    if "garbage" in text or "sanitation" in text or "dirty" in text:
        return "SANITATION", "SANITATION_TEAM"

    if "noise" in text or "parking" in text:
        return "SAFETY", "CAMPUS_SAFETY"

    if "road" in text or "sidewalk" in text or "building" in text:
        return "INFRASTRUCTURE", "INFRASTRUCTURE_MAINTENANCE"

    return "OTHER", "GENERAL_ADMINISTRATION"


def assign_urgency(text: str):

    text = text.lower()

    if "fire" in text or "collapse" in text:
        return "CRITICAL"

    if "leak" in text or "outage" in text or "broken" in text:
        return "HIGH"

    if "not working" in text or "problem" in text:
        return "MEDIUM"

    return "LOW"


def main():

    if not RAW_FILE.exists():
        raise FileNotFoundError(f"Raw file not found: {RAW_FILE}")

    rows = []

    print("Reading dataset in chunks...")

    for chunk in pd.read_csv(
        RAW_FILE,
        usecols=USEFUL_COLUMNS,
        chunksize=50000,
        low_memory=False
    ):

        for _, row in chunk.iterrows():

            complaint_type = str(row["Complaint Type"])
            descriptor = str(row["Descriptor"])

            complaint_text = f"{complaint_type} {descriptor}".strip()

            category, department = assign_category_and_department(complaint_type)

            urgency = assign_urgency(complaint_text)

            rows.append({
                "complaint_text": complaint_text,
                "category": category,
                "urgency": urgency,
                "department": department,
                "location": "NYC"
            })

            if len(rows) >= TARGET_ROWS:
                break

        if len(rows) >= TARGET_ROWS:
            break

    df = pd.DataFrame(rows)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nDataset created successfully.")
    print(f"Rows saved: {len(df)}")
    print(f"Location: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
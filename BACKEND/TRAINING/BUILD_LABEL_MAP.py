"""
BUILD LABEL MAP

Creates a simple label list from dataset categories.
Useful for inspection and future model management.
"""

import json
import pandas as pd

DATA_PATH = "../DATA/PROCESSED/COMPLAINTS_CLEAN.csv"
OUTPUT_PATH = "../BACKEND/ARTIFACTS/LABEL_MAP.json"


def main():
    df = pd.read_csv(DATA_PATH)

    if "category" not in df.columns:
        raise ValueError("Dataset must contain 'category' column.")

    labels = sorted(df["category"].dropna().unique().tolist())

    with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(labels, file, indent=2)

    print(f"Label map saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
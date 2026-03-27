"""
TRAIN CLASSIFIER

This is a starter training script for future ML upgrade.
It trains a simple TF-IDF + Logistic Regression classifier
on a CSV dataset with columns: complaint_text, category
"""

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


DATA_PATH = "../DATA/PROCESSED/COMPLAINTS_CLEAN.csv"
MODEL_PATH = "../BACKEND/ARTIFACTS/CLASSIFIER_MODEL.pkl"


def main():
    df = pd.read_csv(DATA_PATH)

    if "complaint_text" not in df.columns or "category" not in df.columns:
        raise ValueError("Dataset must contain 'complaint_text' and 'category' columns.")

    df = df.dropna(subset=["complaint_text", "category"])

    model = Pipeline([
        ("tfidf", TfidfVectorizer()),
        ("clf", LogisticRegression(max_iter=1000))
    ])

    model.fit(df["complaint_text"], df["category"])
    joblib.dump(model, MODEL_PATH)

    print(f"Model saved to: {MODEL_PATH}")


if __name__ == "__main__":
    main()
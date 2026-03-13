"""
EVALUATE MODEL

Basic evaluation script for complaint category classification.
"""

from pathlib import Path

import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BASE_DIR / "DATA" / "PROCESSED" / "COMPLAINTS_CLEAN.csv"


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Processed dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    if "complaint_text" not in df.columns or "category" not in df.columns:
        raise ValueError("Dataset must contain 'complaint_text' and 'category' columns.")

    df = df.dropna(subset=["complaint_text", "category"])

    x_train, x_test, y_train, y_test = train_test_split(
        df["complaint_text"],
        df["category"],
        test_size=0.2,
        random_state=42
    )

    vectorizer = TfidfVectorizer()
    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)

    model = LogisticRegression(max_iter=1000)
    model.fit(x_train_vec, y_train)

    predictions = model.predict(x_test_vec)

    print(classification_report(y_test, predictions))


if __name__ == "__main__":
    main()
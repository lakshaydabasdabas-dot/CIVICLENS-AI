"""
CLASSIFIER SERVICE

This service predicts the complaint category.

It first attempts to load the trained ML model from BACKEND/ARTIFACTS.
If the model is unavailable, it falls back to a rule-based baseline.
"""

from pathlib import Path
import joblib


BASE_DIR = Path(__file__).resolve().parents[3]
MODEL_PATH = BASE_DIR / "BACKEND" / "ARTIFACTS" / "CLASSIFIER_MODEL.pkl"

MODEL = None

if MODEL_PATH.exists():
    try:
        MODEL = joblib.load(MODEL_PATH)
        print(f"[CLASSIFIER SERVICE] Loaded trained model from: {MODEL_PATH}")
    except Exception as error:
        print(f"[CLASSIFIER SERVICE] Failed to load model: {error}")
        MODEL = None


def rule_based_category(text: str) -> str:
    """
    Fallback rule-based classifier.
    """

    text = text.lower()

    category_keywords = {
        "WATER": ["water", "leak", "pipeline", "seepage", "tap", "drain"],
        "ELECTRICITY": ["electricity", "power", "light", "fan", "socket", "wire", "outage"],
        "SANITATION": ["garbage", "waste", "trash", "clean", "dirty", "sanitation", "toilet"],
        "SAFETY": ["unsafe", "danger", "fire", "broken railing", "collapse", "injury", "hazard"],
        "HOSTEL": ["hostel", "room", "mess", "warden", "washroom", "bathroom"],
        "ACADEMIC": ["classroom", "lab", "teacher", "faculty", "lecture", "academic", "projector"],
        "INFRASTRUCTURE": ["road", "building", "wall", "ceiling", "stair", "lift", "elevator"],
        "IT": ["internet", "wifi", "network", "server", "portal", "website", "login"],
    }

    for category, keywords in category_keywords.items():
        for keyword in keywords:
            if keyword in text:
                return category

    return "OTHER"


def predict_category(text: str) -> str:
    """
    Predict complaint category using trained model if available.
    Otherwise use fallback rule-based logic.
    """

    if not text:
        return "OTHER"

    if MODEL is not None:
        try:
            prediction = MODEL.predict([text])[0]
            return str(prediction).upper()
        except Exception as error:
            print(f"[CLASSIFIER SERVICE] Prediction failed, using fallback: {error}")

    return rule_based_category(text)
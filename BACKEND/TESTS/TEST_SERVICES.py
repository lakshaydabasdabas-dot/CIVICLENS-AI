"""
SERVICE TEST PLACEHOLDER
"""

from APP.SERVICES.PREPROCESS_SERVICE import clean_text
from APP.SERVICES.CLASSIFIER_SERVICE import predict_category


def test_clean_text():
    assert clean_text("Hello!!! World") == "hello world"


def test_predict_category():
    result = predict_category("water leakage in hostel bathroom")
    assert result in {
        "WATER",
        "ELECTRICITY",
        "SANITATION",
        "SAFETY",
        "HOSTEL",
        "ACADEMIC",
        "INFRASTRUCTURE",
        "IT",
        "OTHER"
    }
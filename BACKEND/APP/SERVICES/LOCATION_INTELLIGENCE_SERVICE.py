"""
LOCATION INTELLIGENCE SERVICE

This service extracts and normalizes location intelligence
from complaint location text for CivicLens AI.

Current version:
- cleans the location text
- detects Delhi-oriented localities when possible
- classifies broad Delhi regions
- prepares structured fields for storage

Later versions can be upgraded to use:
- Google Maps Geocoding API
- reverse geocoding
- MCD zone / ward mapping
- lat/lng persistence from backend geocoding
"""

from __future__ import annotations

import re
from typing import Optional, Dict


KNOWN_LOCALITIES = {
    "rohini": "Rohini",
    "pitampura": "Pitampura",
    "janakpuri": "Janakpuri",
    "dwarka": "Dwarka",
    "karol bagh": "Karol Bagh",
    "civil lines": "Civil Lines",
    "burari": "Burari",
    "narela": "Narela",
    "shahdara": "Shahdara",
    "mayur vihar": "Mayur Vihar",
    "laxmi nagar": "Laxmi Nagar",
    "saket": "Saket",
    "vasant kunj": "Vasant Kunj",
    "okhla": "Okhla",
    "nehru place": "Nehru Place",
    "connaught place": "Connaught Place",
    "cp": "Connaught Place",
    "preet vihar": "Preet Vihar",
    "kalkaji": "Kalkaji",
    "paschim vihar": "Paschim Vihar",
    "rajouri garden": "Rajouri Garden",
    "uttam nagar": "Uttam Nagar",
    "model town": "Model Town",
    "azam": "Azadpur",
    "azadpur": "Azadpur",
    "dilshad garden": "Dilshad Garden",
    "seelampur": "Seelampur",
    "chandni chowk": "Chandni Chowk",
    "najafgarh": "Najafgarh",
    "bawana": "Bawana",
    "mukherjee nagar": "Mukherjee Nagar",
    "vikaspuri": "Vikaspuri",
    "sadar bazar": "Sadar Bazar",
    "rk puram": "RK Puram",
    "r k puram": "RK Puram",
    "hauz khas": "Hauz Khas",
}


REGION_RULES = {
    "North Delhi": {
        "civil lines", "model town", "mukherjee nagar", "burari", "azadpur", "sadar bazar", "narela", "bawana"
    },
    "North-West Delhi": {
        "rohini", "pitampura"
    },
    "West Delhi": {
        "janakpuri", "rajouri garden", "vikaspuri", "paschim vihar", "uttam nagar"
    },
    "South-West Delhi": {
        "dwarka", "najafgarh", "rk puram"
    },
    "South Delhi": {
        "saket", "hauz khas", "vasant kunj", "kalkaji"
    },
    "South-East Delhi": {
        "okhla", "nehru place"
    },
    "East Delhi": {
        "laxmi nagar", "preet vihar", "mayur vihar"
    },
    "North-East Delhi": {
        "seelampur", "shahdara", "dilshad garden"
    },
    "Central Delhi": {
        "karol bagh", "connaught place", "chandni chowk", "cp"
    },
}


def _normalize_text(value: Optional[str]) -> str:
    if not value:
        return ""
    value = value.strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


def extract_locality(location: Optional[str]) -> Optional[str]:
    normalized = _normalize_text(location)
    if not normalized:
        return None

    for key, label in KNOWN_LOCALITIES.items():
        if key in normalized:
            return label

    return None


def classify_region(location: Optional[str]) -> Optional[str]:
    normalized = _normalize_text(location)
    if not normalized:
        return None

    for region, locality_keys in REGION_RULES.items():
        for locality_key in locality_keys:
            if locality_key in normalized:
                return region

    if "delhi" in normalized:
        return "Delhi - Unclassified"

    return None


def build_location_intelligence(location: Optional[str]) -> Dict[str, Optional[str]]:
    cleaned_location = location.strip() if location else None
    normalized_location = _normalize_text(location) if location else None
    locality = extract_locality(location)
    region = classify_region(location)

    return {
        "formatted_address": cleaned_location,
        "normalized_location": normalized_location,
        "locality": locality,
        "sub_locality": None,
        "district": "Delhi" if normalized_location and "delhi" in normalized_location else None,
        "region": region,
        "ward": None,
        "zone": None,
    }
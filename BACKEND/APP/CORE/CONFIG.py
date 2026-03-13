"""
APPLICATION CONFIGURATION

This file stores central configuration values for CivicLens AI.
It is intentionally simple and stable for the MVP.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "CivicLens AI API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered grievance intelligence platform for digital governance"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./CIVICLENS_DB.db")

    DEFAULT_COMPLAINT_STATUS: str = "NEW"

    ALLOWED_ORIGINS: list[str] = ["*"]


settings = Settings()
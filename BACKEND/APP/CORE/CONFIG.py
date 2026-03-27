"""
CONFIGURATION MODULE

Centralized configuration for CivicLens AI backend.
"""

from __future__ import annotations

import os


class Settings:
    APP_NAME: str = os.getenv("CIVICLENS_APP_NAME", "CivicLens AI API")
    APP_VERSION: str = os.getenv("CIVICLENS_APP_VERSION", "1.0.0")
    APP_ENV: str = os.getenv("CIVICLENS_ENV", "development")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./civiclens.db")

    ADMIN_USERNAME: str = os.getenv("CIVICLENS_ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("CIVICLENS_ADMIN_PASSWORD", "civiclens123")
    AUTH_SECRET: str = os.getenv("CIVICLENS_AUTH_SECRET", "change-this-secret-in-production")
    AUTH_TTL_HOURS: int = int(os.getenv("CIVICLENS_AUTH_TTL_HOURS", "12"))

    EMAIL_ENABLED: bool = os.getenv("CIVICLENS_EMAIL_ENABLED", "false").lower() == "true"
    EMAIL_FROM: str = os.getenv("CIVICLENS_EMAIL_FROM", "no-reply@civiclens.local")
    ADMIN_ALERT_EMAIL: str = os.getenv("CIVICLENS_ADMIN_ALERT_EMAIL", "admin@civiclens.local")

    FRONTEND_URL: str = os.getenv("CIVICLENS_FRONTEND_URL", "*")

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


settings = Settings()
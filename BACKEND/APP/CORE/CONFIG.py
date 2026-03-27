"""
APPLICATION CONFIGURATION

This file stores central configuration values for CivicLens AI.
It is intentionally simple and stable for the MVP.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def get_bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    APP_NAME: str = "CivicLens AI API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered grievance intelligence platform for digital governance"
    APP_ENV: str = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./CIVICLENS_DB.db")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_TIMEOUT_SECONDS: float = float(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
    AI_API_KEY: str = (
        os.getenv("AI_API_KEY")
        or os.getenv("DEEPSEEK_API_KEY")
        or OPENAI_API_KEY
    )
    AI_BASE_URL: str = (
        os.getenv("AI_BASE_URL")
        or os.getenv("DEEPSEEK_BASE_URL")
        or "https://api.deepseek.com/v1/chat/completions"
    )
    AI_MODEL: str = (
        os.getenv("AI_MODEL")
        or os.getenv("DEEPSEEK_MODEL")
        or "deepseek-chat"
    )
    AI_TIMEOUT_SECONDS: float = float(
        os.getenv("AI_TIMEOUT_SECONDS", os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
    )
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")
    RESEND_FORCE_TO_EMAIL: str = os.getenv("RESEND_FORCE_TO_EMAIL", "")
    RESEND_API_URL: str = os.getenv("RESEND_API_URL", "https://api.resend.com/emails")
    RESEND_TIMEOUT_SECONDS: float = float(os.getenv("RESEND_TIMEOUT_SECONDS", "15"))
    OTP_EXPIRY_SECONDS: int = int(os.getenv("OTP_EXPIRY_SECONDS", "300"))
    OTP_COOLDOWN_SECONDS: int = int(os.getenv("OTP_COOLDOWN_SECONDS", "60"))
    ALLOW_LOCAL_OTP_FALLBACK: bool = get_bool_env(
        "ALLOW_LOCAL_OTP_FALLBACK",
        APP_ENV != "production",
    )

    DEFAULT_COMPLAINT_STATUS: str = "NEW"

    ALLOWED_ORIGINS: list[str] = ["*"]


settings = Settings()

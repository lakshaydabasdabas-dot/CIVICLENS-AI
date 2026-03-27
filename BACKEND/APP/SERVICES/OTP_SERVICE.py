import re
import secrets
import threading
import time
from math import ceil

from APP.CORE.CONFIG import settings

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


class OTPError(ValueError):
    pass


class OTPRateLimitError(OTPError):
    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"Please wait {retry_after_seconds} seconds before requesting another OTP.")


_otp_records: dict[str, dict] = {}
_otp_lock = threading.Lock()


def normalize_email(email: str) -> str:
    normalized_email = str(email or "").strip().lower()

    if not normalized_email:
        raise OTPError("Email address is required.")

    if not EMAIL_PATTERN.fullmatch(normalized_email):
        raise OTPError("Enter a valid email address.")

    return normalized_email


def create_email_otp(email: str) -> tuple[str, int]:
    normalized_email = normalize_email(email)
    now = time.time()

    with _otp_lock:
        record = _otp_records.get(normalized_email)

        if record:
            retry_after_seconds = ceil(
                record["last_sent_at"] + settings.OTP_COOLDOWN_SECONDS - now
            )
            if retry_after_seconds > 0:
                raise OTPRateLimitError(retry_after_seconds)

        otp = f"{secrets.randbelow(1_000_000):06d}"
        _otp_records[normalized_email] = {
            "otp": otp,
            "expires_at": now + settings.OTP_EXPIRY_SECONDS,
            "last_sent_at": now,
            "verified": False,
        }

    return otp, settings.OTP_EXPIRY_SECONDS


def verify_email_otp(email: str, otp: str) -> None:
    normalized_email = normalize_email(email)
    normalized_otp = str(otp or "").strip()
    now = time.time()

    with _otp_lock:
        record = _otp_records.get(normalized_email)

        if not record:
            raise OTPError("Send OTP before verifying your email.")

        if now > record["expires_at"]:
            _otp_records.pop(normalized_email, None)
            raise OTPError("OTP expired. Request a new code.")

        if record["otp"] != normalized_otp:
            raise OTPError("Invalid OTP.")

        record["verified"] = True
        record["otp"] = None
        record["expires_at"] = now + settings.OTP_EXPIRY_SECONDS


def is_email_verified(email: str) -> bool:
    try:
        normalized_email = normalize_email(email)
    except OTPError:
        return False

    now = time.time()

    with _otp_lock:
        record = _otp_records.get(normalized_email)

        if not record:
            return False

        if now > record["expires_at"]:
            _otp_records.pop(normalized_email, None)
            return False

        return bool(record.get("verified"))


def consume_email_verification(email: str) -> None:
    try:
        normalized_email = normalize_email(email)
    except OTPError:
        return

    with _otp_lock:
        _otp_records.pop(normalized_email, None)


def clear_email_otp(email: str) -> None:
    try:
        normalized_email = normalize_email(email)
    except OTPError:
        return

    with _otp_lock:
        _otp_records.pop(normalized_email, None)

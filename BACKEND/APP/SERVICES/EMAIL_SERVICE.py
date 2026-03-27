import logging

import httpx

from APP.CORE.CONFIG import settings

logger = logging.getLogger(__name__)


def is_email_delivery_configured() -> bool:
    return bool(settings.RESEND_API_KEY)


def send_email(recipient_email: str, subject: str, body: str) -> bool:
    if not recipient_email or not is_email_delivery_configured():
        return False

    target_email = settings.RESEND_FORCE_TO_EMAIL or recipient_email

    payload = {
        "from": settings.RESEND_FROM_EMAIL,
        "to": [target_email],
        "subject": subject,
        "text": body,
    }

    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(
            settings.RESEND_API_URL,
            json=payload,
            headers=headers,
            timeout=settings.RESEND_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPError as error:
        logger.warning("Failed to send Resend email: %s", error)
        return False


def send_verification_otp_email(recipient_email: str, otp: str) -> bool:
    expiry_minutes = max(1, int(settings.OTP_EXPIRY_SECONDS / 60))
    return send_email(
        recipient_email,
        "Your Verification Code",
        f"Your OTP is: {otp}. It expires in {expiry_minutes} minutes.",
    )


def send_complaint_status_email(recipient_email: str, status: str) -> bool:
    normalized_status = status.strip().upper()

    if normalized_status == "IN_PROGRESS":
        return send_email(
            recipient_email,
            "Complaint Approved ✅",
            "Your complaint has been approved and is now being processed.",
        )

    if normalized_status == "RESOLVED":
        return send_email(
            recipient_email,
            "Complaint Resolved 🎉",
            "Your complaint has been successfully resolved.",
        )

    return False

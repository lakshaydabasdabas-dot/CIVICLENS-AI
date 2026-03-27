"""
NOTIFICATIONS API ROUTES
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from APP.SERVICES.ADMIN_GUARD_SERVICE import require_admin_user
from APP.SERVICES.NOTIFICATION_SERVICE import (
    send_status_notification,
    send_submission_notification,
)

router = APIRouter()


class NotificationPreviewRequest(BaseModel):
    email: EmailStr
    complaint: dict


@router.post("/send-submission")
def send_submission_email(
    payload: NotificationPreviewRequest,
    admin_user: dict = Depends(require_admin_user),
):
    return send_submission_notification(payload.email, payload.complaint)


@router.post("/send-status")
def send_status_email(
    payload: NotificationPreviewRequest,
    admin_user: dict = Depends(require_admin_user),
):
    return send_status_notification(payload.email, payload.complaint)
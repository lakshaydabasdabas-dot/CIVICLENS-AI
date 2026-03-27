from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

from APP.SERVICES.NOTIFICATION_SERVICE import (
    send_status_notification,
    send_submission_notification,
)

router = APIRouter()


class NotificationRequest(BaseModel):
    email: EmailStr
    complaint: dict


@router.post("/send-submission")
def send_submission_email(payload: NotificationRequest):
    return send_submission_notification(payload.email, payload.complaint)


@router.post("/send-status")
def send_status_email(payload: NotificationRequest):
    return send_status_notification(payload.email, payload.complaint)
"""
NOTIFICATION SERVICE

Prepares notification content for CivicLens AI.
"""

from __future__ import annotations

from typing import Dict, Any

from APP.SERVICES.EMAIL_SERVICE import send_email


def build_complaint_submission_email(complaint: Dict[str, Any]) -> Dict[str, str]:
    complaint_id = complaint.get("id", "N/A")
    title = complaint.get("title", "Complaint")
    location = complaint.get("location", "Location not provided")
    category = complaint.get("category", "UNASSIGNED")
    urgency = complaint.get("urgency", "UNASSIGNED")
    department = complaint.get("department", "UNASSIGNED")

    subject = f"CivicLens AI | Complaint #{complaint_id} submitted"
    body = (
        f"Your complaint has been recorded in CivicLens AI.\n\n"
        f"Complaint ID: {complaint_id}\n"
        f"Title: {title}\n"
        f"Location: {location}\n"
        f"Category: {category}\n"
        f"Urgency: {urgency}\n"
        f"Department: {department}\n\n"
        f"We will keep you updated as the complaint status changes."
    )

    return {"subject": subject, "body": body}


def build_status_update_email(complaint: Dict[str, Any]) -> Dict[str, str]:
    complaint_id = complaint.get("id", "N/A")
    title = complaint.get("title", "Complaint")
    status = complaint.get("status", "NEW")

    subject = f"CivicLens AI | Complaint #{complaint_id} status updated"
    body = (
        f"Your complaint status has been updated.\n\n"
        f"Complaint ID: {complaint_id}\n"
        f"Title: {title}\n"
        f"New Status: {status}\n"
    )

    return {"subject": subject, "body": body}


def send_submission_notification(email: str, complaint: Dict[str, Any]) -> Dict[str, Any]:
    message = build_complaint_submission_email(complaint)
    return send_email(
        to=[email],
        subject=message["subject"],
        body=message["body"],
        metadata={"type": "complaint_submission"},
    )


def send_status_notification(email: str, complaint: Dict[str, Any]) -> Dict[str, Any]:
    message = build_status_update_email(complaint)
    return send_email(
        to=[email],
        subject=message["subject"],
        body=message["body"],
        metadata={"type": "status_update"},
    )
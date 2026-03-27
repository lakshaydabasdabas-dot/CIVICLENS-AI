from __future__ import annotations

from typing import Any, Dict

from APP.SERVICES.EMAIL_SERVICE import send_email


def build_submission_email(complaint: Dict[str, Any]) -> Dict[str, str]:
    complaint_id = complaint.get("id", "N/A")
    title = complaint.get("title", "Complaint")
    location = complaint.get("location", "Location not provided")
    category = complaint.get("category", "UNASSIGNED")
    urgency = complaint.get("urgency", "UNASSIGNED")
    department = complaint.get("department", "UNASSIGNED")

    subject = f"CivicLens AI | Complaint #{complaint_id} submitted"
    body = (
        f"Your complaint has been successfully submitted.\n\n"
        f"Complaint ID: {complaint_id}\n"
        f"Title: {title}\n"
        f"Location: {location}\n"
        f"Category: {category}\n"
        f"Urgency: {urgency}\n"
        f"Department: {department}\n"
    )

    return {"subject": subject, "body": body}


def build_status_email(complaint: Dict[str, Any]) -> Dict[str, str]:
    complaint_id = complaint.get("id", "N/A")
    title = complaint.get("title", "Complaint")
    status = complaint.get("status", "NEW")
    priority_score = complaint.get("priority_score", "N/A")

    subject = f"CivicLens AI | Complaint #{complaint_id} status update"
    body = (
        f"Your complaint status has been updated.\n\n"
        f"Complaint ID: {complaint_id}\n"
        f"Title: {title}\n"
        f"New Status: {status}\n"
        f"Priority Score: {priority_score}\n"
    )

    return {"subject": subject, "body": body}


def send_submission_notification(email: str, complaint: Dict[str, Any]) -> Dict[str, Any]:
    email_content = build_submission_email(complaint)
    return send_email(
        to=[email],
        subject=email_content["subject"],
        body=email_content["body"],
        metadata={"type": "submission_notification"},
    )


def send_status_notification(email: str, complaint: Dict[str, Any]) -> Dict[str, Any]:
    email_content = build_status_email(complaint)
    return send_email(
        to=[email],
        subject=email_content["subject"],
        body=email_content["body"],
        metadata={"type": "status_notification"},
    )
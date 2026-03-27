"""
ADMIN API ROUTES

Protected utility routes for CivicLens AI admins.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from APP.SERVICES.ADMIN_GUARD_SERVICE import require_admin_user

router = APIRouter()


@router.get("/health")
def admin_health_check(admin_user: dict = Depends(require_admin_user)):
    return {
        "message": "Admin route access confirmed.",
        "user": admin_user.get("sub"),
        "role": admin_user.get("role"),
    }
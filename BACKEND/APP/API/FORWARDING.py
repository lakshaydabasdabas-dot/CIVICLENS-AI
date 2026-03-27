from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from APP.SERVICES.FORWARDING_SERVICE import build_authority_payload

router = APIRouter()


class ForwardingRequest(BaseModel):
    complaint: dict


@router.post("/prepare")
def prepare_forwarding(payload: ForwardingRequest):
    return build_authority_payload(payload.complaint)
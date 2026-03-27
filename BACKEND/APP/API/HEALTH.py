from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def health_check():
    """
    Basic health check endpoint.
    Used to confirm that the API service is running properly.
    """
    return {
        "status": "ok",
        "service": "CivicLens AI Backend",
        "message": "Health check successful"
    }
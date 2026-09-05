from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def check_health():
    """
    Health check endpoint for monitoring system availability.
    """
    return {"status": "healthy"}

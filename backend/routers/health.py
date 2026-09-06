"""
Health Check Router — GET /api/health
"""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint for deployment monitoring."""
    model_service = request.app.state.model_service
    return {
        "status": "healthy",
        "models_loaded": model_service.available_models,
        "ready": len(model_service.available_models) > 0,
    }

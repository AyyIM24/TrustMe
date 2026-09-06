"""
Metrics Router — GET /api/metrics
Serves model evaluation metrics, SHAP features, and output image paths.
"""

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse
import os

router = APIRouter()

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUTPUTS_DIR = os.path.join(PROJECT_DIR, "outputs")


@router.get("/metrics")
async def get_metrics(request: Request):
    """Return saved evaluation metrics for all trained models."""
    model_service = request.app.state.model_service
    metrics = model_service.get_metrics()
    return {
        "metrics": metrics,
        "available_models": model_service.available_models,
    }


@router.get("/shap-features")
async def get_shap_features(request: Request):
    """Return pre-computed SHAP top features."""
    model_service = request.app.state.model_service
    features = model_service.get_shap_features()
    return {"features": features}


@router.get("/outputs/{filename}")
async def get_output_file(filename: str):
    """Serve output images (plots, confusion matrices, etc.)."""
    file_path = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": f"File not found: {filename}"}

    # Determine media type
    ext = filename.rsplit(".", 1)[-1].lower()
    media_types = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "json": "application/json",
        "txt": "text/plain",
        "html": "text/html",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(file_path, media_type=media_type)


@router.get("/outputs")
async def list_outputs():
    """List all available output files."""
    if not os.path.exists(OUTPUTS_DIR):
        return {"files": []}

    files = []
    for f in sorted(os.listdir(OUTPUTS_DIR)):
        fpath = os.path.join(OUTPUTS_DIR, f)
        if os.path.isfile(fpath):
            files.append({
                "name": f,
                "size": os.path.getsize(fpath),
                "url": f"/api/outputs/{f}",
            })
    return {"files": files}

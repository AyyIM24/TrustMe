"""
Health Check Router — GET /health and GET /api/health
"""

import os
from fastapi import APIRouter, Request
from config import (
    EMBED_MODEL, NLI_MODEL, SUPPORTED_DISEASES,
    PASSAGES_FILE, INDEX_META_FILE,
)

router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint — verifies models, index, and configuration."""
    model_service = getattr(request.app.state, "model_service", None)
    available_models = model_service.available_models if model_service else ["health_baseline"]

    # ML model info from the singleton predictor
    try:
        from services.ml_service import predictor
        ml_features = predictor.n_features
        ml_model_dir = predictor.model_dir
        ml_using_fallback = predictor._using_fallback
    except Exception:
        ml_features = None
        ml_model_dir = "unknown"
        ml_using_fallback = True

    # NLI + embedding model status (lazy — check if singleton is loaded)
    embed_loaded = False
    nli_loaded   = False
    try:
        from services.retrieval_service import retrieval_service
        embed_loaded = retrieval_service.is_ready()
    except Exception:
        pass
    try:
        from services.nli_service import nli_service
        nli_loaded = nli_service.is_ready()
    except Exception:
        pass

    # Corpus passage count from index meta
    corpus_passages = 0
    corpus_hash = None
    if os.path.exists(INDEX_META_FILE):
        import json
        try:
            with open(INDEX_META_FILE) as f:
                meta = json.load(f)
            corpus_passages = meta.get("passage_count", 0)
            corpus_hash     = meta.get("corpus_hash")
        except Exception:
            pass
    elif os.path.exists(PASSAGES_FILE):
        try:
            with open(PASSAGES_FILE) as f:
                corpus_passages = sum(1 for _ in f)
        except Exception:
            pass

    return {
        "status": "healthy",
        "models_loaded": model_service.available_models,
        "ready": len(model_service.available_models) > 0,
        # v2 fields
        "ml_features": ml_features,
        "ml_model_dir": ml_model_dir,
        "ml_using_fallback": ml_using_fallback,
        "embed_model": EMBED_MODEL,
        "embed_model_loaded": embed_loaded,
        "nli_model": NLI_MODEL,
        "nli_model_loaded": nli_loaded,
        "corpus_passages": corpus_passages,
        "corpus_hash": corpus_hash,
        "supported_diseases": SUPPORTED_DISEASES,
    }

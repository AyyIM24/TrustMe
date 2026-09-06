"""
HealthGuard AI — Full-Fledged FastAPI Backend
Unified platform combining Health Misinformation Detection,
JWT Authentication & Biometric Face Verification, Real-Time News Feed,
Wikipedia Fact-Checking, and Historical Signal Tracking.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import (
    predict, metrics, health,
    auth, analyze, history, news,
    factcheck, stats, feedback
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models and verify database on startup."""
    # Initialize and verify MySQL database tables
    try:
        from database import engine, Base
        import models  # Ensures all models (User, UserFace, Analysis, Feedback, TrendingTopic, BulkJob) are registered
        Base.metadata.create_all(bind=engine)
        print("[Database] MySQL database tables verified and synchronized [OK]")
    except Exception as e:
        print(f"[Database] Warning: Could not auto-sync tables on startup: {e}")

    from services.model_service import ModelService
    app.state.model_service = ModelService()
    print("[TrustMe AI] Deep ML models loaded successfully")
    yield
    print("[TrustMe AI] Shutting down cleanly")


app = FastAPI(
    title="HealthGuard AI — Comprehensive Misinformation Platform",
    description="Full-fledged AI backend for healthcare & news misinformation detection, explainability, fact-checking, and user authentication.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under both root and /api for full backward and frontend client compatibility
ROUTERS = [
    (auth.router, ["Authentication"]),
    (analyze.router, ["Deep Analysis"]),
    (history.router, ["History"]),
    (news.router, ["News Feed"]),
    (factcheck.router, ["Fact Checking"]),
    (stats.router, ["Statistics"]),
    (feedback.router, ["Feedback"]),
    (predict.router, ["HealthGuard Prediction"]),
    (metrics.router, ["Model Metrics & SHAP"]),
    (health.router, ["System Health"]),
]

for router, tags in ROUTERS:
    app.include_router(router, tags=tags)
    app.include_router(router, prefix="/api", tags=[f"API - {t}" for t in tags])


@app.get("/")
async def root():
    return {
        "name": "HealthGuard AI & Misinformation Defense System",
        "version": "2.0.0",
        "status": "online",
        "features": [
            "JWT Authentication & Biometric Face Login",
            "Deep Text & URL Analysis",
            "Health Misinformation Detector (TF-IDF + LR / Transformers)",
            "SHAP Explainability & Token-Level Contributions",
            "Live News Feed from Global Outlets",
            "Wikipedia & Live Source Fact-Checking",
            "Personalized Scan History & Global Signal Intelligence",
        ],
        "docs": "/docs",
    }

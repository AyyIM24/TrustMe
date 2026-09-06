from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.analysis import Analysis
from models.feedback import Feedback
from models.trending import TrendingTopic
from services.auth_service import get_current_user
from services.ml_service import predictor
from services.text_processor import clean_text

router = APIRouter(prefix="/stats", tags=["Statistics"])


# ── Response Schemas ──────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_analyses: int
    fake_count: int
    real_count: int
    avg_confidence: float
    analyses_over_time: List[dict]


class CategoryStats(BaseModel):
    category: str
    fake_count: int
    real_count: int
    total: int


class TrendingKeyword(BaseModel):
    keyword: str
    fake_count: int
    real_count: int
    total: int


class GlobalStats(BaseModel):
    total_analyses: int
    total_users: int
    fake_percentage: float
    real_percentage: float
    avg_confidence: float
    accuracy_from_feedback: Optional[float] = None


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get personal dashboard statistics for the current user."""
    user_analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    total = user_analyses.count()
    fake_count = user_analyses.filter(Analysis.prediction == "fake").count()
    real_count = user_analyses.filter(Analysis.prediction == "real").count()

    avg_conf = user_analyses.with_entities(func.avg(Analysis.confidence)).scalar()
    avg_confidence = round(float(avg_conf), 2) if avg_conf else 0.0

    # Analyses over last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    daily_counts = (
        db.query(
            func.date(Analysis.created_at).label("date"),
            func.count(Analysis.id).label("count"),
            func.sum(case((Analysis.prediction == "fake", 1), else_=0)).label("fake"),
            func.sum(case((Analysis.prediction == "real", 1), else_=0)).label("real"),
        )
        .filter(
            Analysis.user_id == current_user.id,
            Analysis.created_at >= thirty_days_ago
        )
        .group_by(func.date(Analysis.created_at))
        .order_by(func.date(Analysis.created_at))
        .all()
    )

    analyses_over_time = [
        {
            "date": str(row.date),
            "count": row.count,
            "fake": int(row.fake or 0),
            "real": int(row.real or 0)
        }
        for row in daily_counts
    ]

    return DashboardStats(
        total_analyses=total,
        fake_count=fake_count,
        real_count=real_count,
        avg_confidence=avg_confidence,
        analyses_over_time=analyses_over_time
    )


@router.get("/trending", response_model=List[TrendingKeyword])
async def get_trending_keywords(db: Session = Depends(get_db)):
    """Get globally trending keywords from recent analyses (no auth required).
    
    Aggregates keywords from the last 7 days of analyses.
    """
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    recent_analyses = (
        db.query(Analysis)
        .filter(Analysis.created_at >= seven_days_ago)
        .limit(500)
        .all()
    )

    # Aggregate keywords across analyses
    keyword_stats = {}
    for analysis in recent_analyses:
        keywords = predictor.get_top_keywords(analysis.input_text, n=5)
        for kw in keywords:
            word = kw["word"]
            if word not in keyword_stats:
                keyword_stats[word] = {"fake_count": 0, "real_count": 0}
            if analysis.prediction == "fake":
                keyword_stats[word]["fake_count"] += 1
            else:
                keyword_stats[word]["real_count"] += 1

    # Sort by total count, return top 20
    trending = [
        TrendingKeyword(
            keyword=word,
            fake_count=stats["fake_count"],
            real_count=stats["real_count"],
            total=stats["fake_count"] + stats["real_count"]
        )
        for word, stats in keyword_stats.items()
    ]
    trending.sort(key=lambda x: x.total, reverse=True)

    return trending[:20]


@router.get("/global", response_model=GlobalStats)
async def get_global_stats(db: Session = Depends(get_db)):
    """Get platform-wide statistics (no auth required)."""
    from models.user import User as UserModel

    total_analyses = db.query(Analysis).count()
    total_users = db.query(UserModel).count()

    fake_count = db.query(Analysis).filter(Analysis.prediction == "fake").count()
    real_count = db.query(Analysis).filter(Analysis.prediction == "real").count()

    fake_pct = round((fake_count / total_analyses * 100), 1) if total_analyses > 0 else 0
    real_pct = round((real_count / total_analyses * 100), 1) if total_analyses > 0 else 0

    avg_conf = db.query(func.avg(Analysis.confidence)).scalar()
    avg_confidence = round(float(avg_conf), 2) if avg_conf else 0.0

    # Calculate accuracy from feedback
    total_feedback = db.query(Feedback).count()
    correct_feedback = db.query(Feedback).filter(Feedback.is_correct == True).count()
    accuracy = round((correct_feedback / total_feedback * 100), 1) if total_feedback > 0 else None

    return GlobalStats(
        total_analyses=total_analyses,
        total_users=total_users,
        fake_percentage=fake_pct,
        real_percentage=real_pct,
        avg_confidence=avg_confidence,
        accuracy_from_feedback=accuracy
    )


@router.get("/categories", response_model=List[CategoryStats])
async def get_category_stats(db: Session = Depends(get_db)):
    """Get aggregate statistics grouped by category (no auth required)."""
    recent = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(1000).all()
    
    from services.credibility_service import classify_category
    
    aggs = {}
    preset_cats = ["Health", "Politics", "Finance", "Sports", "Science & Tech", "General"]
    for cat in preset_cats:
        aggs[cat] = {"fake": 0, "real": 0, "total": 0}
        
    for item in recent:
        cat = classify_category(item.input_text)
        if cat not in aggs:
            aggs[cat] = {"fake": 0, "real": 0, "total": 0}
        aggs[cat]["total"] += 1
        if item.prediction == "fake":
            aggs[cat]["fake"] += 1
        else:
            aggs[cat]["real"] += 1
            
    return [
        CategoryStats(
            category=cat,
            fake_count=data["fake"],
            real_count=data["real"],
            total=data["total"]
        )
        for cat, data in aggs.items()
        if data["total"] > 0 or cat in preset_cats
    ]

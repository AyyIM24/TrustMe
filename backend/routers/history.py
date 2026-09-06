import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.analysis import Analysis
from schemas.analysis import PaginatedHistory, AnalysisHistoryItem
from services.auth_service import get_current_user

router = APIRouter(tags=["History"])


@router.get("/history", response_model=PaginatedHistory)
async def get_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    search: str = Query("", description="Search in title or text"),
    sort_by: str = Query("created_at", description="Sort field"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    prediction_filter: str = Query("", description="Filter by prediction: fake, real, or empty for all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated analysis history for the current user."""
    query = db.query(Analysis).filter(Analysis.user_id == current_user.id)

    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Analysis.title.like(search_term)) |
            (Analysis.input_text.like(search_term))
        )

    # Apply prediction filter
    if prediction_filter in ("fake", "real"):
        query = query.filter(Analysis.prediction == prediction_filter)

    # Count total
    total = query.count()
    total_pages = math.ceil(total / per_page) if total > 0 else 1

    # Apply sorting
    sort_column = getattr(Analysis, sort_by, Analysis.created_at)
    if order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Apply pagination
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return PaginatedHistory(
        items=[
            AnalysisHistoryItem(
                id=item.id,
                title=item.title,
                prediction=item.prediction,
                confidence=item.confidence,
                credibility_score=item.credibility_score,
                word_count=item.word_count,
                source_url=item.source_url,
                created_at=item.created_at,
                input_text_preview=item.input_text[:150] + "..." if item.input_text and len(item.input_text) > 150 else item.input_text
            )
            for item in items
        ],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )

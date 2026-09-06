from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.analysis import Analysis
from models.feedback import Feedback
from services.auth_service import get_current_user

router = APIRouter(tags=["Feedback"])


class FeedbackRequest(BaseModel):
    is_correct: bool
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    analysis_id: int
    is_correct: bool
    comment: Optional[str] = None
    message: str


@router.post("/feedback/{analysis_id}", response_model=FeedbackResponse)
async def submit_feedback(
    analysis_id: int,
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit correctness feedback on a prediction."""
    # Check analysis exists
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Check if user already gave feedback
    existing = db.query(Feedback).filter(
        Feedback.analysis_id == analysis_id,
        Feedback.user_id == current_user.id
    ).first()
    
    if existing:
        # Update existing feedback
        existing.is_correct = payload.is_correct
        existing.comment = payload.comment
        db.commit()
        db.refresh(existing)
        return FeedbackResponse(
            id=existing.id,
            analysis_id=analysis_id,
            is_correct=existing.is_correct,
            comment=existing.comment,
            message="Feedback updated successfully"
        )

    # Create new feedback
    feedback = Feedback(
        analysis_id=analysis_id,
        user_id=current_user.id,
        is_correct=payload.is_correct,
        comment=payload.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return FeedbackResponse(
        id=feedback.id,
        analysis_id=analysis_id,
        is_correct=feedback.is_correct,
        comment=feedback.comment,
        message="Feedback submitted successfully"
    )

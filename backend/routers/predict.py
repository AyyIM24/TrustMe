"""
Prediction Router — POST /api/predict
Accepts article text, returns fake/real prediction with confidence and word importance.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Article or claim text to analyze")
    model: Optional[str] = Field("auto", description="Model to use: 'baseline', 'bert', or 'auto'")


class WordImportance(BaseModel):
    word: str
    contribution: float
    direction: str


class PredictResponse(BaseModel):
    prediction: int
    label: str
    confidence: float
    probabilities: dict
    model: str
    word_importance: list


@router.post("/predict", response_model=PredictResponse)
async def predict(request: Request, body: PredictRequest):
    """
    Analyze healthcare-related text for misinformation.

    Returns prediction (fake/real), confidence score, and
    word-level importance for explainability.
    """
    model_service = request.app.state.model_service

    if not model_service.available_models:
        raise HTTPException(
            status_code=503,
            detail="No models available. Train a model first with train_healthguard.py"
        )

    try:
        result = model_service.predict(body.text, body.model)

        # Optional: Save to user history if authenticated
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from database import SessionLocal
                from models.analysis import Analysis
                from services.auth_service import decode_token

                token = auth_header.split(" ")[1]
                token_data = decode_token(token)
                if token_data and token_data.user_id:
                    db = SessionLocal()
                    try:
                        record = Analysis(
                            user_id=token_data.user_id,
                            input_text=body.text[:5000],
                            title=body.text[:100] + ("..." if len(body.text) > 100 else ""),
                            prediction="real" if result["prediction"] == 1 else "fake",
                            confidence=result["confidence"],
                            credibility_score=int(result["confidence"]) if result["prediction"] == 1 else int(100 - result["confidence"]),
                            model_version=result["model"],
                            word_count=len(body.text.split()),
                        )
                        db.add(record)
                        db.commit()
                    finally:
                        db.close()
            except Exception as history_err:
                print(f"[Predict] User history record note: {history_err}")

        return PredictResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

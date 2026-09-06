from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.analysis import Analysis
from schemas.analysis import (
    AnalyzeRequest, AnalyzeUrlRequest, AnalyzeResponse, KeywordItem,
    FeatureExplanation, CredibilitySignal
)
from services.ml_service import predictor
from services.url_scraper import scrape_article
from services.auth_service import get_current_user
from services.credibility_service import analyze_credibility, generate_tags

router = APIRouter(tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze text for fake news detection. Authentication REQUIRED."""
    if not payload.text or len(payload.text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must be at least 10 characters long"
        )

    # Run ML prediction
    result = predictor.predict(payload.text)
    keywords = predictor.get_top_keywords(payload.text)

    # Multi-signal credibility analysis
    credibility = analyze_credibility(payload.title or "", payload.text, payload.source_url)
    tags = generate_tags(payload.title or "", payload.text, result["prediction"], credibility["credibility_score"])
    explanations = predictor.explain_prediction(payload.text)

    # Save to database
    record = Analysis(
        user_id=current_user.id,
        input_text=payload.text[:5000],
        title=payload.title,
        source_url=payload.source_url,
        prediction=result["prediction"],
        confidence=result["confidence"],
        credibility_score=credibility["credibility_score"],
        model_version=result["model_version"],
        word_count=result["word_count"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        id=record.id,
        prediction=result["prediction"],
        confidence=result["confidence"],
        fake_probability=result["fake_probability"],
        real_probability=result["real_probability"],
        word_count=result["word_count"],
        model_version=result["model_version"],
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=payload.title,
        source_url=payload.source_url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations]
    )


@router.post("/analyze/url", response_model=AnalyzeResponse)
async def analyze_url(
    payload: AnalyzeUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Scrape a URL and analyze the article text. Authentication REQUIRED."""
    try:
        scraped = await scrape_article(payload.url)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to scrape URL: {str(e)}"
        )

    if not scraped["text"] or len(scraped["text"].strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract sufficient text from the URL"
        )

    # Run ML prediction
    result = predictor.predict(scraped["text"])
    keywords = predictor.get_top_keywords(scraped["text"])

    # Multi-signal credibility analysis
    credibility = analyze_credibility(scraped.get("title") or "", scraped["text"], payload.url)
    tags = generate_tags(scraped.get("title") or "", scraped["text"], result["prediction"], credibility["credibility_score"])
    explanations = predictor.explain_prediction(scraped["text"])

    # Save to database
    record = Analysis(
        user_id=current_user.id,
        input_text=scraped["text"][:5000],
        title=scraped["title"],
        source_url=payload.url,
        prediction=result["prediction"],
        confidence=result["confidence"],
        credibility_score=credibility["credibility_score"],
        model_version=result["model_version"],
        word_count=result["word_count"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        id=record.id,
        prediction=result["prediction"],
        confidence=result["confidence"],
        fake_probability=result["fake_probability"],
        real_probability=result["real_probability"],
        word_count=result["word_count"],
        model_version=result["model_version"],
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=scraped["title"],
        source_url=payload.url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations]
    )


@router.get("/analyze/{analysis_id}", response_model=AnalyzeResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    """Get a single analysis result by ID (for shareable links)."""
    record = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )

    # Re-extract keywords and run credibility/explainability
    keywords = predictor.get_top_keywords(record.input_text)
    credibility = analyze_credibility(record.title or "", record.input_text, record.source_url)
    tags = generate_tags(record.title or "", record.input_text, record.prediction, credibility["credibility_score"])
    explanations = predictor.explain_prediction(record.input_text)

    return AnalyzeResponse(
        id=record.id,
        prediction=record.prediction,
        confidence=record.confidence,
        fake_probability=round(100 - record.confidence, 2) if record.prediction == "real" else record.confidence,
        real_probability=record.confidence if record.prediction == "real" else round(100 - record.confidence, 2),
        word_count=record.word_count or 0,
        model_version=record.model_version or "v1",
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=record.title,
        source_url=record.source_url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations]
    )

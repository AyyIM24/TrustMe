from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.analysis import Analysis
from schemas.analysis import (
    AnalyzeRequest, AnalyzeUrlRequest, AnalyzeResponse, KeywordItem,
    FeatureExplanation, CredibilitySignal, VerificationResult
)
from services.ml_service import predictor
from services.url_scraper import scrape_article
from services.auth_service import optional_auth
from services.credibility_service import analyze_credibility, generate_tags
from services.verification_service import verification_service
from typing import Optional

router = APIRouter(tags=["Analysis"])


def _determine_verdict_and_probabilities(verification: VerificationResult, ml_result: dict):
    """
    Map verification pipeline verdict to the primary prediction enum, confidence, and probabilities.
    Backward-compatible with existing prediction field ('fake' | 'real' | 'uncertain').

    IMPORTANT: No clamping — all numbers must come from real model outputs.
    UNVERIFIED and OUT_OF_SCOPE return confidence=0.0 so the UI can show '—' instead of a
    fabricated percentage ring.
    """
    v = verification.verdict

    if v == "MISLEADING":
        pred = "fake"
        raw = verification.confidence if verification.confidence <= 1.0 else verification.confidence / 100.0
        conf = round(raw * 100.0, 1)
        fake_p = conf
        real_p = round(100.0 - fake_p, 1)
    elif v == "RELIABLE":
        pred = "real"
        raw = verification.confidence if verification.confidence <= 1.0 else verification.confidence / 100.0
        conf = round(raw * 100.0, 1)
        real_p = conf
        fake_p = round(100.0 - real_p, 1)
    elif v == "PARTIALLY_VERIFIED":
        # Mixed claims — abstain from full real label, show no fabricated confidence
        pred = "uncertain"
        conf = 0.0
        fake_p = 0.0
        real_p = 0.0
    elif v == "UNVERIFIED":
        # No evidence found — do NOT show a confidence percentage
        pred = "uncertain"
        conf = 0.0
        fake_p = 0.0
        real_p = 0.0
    else:  # OUT_OF_SCOPE
        # Outside supported scope — abstain, show no confidence
        pred = "uncertain"
        conf = 0.0
        fake_p = 0.0
        real_p = 0.0

    return pred, conf, fake_p, real_p


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(optional_auth)
):
    """Analyze text for fake news detection with evidence-based verification."""
    if not payload.text or len(payload.text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text must be at least 10 characters long"
        )

    # Secondary signal: ML text style prediction
    ml_result = predictor.predict(payload.text)
    keywords = predictor.get_top_keywords(payload.text)

    # Multi-signal credibility analysis
    credibility = analyze_credibility(payload.title or "", payload.text, payload.source_url)
    explanations = predictor.explain_prediction(payload.text)

    # Primary authority: Evidence-based verification pipeline
    verification = verification_service.verify_article(
        text=payload.text,
        title=payload.title,
    )

    prediction, confidence, fake_prob, real_prob = _determine_verdict_and_probabilities(
        verification, ml_result
    )

    tags = generate_tags(
        payload.title or "", payload.text, prediction, credibility["credibility_score"]
    )

    # Save to database
    record = Analysis(
        user_id=current_user.id if current_user else None,
        input_text=payload.text[:5000],
        title=payload.title,
        source_url=payload.source_url,
        prediction=prediction,
        confidence=confidence,
        credibility_score=credibility["credibility_score"],
        model_version="v2-evidence",
        word_count=ml_result["word_count"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        id=record.id,
        prediction=prediction,
        confidence=confidence,
        fake_probability=fake_prob,
        real_probability=real_prob,
        word_count=ml_result["word_count"],
        model_version="v2-evidence",
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=payload.title,
        source_url=payload.source_url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations],
        verification=verification
    )


@router.post("/analyze/url", response_model=AnalyzeResponse)
async def analyze_url(
    payload: AnalyzeUrlRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(optional_auth)
):
    """Scrape a URL and analyze article text with evidence-based verification."""
    try:
        scraped = await scrape_article(payload.url)
    except Exception as e:
        error_msg = str(e) if isinstance(e, ValueError) else f"Unable to fetch article from this URL ({str(e)}). You can copy the headline or article text and use the 'Text Input' tab."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    if not scraped["text"] or len(scraped["text"].strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract sufficient text from the URL"
        )

    # Secondary signal: ML text style prediction
    ml_result = predictor.predict(scraped["text"])
    keywords = predictor.get_top_keywords(scraped["text"])

    # Multi-signal credibility analysis
    credibility = analyze_credibility(scraped.get("title") or "", scraped["text"], payload.url)
    explanations = predictor.explain_prediction(scraped["text"])

    # Primary authority: Evidence-based verification pipeline
    verification = verification_service.verify_article(
        text=scraped["text"],
        title=scraped.get("title"),
    )

    prediction, confidence, fake_prob, real_prob = _determine_verdict_and_probabilities(
        verification, ml_result
    )

    tags = generate_tags(
        scraped.get("title") or "", scraped["text"], prediction, credibility["credibility_score"]
    )

    # Save to database
    record = Analysis(
        user_id=current_user.id if current_user else None,
        input_text=scraped["text"][:5000],
        title=scraped.get("title"),
        source_url=payload.url,
        prediction=prediction,
        confidence=confidence,
        credibility_score=credibility["credibility_score"],
        model_version="v2-evidence",
        word_count=ml_result["word_count"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AnalyzeResponse(
        id=record.id,
        prediction=prediction,
        confidence=confidence,
        fake_probability=fake_prob,
        real_probability=real_prob,
        word_count=ml_result["word_count"],
        model_version="v2-evidence",
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=scraped.get("title"),
        source_url=payload.url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations],
        verification=verification
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

    keywords = predictor.get_top_keywords(record.input_text)
    credibility = analyze_credibility(record.title or "", record.input_text, record.source_url)
    tags = generate_tags(record.title or "", record.input_text, record.prediction, credibility["credibility_score"])
    explanations = predictor.explain_prediction(record.input_text)

    # Re-run verification for the record view
    verification = verification_service.verify_article(
        text=record.input_text,
        title=record.title,
    )

    return AnalyzeResponse(
        id=record.id,
        prediction=record.prediction,
        confidence=record.confidence,
        fake_probability=round(100 - record.confidence, 2) if record.prediction == "real" else record.confidence,
        real_probability=record.confidence if record.prediction == "real" else round(100 - record.confidence, 2),
        word_count=record.word_count or 0,
        model_version=record.model_version or "v2-evidence",
        keywords=[KeywordItem(**kw) for kw in keywords],
        title=record.title,
        source_url=record.source_url,
        created_at=record.created_at,
        credibility_score=credibility["credibility_score"],
        credibility_label=credibility["credibility_label"],
        credibility_color=credibility["credibility_color"],
        credibility_signals=[CredibilitySignal(**s) for s in credibility["signals"]],
        tags=tags,
        explanations=[FeatureExplanation(**ex) for ex in explanations],
        verification=verification
    )

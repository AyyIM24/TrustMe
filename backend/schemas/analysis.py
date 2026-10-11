from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnalyzeRequest(BaseModel):
    text: str
    title: Optional[str] = None
    source_url: Optional[str] = None


class AnalyzeUrlRequest(BaseModel):
    url: str


class KeywordItem(BaseModel):
    word: str
    score: float
    severity: str


class CredibilitySignal(BaseModel):
    name: str
    score: int
    icon: str
    status: str   # "pass" | "warn" | "fail"
    detail: str


class FeatureExplanation(BaseModel):
    word: str
    contribution: float
    direction: str  # "real" | "fake"


class ModelPredictionComparison(BaseModel):
    model_name: str
    prediction: str
    confidence: float
    speed_ms: float


# ── TrustMe AI v2: Evidence-based verification schemas ───────────────────────

class Evidence(BaseModel):
    passage: str
    source_name: str
    url: str
    similarity: float
    disease: Optional[str] = None


class NLIScores(BaseModel):
    entailment: float
    contradiction: float
    neutral: float


class ClaimResult(BaseModel):
    claim: str
    stance: str  # "SUPPORTED" | "REFUTED" | "NOT_ENOUGH_EVIDENCE"
    confidence: float
    evidence: Optional[List[Evidence]] = []
    nli_scores: Optional[NLIScores] = None


class VerificationResult(BaseModel):
    verdict: str  # "RELIABLE" | "MISLEADING" | "UNVERIFIED" | "OUT_OF_SCOPE"
    confidence: float
    disease: Optional[str] = None
    claims: List[ClaimResult] = []
    summary: str
    steps: Optional[List[str]] = []
    known_myth_match: Optional[Dict[str, Any]] = None


class AnalyzeResponse(BaseModel):
    id: int
    prediction: str
    confidence: float
    fake_probability: float
    real_probability: float
    word_count: int
    model_version: str
    keywords: List[KeywordItem]
    title: Optional[str] = None
    source_url: Optional[str] = None
    created_at: Optional[datetime] = None
    credibility_score: Optional[int] = None
    credibility_label: Optional[str] = None
    credibility_color: Optional[str] = None
    credibility_signals: Optional[List[CredibilitySignal]] = None
    tags: Optional[List[str]] = []
    explanations: Optional[List[FeatureExplanation]] = []
    predictions_comparison: Optional[List[ModelPredictionComparison]] = None
    # v2 addition
    verification: Optional[VerificationResult] = None


class AnalysisHistoryItem(BaseModel):
    id: int
    title: Optional[str] = None
    prediction: str
    confidence: float
    credibility_score: Optional[int] = None
    word_count: Optional[int] = None
    source_url: Optional[str] = None
    created_at: datetime
    input_text_preview: Optional[str] = None
    verdict: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedHistory(BaseModel):
    items: List[AnalysisHistoryItem]
    total: int
    page: int
    per_page: int
    total_pages: int

from pydantic import BaseModel
from typing import Optional, List
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
    predictions_comparison: Optional[List[ModelPredictionComparison]] = []


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

    class Config:
        from_attributes = True


class PaginatedHistory(BaseModel):
    items: List[AnalysisHistoryItem]
    total: int
    page: int
    per_page: int
    total_pages: int

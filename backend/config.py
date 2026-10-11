from pydantic_settings import BaseSettings
from typing import List
import os

ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

# ── Project root (one level above backend/) ───────────────────────────────────
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── v2: Disease scope ─────────────────────────────────────────────────────────
# Only these diseases have an evidence corpus + NLI pipeline in v2.
# cancer and vaccines remain in disease_kb for keyword routing only → OUT_OF_SCOPE.
SUPPORTED_DISEASES: List[str] = ["covid19", "tuberculosis", "dengue", "diabetes"]

# ── v2: Embedding model (sentence-transformers) ───────────────────────────────
EMBED_MODEL: str = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# ── v2: NLI model — primary + fallback order ──────────────────────────────────
NLI_MODEL: str = os.getenv("NLI_MODEL", "cross-encoder/nli-deberta-v3-base")
NLI_MODEL_FALLBACKS: List[str] = [
    "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
    "facebook/bart-large-mnli",
]

# ── v2: Retrieval + NLI decision thresholds ───────────────────────────────────
SIMILARITY_FLOOR: float = float(os.getenv("SIMILARITY_FLOOR", "0.30"))
NLI_DECISION: float = float(os.getenv("NLI_DECISION", "0.70"))
NLI_MARGIN: float = float(os.getenv("NLI_MARGIN", "0.20"))
RETRIEVAL_TOP_K: int = int(os.getenv("RETRIEVAL_TOP_K", "3"))
MAX_CLAIMS_PER_ARTICLE: int = 8

# ── v2: Corpus + index paths ──────────────────────────────────────────────────
CORPUS_DIR: str = os.path.join(PROJECT_ROOT, "data", "corpus")
INDEX_DIR: str = os.path.join(PROJECT_ROOT, "data", "index")
PASSAGES_FILE: str = os.path.join(INDEX_DIR, "passages.jsonl")
EMBEDDINGS_FILE: str = os.path.join(INDEX_DIR, "embeddings.npy")
INDEX_META_FILE: str = os.path.join(INDEX_DIR, "meta.json")

# ── v2: Allowed source domains for corpus ────────────────────────────────────
ALLOWED_CORPUS_DOMAINS: List[str] = [
    "who.int", "cdc.gov", "mohfw.gov.in", "ncdc.gov.in", "nhp.gov.in",
    "tbcindia.gov.in", "icmr.gov.in", "medlineplus.gov", "nih.gov",
    "pib.gov.in", "factcheck.pib.gov.in", "nvbdcp.gov.in",
]

# ── v2: Health-trained ML model path ─────────────────────────────────────────
# Primary: Model/baseline/ (10,000 features, CoAID + FakeHealth)
# Fallback: backend/ml/ (5,000 features, old political corpus) — logs a loud warning
HEALTH_MODEL_DIR_PRIMARY: str = os.path.join(PROJECT_ROOT, "Model", "baseline")
HEALTH_MODEL_DIR_FALLBACK: str = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "ml"
)


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/trustme_db"
    SECRET_KEY: str = "trustme-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ML_MODEL_VERSION: str = "v2"
    SCRAPER_TIMEOUT: int = 10
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    GOOGLE_CLIENT_ID: str = "949959320287-mulvudjrs9pmvj9ln4ga4i7b4kftq9pr.apps.googleusercontent.com"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ENV_PATH
        extra = "ignore"


settings = Settings()

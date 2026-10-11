# TrustMe AI — Evidence-Based Health Claim Verification Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-ff0055.svg)](https://www.framer.com/motion/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6%2B-F7931E.svg)](https://scikit-learn.org/)
[![HuggingFace](https://img.shields.io/badge/🤗_Transformers-5.x-yellow.svg)](https://huggingface.co/)
[![Sentence Transformers](https://img.shields.io/badge/sentence--transformers-6.x-blueviolet.svg)](https://www.sbert.net/)

**TrustMe AI** is an advanced full-stack AI/ML healthcare verification platform that combines classical machine learning, transformer-based NLI, semantic retrieval over authoritative clinical corpora, SHAP explainability, and a modern React 19 clinical interface featuring 3D interactive character animations and biometric security safeguards.

> **Version 2.0** introduces the **Evidence Pipeline** — a 5-step architecture that anchors every verdict to real passages from WHO, CDC, MoHFW, ICMR, and AIIMS. No verdict is ever hard-coded or guessed from stylistic features alone.

---

## 🌟 Key Features

### 1. 🤝 3D Doctor & Patient Mutual Trust Authentication Gateway
- **Interactive 3D Characters**: Three.js procedural 3D models representing a Clinical Specialist and a Patient Citizen.
- **Synchronized Entry & Handshake**: Smooth cubic easing from screen boundaries, naturally clasping hands with ambient sparkle particles and subtle camera zoom.
- **Pre-Checked Security Guard**: Invalid credentials remain on the login card with inline alerts; verified credentials trigger the green checkmark morph and enter the workspace in < 5 seconds.

### 2. 🧬 Biometric Face ID & JWT Auth
- Real-time webcam face capture, normalization, and template feature matching.
- Secure token rotation with access & refresh JWT tokens and encrypted password hashing.

### 3. 🧠 Evidence-Based Verification Engine (v2)
- **Claim Extraction**: SpaCy-based sentence segmentation isolates verifiable atomic claims.
- **Semantic Retrieval**: `all-MiniLM-L6-v2` embeds claims and 484 corpus passages for cosine similarity matching.
- **NLI Stance Inference**: `DeBERTa-v3-base` (cross-encoder) outputs per-claim entailment/neutral/contradiction probabilities.
- **Verdict Aggregation**: Weighted majority over claim stances with disease scope gating.
- **OUT_OF_SCOPE Abstention**: Non-health and unsupported-condition inputs are cleanly rejected — no speculative verdict is ever fabricated.

### 4. 🔬 Classical Dual NLP Engine (Legacy / Baseline)
- **Baseline**: High-speed TF-IDF vectorizer (10,000 features) + Logistic Regression trained on CoAID + FakeHealth.
- **Ensemble**: Multi-signal heuristic blend with domain credibility and keyword myth patterns.

### 5. 🔍 SHAP Explainability & Token Highlighting
- Word-level feature attribution powered by SHAP (SHapley Additive exPlanations).
- Interactive visual tokens highlighting words contributing toward credibility (cyan-green) vs misinformation indicators (ruby-rose).

### 6. 📊 Real-Time Clinical Dashboard & Telemetry
- Physiological ECG rhythm monitors tracking stability and scanning state.
- Model comparison tables, confusion matrices, ROC-AUC curves, and trending medical claim streams.

### 7. 🎨 Tailored Clinical Design System
- Curated soft blush pink (`#FFE6EE`) and dense luminous sky blue (`#D6EBFC`) palette.
- Zero pure-white policy with micro-animations, glassmorphism, and responsive layouts.

---

## 🏗️ TrustMe AI v2 Architecture

### System Diagram

```
                             [ Web Browser / Client ]
                                        │
                      ┌─────────────────┴─────────────────┐
                      │                                   │
         [ React 19 + Three.js UI ]         [ Face Biometrics Capture ]
                      │                                   │
                      └─────────────────┬─────────────────┘
                                        │  HTTP / REST (5173 → 8000)
                                        ▼
                             [ FastAPI Backend Server ]
                                        │
       ┌────────────────────────────────┼────────────────────────────────┐
       │                                │                                │
       ▼                                ▼                                ▼
[ Auth & Biometrics ]     [ v2 Evidence Pipeline ]        [ Legacy ML Engine ]
 - JWT Auth                - Disease Scope Detector         - TF-IDF + LR (S1)
 - Face Template Store     - Claim Extractor (SpaCy)        - Ensemble (S2)
 - MySQL / SQLAlchemy      - Retrieval Service              - SHAP Explainability
                             (MiniLM-L6-v2 embeddings)
                           - NLI Service
                             (DeBERTa-v3-base)
                           - Verification Service
                             (verdict aggregation)
                                        │
                                        ▼
                             [ Authoritative Corpus ]
                          484 passages — WHO, CDC, MoHFW,
                          ICMR, AIIMS, NTEP, NVBDCP, ADA
```

### v2 Evidence Pipeline — 5 Steps

```
Step 1: Disease Scope Detection
        Keyword + NER matching
        Supported: covid19 · tuberculosis · dengue · diabetes
        → If OUT_OF_SCOPE: abstain, return explicit rejection

Step 2: Claim Extraction
        SpaCy sentence segmentation + factual filter heuristics
        Produces atomic, verifiable claim sentences

Step 3: Semantic Passage Retrieval
        Encode claim with all-MiniLM-L6-v2 (384-dim)
        Cosine search over 484 pre-built corpus embeddings
        Return top-k passages above similarity threshold 0.30

Step 4: DeBERTa-v3 NLI Inference
        For each claim × passage pair:
        → Entailment probability   (SUPPORTS claim)
        → Neutral probability      (INCONCLUSIVE)
        → Contradiction probability (REFUTES claim)

Step 5: Verdict Aggregation
        Weighted majority over all claim stances
        Outputs: MISLEADING / UNVERIFIED / RELIABLE
        Confidence: weighted contradiction vs entailment ratio
```

---

## 📁 Repository Structure

```
TrustMe/
├── README.md                         # This document
├── requirements.txt                  # Root Python dependencies
├── train.py                          # Classical model training script
├── train_healthguard.py              # Advanced training, evaluation & SHAP pipeline
├── app.py                            # Streamlit alternative interface
├── start.bat / start.ps1             # Windows one-click startup scripts
│
├── backend/                          # FastAPI Backend Service
│   ├── main.py                       # ASGI application entrypoint
│   ├── database.py                   # SQLAlchemy session & engine
│   ├── config.py                     # Pydantic environment configuration
│   ├── models/                       # SQLAlchemy DB models (User, Analysis, …)
│   ├── schemas/                      # Pydantic request/response schemas
│   ├── routers/                      # API routes (auth, analyze, factcheck, stats, news)
│   └── services/
│       ├── verification_service.py   # ★ v2 single verdict authority
│       ├── retrieval_service.py      # Semantic passage retrieval (MiniLM)
│       ├── nli_service.py            # DeBERTa-v3 stance inference
│       ├── claim_extractor.py        # SpaCy claim segmentation
│       ├── ml_service.py             # TF-IDF + LR baseline (S1)
│       ├── ensemble_service.py       # Legacy multi-signal ensemble (S2, demoted)
│       └── shap_service.py           # SHAP explainability tokens
│
├── data/
│   ├── corpus/                       # Authoritative clinical documents (32 files)
│   │   ├── seed_urls.yaml            # Canonical source URLs by disease scope
│   │   ├── covid19_*.txt             # WHO & MoHFW COVID-19 guidelines
│   │   ├── tuberculosis_*.txt        # NTEP & Ni-kshay TB protocols
│   │   ├── dengue_*.txt              # NVBDCP dengue advisory texts
│   │   └── diabetes_*.txt            # ICMR-INDIAB & ADA diabetes standards
│   ├── embeddings.npy                # 484×384 pre-built passage embeddings
│   ├── passages.json                 # Passage metadata (text, source, disease)
│   ├── health_news.csv               # Prepared health claims training dataset
│   └── raw/                          # Raw dataset references (CoAID, FakeHealth)
│
├── scripts/
│   ├── build_corpus.py               # Scrape & store authoritative documents
│   ├── build_index.py                # Chunk corpus & build MiniLM embeddings
│   └── download_models.py            # Pre-download HuggingFace model weights
│
├── eval/
│   ├── eval_claims.csv               # 125-item benchmark (25 per scope)
│   ├── run_eval.py                   # Evaluation harness (S1 / S2 / S3)
│   └── unseen_articles/              # 12 full-length test articles
│
├── frontend/                         # React 19 + Vite + Vanilla CSS
│   └── src/
│       ├── components/
│       │   ├── analyze/
│       │   │   ├── EvidencePanel.jsx # ★ v2 Evidence Panel component
│       │   │   └── ResultCard.jsx    # Updated result card with verification badge
│       │   ├── canvas/               # Three.js 3D Doctor & Patient Canvas
│       │   ├── common/               # ClinicalScanningModal, TrustMePulseBadge
│       │   └── layout/               # AppLayout, Navbar, Sidebar
│       ├── pages/                    # Login, Register, Dashboard, Analyze, FactCheck
│       ├── store/                    # Zustand global state (authStore)
│       ├── api/                      # Axios HTTP client configuration
│       └── utils/
│           └── pdfExport.js          # PDF report export utility
│
├── Model/
│   ├── baseline/                     # TF-IDF vectorizer + LR (10k features)
│   └── bert/                         # HuggingFace transformer checkpoints
│
└── outputs/
    ├── eval_metrics.json             # Full benchmark metrics (S1 / S2 / S3)
    ├── eval_report.md                # Human-readable evaluation report
    └── eval_confusion_s3.png         # S3 confusion matrix plot
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **MySQL 8.0+** (or compatible relational database)

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS

# Install all backend dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env         # Edit .env with your DB credentials

# Download HuggingFace model weights (first-run only)
python ../scripts/download_models.py

# Launch FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API docs available at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 2. Build the Evidence Corpus & Index (First Run Only)

```bash
# From the project root
python scripts/build_corpus.py   # Fetches 32 official health documents
python scripts/build_index.py    # Chunks & embeds → data/embeddings.npy (484×384)
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173/`** in your browser.

### 4. One-Click Launch (Windows)

```powershell
.\start.ps1
```

or run `start.bat` from CMD.

---

## 📊 Evaluation Results

All metrics were computed by `eval/run_eval.py` on a 125-item held-out benchmark (October 2026).
**Benchmark composition:** 25 claims per disease scope × 4 + 25 out-of-scope = 125 total.
**In-scope evaluation** (100 claims): 52 Refuted/Misleading, 48 Supported/Reliable.

### System Comparison

| System | Accuracy | Precision | Recall | F1-Score | Avg Latency | Out-of-Scope Handling |
|---|---|---|---|---|---|---|
| **S1: TF-IDF + Logistic Regression** | 63.0% | 60.6% | 82.7% | 0.6992 | 1.1 ms | ❌ Forced Real/Fake (no scope detection) |
| **S2: Legacy Multi-Signal Ensemble** | 56.0% | 75.0% | 23.1% | 0.3529 | 0.2 ms | ❌ Forced Real/Fake (heuristic blend) |
| **S3: TrustMe AI v2 Evidence Pipeline** | **88.0%** | **97.6%** | 78.8% | **0.8723** | 347.5 ms | ✅ 100% Explicit Abstention |

> S3 raises accuracy **+25 pp** over S1 and **+32 pp** over S2, with near-perfect precision of 97.6%.

### S3 Disease-Specific Breakdown

| Disease Domain | Claims | Correct | Accuracy | Primary Source |
|---|---|---|---|---|
| **COVID-19** | 25 | 21 | **84.0%** | WHO & MoHFW Clinical Guidelines |
| **Tuberculosis** | 25 | 19 | **76.0%** | NTEP & Ni-kshay Protocols |
| **Dengue** | 25 | 17 | **68.0%** | NVBDCP Advisory Guidelines |
| **Diabetes** | 25 | 10 | **40.0%** | ICMR-INDIAB & ADA Standards |
| **Out-of-Scope** | 25 | 25 | **100.0%** | Explicit Abstention Protocol |

### Architectural Metrics (S3 Only)

| Metric | Value |
|---|---|
| Evidence Citation Rate | **98.0%** |
| Out-of-Scope Rejection Rate | **100.0%** |
| Benchmark Size | 125 claims |
| Corpus Passages | 484 (MiniLM-L6-v2, 384-dim) |
| Evaluation Date | 2026-10-11 UTC |

Full numeric breakdown: [`outputs/eval_metrics.json`](outputs/eval_metrics.json)
Full narrative report: [`outputs/eval_report.md`](outputs/eval_report.md)

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user with optional face biometrics |
| `POST` | `/auth/login` | Authenticate username/password & issue JWT tokens |
| `POST` | `/auth/login-face` | Verify face template signature and issue tokens |
| `POST` | `/analyze` | Run health text classification, SHAP scoring, **and v2 evidence verification** |
| `POST` | `/analyze/url` | Extract article content from URL and analyze |
| `POST` | `/factcheck/check` | Cross-examine claim against authoritative medical sources |
| `GET` | `/stats/dashboard` | Fetch aggregated scanning history & metrics |
| `GET` | `/news/feed` | Stream curated real-time medical headlines |
| `GET` | `/health` | Backend health-check (model status, feature count, corpus size) |

### `/analyze` Response — `verification` Field (v2 Addition)

```json
{
  "id": 42,
  "text": "Garlic cures COVID-19.",
  "prediction": "fake",
  "confidence": 0.91,
  "shap_tokens": [],
  "verification": {
    "verdict": "MISLEADING",
    "disease_scope": "covid19",
    "confidence": 0.99,
    "claims": [
      {
        "claim": "Garlic cures COVID-19.",
        "stance": "CONTRADICTION",
        "top_passage": "Drinking hot water or consuming garlic does not kill the coronavirus.",
        "source": "WHO COVID-19 Myth Busters",
        "similarity": 0.87,
        "entailment": 0.01,
        "neutral": 0.01,
        "contradiction": 0.98
      }
    ],
    "evidence_count": 1,
    "pipeline_steps": [
      "Disease Scope Detection: covid19",
      "Claim Extraction: 1 claim",
      "Semantic Retrieval: top-5 passages",
      "DeBERTa NLI Inference: contradiction 98%",
      "Verdict Aggregation: MISLEADING"
    ]
  }
}
```

The `verification` field is appended to all existing response fields and is backward-compatible with v1 clients that ignore unknown keys.

---

## 🗄️ Corpus Sources

The Evidence Pipeline is grounded in 32 authoritative clinical documents (484 passage chunks) from:

| Disease | Sources |
|---|---|
| **COVID-19** | WHO Myth Busters, WHO Clinical Management Guidelines, MoHFW India Advisories, CDC COVID-19 Overview |
| **Tuberculosis** | NTEP (National TB Elimination Programme), Ni-kshay Patient Protocols, WHO TB Fact Sheets, CDC TB Guidelines |
| **Dengue** | NVBDCP (National Vector-Borne Disease Control Programme), WHO Dengue Clinical Handbook, MoHFW Dengue Advisory |
| **Diabetes** | ICMR-INDIAB Clinical Standards, ADA Standards of Care, WHO Diabetes Fact Sheet |

All corpus documents are stored as plain-text files in `data/corpus/` with canonical source URLs registered in `data/corpus/seed_urls.yaml`.

---

## 🧪 Running Tests

```bash
# Unit tests for Claim Extractor (4 tests)
python -m pytest backend/tests/test_claim_extractor.py -v

# Full evaluation harness (S1 / S2 / S3 comparison, approx 5 min)
python eval/run_eval.py
# → outputs/eval_metrics.json
# → outputs/eval_confusion_s3.png
# → outputs/eval_report.md
```

---

## ⚠️ Known Limitations

1. **Scope restricted to 4 diseases.** Supported: `covid19`, `tuberculosis`, `dengue`, `diabetes`. All other health conditions route to `OUT_OF_SCOPE` with explicit abstention. No verdict is fabricated.

2. **English-only corpus.** All 32 corpus documents are in English. Non-English claims will return low similarity scores and may route to `UNVERIFIED` or `OUT_OF_SCOPE`.

3. **Diabetes accuracy gap (40%).** The ICMR-INDIAB & ADA corpus has sparser passage coverage for nuanced nutritional claims. Expanding the diabetes corpus is the most impactful next improvement.

4. **Inference latency (347 ms avg).** DeBERTa-v3 NLI requires a CPU forward pass per claim × passage pair. GPU inference or ONNX quantization would reduce this to < 50 ms.

5. **Static corpus (no live crawling).** The corpus is built once via `scripts/build_corpus.py`. Emerging clinical guidance requires a manual corpus rebuild and re-embedding.

6. **No multi-claim deduplication.** Semantically identical claims within a single article are each scored independently; deduplication would reduce redundant NLI calls.

---

## 🔒 Security & Privacy

- **Password Protection**: Salted Bcrypt hashing for all user credentials.
- **Biometric Templates**: Face encodings are vectorized into mathematical Euclidean signatures; raw images are never stored or transmitted.
- **Zero Credential Leaks**: `.env` and all sensitive configurations are strictly excluded via `.gitignore`.
- **JWT Token Rotation**: Access tokens expire on schedule; refresh token rotation prevents replay attacks.

---

## 📄 License & Attribution

Developed for the **Healthcare Misinformation Detection Research Project**
A. P. Shah Institute of Technology — IT Department AI/ML Mini Project, 2026.

**Datasets:**
- **CoAID** — Cui, L. & Lee, D. (2020). CoAID: COVID-19 Healthcare Misinformation Dataset.
- **FakeHealth** — Dai, E. et al. (2020). FakeHealth: A Repository of Fake and Credible Health News.

**Pre-trained Models:**
- `sentence-transformers/all-MiniLM-L6-v2` (Apache 2.0)
- `cross-encoder/nli-deberta-v3-base` (MIT License)

**Corpus Sources:** WHO, CDC, MoHFW India, ICMR, AIIMS, NTEP, NVBDCP, ADA — publicly available clinical guidelines.

All rights reserved © 2026 TrustMe AI.

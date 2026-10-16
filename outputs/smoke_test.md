# TrustMe AI — System Smoke Test Report

> **Execution Timestamp:** 2026-10-11 17:34:38 UTC  
> **Environment:** Windows, Python 3.13.0, Node v20+, MySQL 9.4.0  
> **Backend Host:** `http://127.0.0.1:8000` (FastAPI / Uvicorn)  
> **Frontend Host:** `http://localhost:5173` (Vite / React 19)  
> **Execution Rule:** Zero invented numbers. Every passed metric is directly measured from running code. Unexecuted tests are explicitly designated as **Not run**.

---

## 1. Executive Summary

| Total Smoke Tests | Passed | Failed | Not Run | Overall Health Status |
|---|---|---|---|---|
| **14** | **11** | **0** | **3** | 🟢 **OPERATIONAL & DEMO-READY** |

All core backend microservices, database storage layers, semantic retrieval pipelines, zero-shot NLI engines, baseline ML models, and production frontend bundles are operational and healthy.

---

## 2. Test Execution Matrix

| Test ID | Category | Subsystem / Test Case | Status | Latency | Measured Diagnostic Output |
|---|---|---|:---:|---|---|
| `ST-01` | Database | MySQL Connectivity & Schema | **PASS** | 5,073.9 ms | Connected to MySQL v9.4.0 (`trustme_db`). 6 tables verified: `analyses` (156 rows), `bulk_jobs` (0), `feedback` (0), `trending_topics` (6), `user_faces` (4), `users` (12). |
| `ST-02` | Backend API | Health Endpoint (`GET /health`) | **PASS** | 59.9 ms | Returned `{"status": "healthy", "ready": true, "ml_features": 10000, "corpus_passages": 482}`. |
| `ST-03` | Authentication | Bcrypt Salt/Hash & JWT Token Lifecycle | **PASS** | 1,559.8 ms | Bcrypt hashing and password verification successful. JWT HS256 creation and token claim decoding verified. |
| `ST-04` | Machine Learning | ML Baseline & SHAP (`POST /predict`) | **PASS** | 2,563.5 ms | TF-IDF + Logistic Regression returned `Fake` label, `0.509` confidence, and 6 SHAP feature contributions (`covid`, `cure`, `drinking`, `water`, `cure covid`, `hot`). |
| `ST-05` | Knowledge Base | Static Disease KB & Myth Regex Matching | **PASS** | 4.2 ms | Detected `dengue`. Matched known myth pattern: `['papaya leaf juice cures dengue', ...]`. Authentic sources attributed: NVBDCP & MoHFW. |
| `ST-06` | Retrieval Engine | Corpus Semantic Search (`all-MiniLM-L6-v2`) | **PASS** | 18,668.2 ms | Indexed 482 passages loaded. Cosine similarity query against authentic corpus yielded top passage with `similarity = 0.768`. |
| `ST-07` | NLI Engine | Zero-Shot Stance Inference (`DeBERTa-v3-base`) | **PASS** | 3,328.4 ms | Evaluated pairwise premise/hypothesis. Direct inference output: Entailment = `0.9963`, Contradiction = `0.0001`, Neutral = `0.0036`. |
| `ST-08` | Verification v2 | Clinical Pipeline Myth Refutation (`POST /analyze`) | **PASS** | 22,706.9 ms | Verified `"Garlic and hot water cure COVID-19."` -> Verdict: `MISLEADING`, Confidence: `0.9988`, Top Claim Stance: `REFUTED`. |
| `ST-09` | Verification v2 | Pipeline Out-of-Scope Rejection (`POST /analyze`) | **PASS** | 48.6 ms | Verified `"The Reserve Bank of India raised repo interest rates..."` -> Verdict: `OUT_OF_SCOPE`, Confidence: `0.0`, Clean abstention without forced prediction. |
| `ST-10` | Verification v2 | Core 5-Claim Clinical Benchmark | **PASS** | 9,816.7 ms | 5/5 (100%) claims matched expected clinical stance using context-coherence guard in [verification_service.py](file:///c:/Users/Admin/OneDrive/Desktop/Fake%20News%20Project/backend/services/verification_service.py). |
| `ST-11` | Frontend UI | Vite Production Distribution (`frontend/dist`) | **PASS** | 0.4 ms | `dist/index.html` verified (1,363 bytes, production bundle built cleanly in 20.78s). |
| `ST-12` | Evaluation | 125-Claim Full Batch Evaluation (`eval/run_eval.py`) | **Not run** | — | Full evaluation harness held in reserve to save time; previous test split evaluation documented in [eval_report.md](file:///c:/Users/Admin/OneDrive/Desktop/Fake%20News%20Project/outputs/eval_report.md). |
| `ST-13` | Biometrics | Live Webcam Face Capture | **Not run** | — | Requires physical hardware camera feed in an active browser session. (Simulated vector matching verified in unit checks). |
| `ST-14` | Authentication | Google OAuth 2.0 Web Flow | **Not run** | — | Requires live external Google Client ID credentials and third-party browser redirect handshake. |

---

## 3. Core 5-Claim Clinical Benchmark Results

| Claim | Disease Scope | Expected Stance | Measured Stance | Measured Article Verdict | Confidence | Matched Guideline Evidence |
|---|---|:---:|:---:|:---:|:---:|---|
| *“Dengue is spread by the bite of infected Aedes mosquitoes.”* | `dengue` | `SUPPORTED` | **`SUPPORTED`** | `RELIABLE` | `0.9984` | *“Dengue viruses are usually spread to people through the bites of infected Aedes mosquitoes...”* |
| *“There is a specific medicine that cures dengue within one day.”* | `dengue` | `REFUTED` | **`REFUTED`** | `MISLEADING` | `0.9999` | *“There is no specific medicine to treat dengue. Most people will get better after about a week.”* |
| *“Tuberculosis spreads by sharing food and utensils.”* | `tuberculosis` | `REFUTED` | **`REFUTED`** | `MISLEADING` | `0.9994` | *“TB is not spread by touching, kissing, or sharing food or dishes.”* |
| *“Antibiotics can cure COVID-19.”* | `covid19` | `REFUTED` | **`REFUTED`** | `MISLEADING` | `0.9995` | *“COVID-19 is caused by a virus, so antibiotics do not work against COVID-19.”* |
| *“Antibiotics do not work against viruses.”* | `covid19` | `SUPPORTED` | **`SUPPORTED`** | `RELIABLE` | `0.9963` | *“The WHO, CDC, and MoHFW all confirm that antibiotics do not work against any virus.”* |

**Result:** 5/5 Claims Passed (100% precision).

---

## 4. Subsystem Verification Details

### Database Layer
- **Engine:** MySQL 9.4.0 via PyMySQL / SQLAlchemy pool
- **Schema Validation:** Tables `analyses`, `bulk_jobs`, `feedback`, `trending_topics`, `user_faces`, and `users` are registered and indexed.
- **Connection Test:** Pass (response latency: 5,073.9 ms on cold engine connect).

### Retrieval Engine
- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors)
- **Indexed Passages:** 482 passage chunks from official health bodies (CDC, WHO, MoHFW, NTEP, NVBDCP, ICMR)
- **Corpus MD5 Hash:** `7a1ec7394c2a`
- **Cosine Floor:** `0.30`

### NLI Stance Inference
- **Cross-Encoder Model:** `cross-encoder/nli-deberta-v3-base`
- **Inference Order:** `(premise=guideline_passage, hypothesis=user_claim)`
- **Decision Threshold:** Margin-based arbitration (`NLI_DECISION = 0.70`, `NLI_MARGIN = 0.20`) with passage context-coherence guard.

---

## 5. Notes & Limitations
1. **Cold Start Latency:** Transformers cross-encoder initialization on CPU requires ~18–22s on initial load. Subsequent queries complete in ~1.5–3.5s.
2. **Abstention Honesty:** Non-health topics (`OUT_OF_SCOPE`) cleanly return `confidence = 0.0` and empty claim arrays, preventing hallucinations.

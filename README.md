# TrustMe AI — Healthcare Misinformation Detection & Clinical Verification Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128-black.svg)](https://threejs.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-ff0055.svg)](https://www.framer.com/motion/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6%2B-F7931E.svg)](https://scikit-learn.org/)

**TrustMe AI** is an advanced full-stack AI/ML healthcare verification platform engineered to detect, classify, and explain health misinformation and medical fake news. Combining classical machine learning, transformer-based language models, SHAP explainability, and a modern clinical React interface featuring 3D interactive character animations and biometric security safeguards.

---

## 🌟 Key Features

### 1. 🤝 3D Doctor & Patient Mutual Trust Authentication Gateway
- **Interactive 3D Characters**: Three.js procedural 3D models representing a Clinical Specialist (lab coat, stethoscope, scrub V-neck, ID badge) and a Patient Citizen.
- **Synchronized Entry & Handshake**: Smooth cubic easing from screen boundaries, naturally clasping hands in a handshake with ambient sparkle particles and subtle camera zoom.
- **Extruded 3D Vitality Heart**: Ruby-rose / emerald-glowing crystal heart with rotating vitality ring emerging above the handshake point.
- **Pre-Checked Security Guard**: Credentials are authenticated against the backend before playing the transition. Invalid credentials remain on the login card with inline alerts, while verified credentials trigger the green checkmark morph and enter the workspace in $< 5$ seconds.

### 2. 🧬 Biometric Face ID & JWT Auth
- Real-time webcam face capture, normalization, and template feature matching.
- Secure token rotation with access & refresh JWT tokens and encrypted password hashing.

### 3. 🧠 Dual NLP Machine Learning Engine
- **Classical Baseline**: High-speed TF-IDF vectorizer + Logistic Regression trained on merged healthcare datasets (CoAID + FakeHealth).
- **Deep Transformer Support**: Fine-tuned DistilBERT / BioBERT architecture for deep contextual nuance and health claim fact-checking.

### 4. 🔍 SHAP Explainability & Token Highlighting
- Word-level feature attribution powered by SHAP (SHapley Additive exPlanations).
- Interactive visual tokens highlighting words contributing toward credibility (cyan-green) vs misinformation indicators (ruby-rose).

### 5. 📊 Real-Time Clinical Dashboard & Telemetry
- Physiological ECG rhythm monitors tracking stability and scanning state.
- Model comparison tables, confusion matrices, ROC-AUC curves, and trending medical claim streams.

### 6. 🎨 Tailored Clinical Design System
- Curated soft blush pink (`#FFE6EE`) and dense luminous sky blue (`#D6EBFC`) palette.
- Zero pure white policy with micro-animations, glassmorphism, and responsive layouts.

---

## 🏗️ Architecture

```
                                [ Web Browser / Client ]
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
           [ React 19 + Three.js UI ]              [ Face Biometrics Capture ]
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │  HTTP / REST API (port 5173 -> 8000)
                                           ▼
                                [ FastAPI Backend Server ]
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           ▼                               ▼                               ▼
  [ Auth & Biometrics ]          [ Inference Engine ]             [ Fact-Check Service ]
   - JWT Auth                     - TF-IDF + Logistic Reg          - Semantic Comparison
   - Face Template Store          - Transformer (DistilBERT)       - Source Credibility
   - MySQL / SQLAlchemy           - SHAP Explainability Tokenizer  - Trending News Feeds
```

---

## 📁 Repository Structure

```
TrustMe/
├── README.md                     # Comprehensive documentation
├── requirements.txt              # Root Python dependencies
├── train.py                      # Classical model training script
├── train_healthguard.py           # Advanced training, evaluation & SHAP pipeline
├── app.py                        # Streamlit alternative interface
├── start.bat / start.ps1         # Windows one-click startup scripts
│
├── backend/                      # FastAPI Backend Service
│   ├── main.py                   # ASGI application entrypoint
│   ├── database.py               # SQLAlchemy database session & engine
│   ├── config.py                 # Pydantic environment configuration
│   ├── .env.example              # Template environment variables
│   ├── models/                   # SQLAlchemy database models (User, Analysis, etc.)
│   ├── schemas/                  # Pydantic schemas for request/response validation
│   ├── routers/                  # API routes (auth, predict, stats, factcheck, news)
│   ├── services/                 # Business logic, inference & biometrics
│   └── ml/                       # Pickled models & vectorizers
│
├── frontend/                     # React 19 + Vite + Vanilla CSS Frontend
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite bundler configuration
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/           # Three.js 3D Doctor & Patient Canvas
│   │   │   ├── common/           # ClinicalScanningModal, TrustMePulseBadge
│   │   │   ├── auth/             # ProtectedRoute
│   │   │   └── layout/           # AppLayout, Navbar, Sidebar
│   │   ├── pages/                # Login, Register, Dashboard, Predict, Analyze, Explainability
│   │   ├── store/                # Zustand global state (authStore)
│   │   └── api/                  # Axios HTTP client configuration
│
├── data/                         # Datasets & Conversion Scripts
│   ├── convert_dataset.py        # Dataset merger & normalization
│   ├── health_news.csv           # Prepared health claims dataset
│   └── raw/                      # Raw dataset references (CoAID, FakeHealth)
│
├── Model/                        # Pre-trained ML weights & artifacts
│   ├── baseline/                 # Vectorizer and Logistic Regression models
│   └── bert/                     # HuggingFace transformer checkpoints
│
└── outputs/                      # Generated evaluation plots, confusion matrices & SHAP figures
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **MySQL 8.0+** (or compatible relational database)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux / macOS

# Install backend dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env     # Edit .env with your database credentials

# Launch FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API documentation will be accessible at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

Open your browser at:
- **Web App**: `http://localhost:5173/`

---

### 3. One-Click Launch (Windows)

Use the provided launch script to run both servers simultaneously:
```powershell
.\start.ps1
```
or run `start.bat` from CMD.

---

## 🧪 Model Performance (Baseline)

| Metric | Score | Description |
|---|---|---|
| **Accuracy** | **77.5%** | Overall correct health claims classification |
| **Precision** | **75.9%** | Low false-positive alarm rate for valid news |
| **Recall** | **78.8%** | High sensitivity in catching malicious claims |
| **F1-Score** | **76.3%** | Balanced harmonic mean on imbalanced data |
| **ROC-AUC** | **0.895** | High discriminative power across decision thresholds |

---

## 🔌 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register new user with optional face biometrics |
| `POST` | `/auth/login` | Authenticate username/password & issue JWT tokens |
| `POST` | `/auth/login-face` | Verify face template signature and issue tokens |
| `POST` | `/analyze` | Run health text classification & SHAP scoring |
| `POST` | `/analyze/url` | Extract article content from URL and analyze |
| `POST` | `/factcheck/check` | Cross-examine claim against verified medical sources |
| `GET` | `/stats/dashboard` | Fetch aggregated scanning history & metrics |
| `GET` | `/news/feed` | Stream curated real-time medical headlines |

---

## 🔒 Security & Privacy

- **Password Protection**: Salted Bcrypt hashing for password credentials.
- **Biometric Templates**: Face encodings are vectorized into mathematical Euclidean signatures; raw images are never exposed.
- **Zero Credential Leaks**: `.env` and sensitive configurations are strictly excluded via `.gitignore`.

---

## 📄 License & Attribution

Developed for the Healthcare Misinformation Detection Research Project.
Datasets provided by **CoAID** (Cui & Lee) and **FakeHealth** (Dai et al.).
All rights reserved © 2026 TrustMe AI.

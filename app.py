"""
HealthGuard AI — Streamlit App (Lightweight Alternative)
Run: streamlit run app.py
"""

import streamlit as st
import pickle
import re
import os
import json
import numpy as np

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

import nltk
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)

# ============================================================================
# Setup
# ============================================================================

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(PROJECT_DIR, "model")
OUTPUTS_DIR = os.path.join(PROJECT_DIR, "outputs")

STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()


def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"<.*?>", "", text)
    text = re.sub(r"[^a-zA-Z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    words = [LEMMATIZER.lemmatize(w) for w in words if w not in STOP_WORDS and len(w) > 2]
    return " ".join(words)


@st.cache_resource
def load_model():
    # Try baseline/model.pkl first, then root model.pkl
    for path in [
        os.path.join(MODEL_DIR, "baseline", "model.pkl"),
        os.path.join(MODEL_DIR, "model.pkl"),
    ]:
        if os.path.exists(path):
            model = pickle.load(open(path, "rb"))
            vec_path = path.replace("model.pkl", "vectorizer.pkl")
            vectorizer = pickle.load(open(vec_path, "rb"))
            return model, vectorizer
    return None, None


# ============================================================================
# UI
# ============================================================================

st.set_page_config(
    page_title="HealthGuard AI",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS
st.markdown("""
<style>
    .stApp { background-color: #0a0f1a; }
    .main-header { text-align: center; padding: 2rem 0; }
    .result-card {
        padding: 1.5rem; border-radius: 1rem; margin: 1rem 0;
        border-left: 4px solid;
    }
    .fake-card { background: rgba(239,68,68,0.1); border-color: #ef4444; }
    .real-card { background: rgba(16,185,129,0.1); border-color: #10b981; }
</style>
""", unsafe_allow_html=True)

st.title("🛡️ HealthGuard AI")
st.markdown("### Health Misinformation Detection System")
st.markdown("Analyze healthcare news and claims for credibility using NLP and explainable AI.")

st.divider()

model, vectorizer = load_model()

if model is None:
    st.error("No model found! Run `python train_healthguard.py --model baseline --data data/health_news.csv` first.")
    st.stop()

# Sidebar
with st.sidebar:
    st.header("About")
    st.markdown("""
    **HealthGuard AI** detects fake/misleading healthcare news using:
    - TF-IDF + Logistic Regression (baseline)
    - DistilBERT Transformer (advanced)
    - SHAP Explainability

    **Dataset:** CoAID + FakeHealth (4,107 articles)
    """)

    # Metrics
    metrics_path = os.path.join(OUTPUTS_DIR, "metrics_baseline.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)
        st.subheader("Model Performance")
        col1, col2 = st.columns(2)
        col1.metric("Accuracy", f"{metrics['accuracy']*100:.1f}%")
        col2.metric("F1 Score", f"{metrics['f1_score']*100:.1f}%")
        col1.metric("Precision", f"{metrics['precision']*100:.1f}%")
        col2.metric("ROC-AUC", f"{metrics['roc_auc']:.3f}")

# Main input
user_input = st.text_area(
    "Paste a healthcare article, claim, or social media post:",
    height=200,
    placeholder="e.g., Drinking bleach cures COVID-19..."
)

col1, col2 = st.columns([1, 4])
with col1:
    predict_btn = st.button("🔍 Analyze", type="primary", use_container_width=True)

if predict_btn:
    if not user_input.strip() or len(user_input.strip()) < 20:
        st.warning("Please enter at least 20 characters of text.")
    else:
        with st.spinner("Analyzing..."):
            cleaned = clean_text(user_input)
            vector = vectorizer.transform([cleaned])
            prediction = model.predict(vector)[0]
            probabilities = model.predict_proba(vector)[0]
            confidence = max(probabilities)

        # Result
        if prediction == 0:
            st.markdown(f"""
            <div class="result-card fake-card">
                <h2>❌ Likely Fake / Misleading</h2>
                <p>Confidence: <strong>{confidence*100:.1f}%</strong></p>
                <p>Fake: {probabilities[0]*100:.1f}% | Real: {probabilities[1]*100:.1f}%</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
            <div class="result-card real-card">
                <h2>✅ Likely Real / Credible</h2>
                <p>Confidence: <strong>{confidence*100:.1f}%</strong></p>
                <p>Fake: {probabilities[0]*100:.1f}% | Real: {probabilities[1]*100:.1f}%</p>
            </div>
            """, unsafe_allow_html=True)

        # Word importance
        feature_names = vectorizer.get_feature_names_out()
        tfidf_scores = vector.toarray()[0]
        coefs = model.coef_[0]
        contributions = tfidf_scores * coefs
        nonzero_idx = np.nonzero(tfidf_scores)[0]

        if len(nonzero_idx) > 0:
            word_data = [(feature_names[i], contributions[i]) for i in nonzero_idx]
            word_data.sort(key=lambda x: abs(x[1]), reverse=True)

            st.subheader("🔬 Word-Level Explanation")
            st.caption("Red = pushes toward Fake, Green = pushes toward Real")

            for word, contrib in word_data[:15]:
                direction = "🟢 Real" if contrib > 0 else "🔴 Fake"
                st.progress(min(abs(contrib) / max(abs(c) for _, c in word_data[:15]), 1.0))
                st.caption(f"**{word}** → {direction} (contribution: {contrib:.4f})")

# Show plots
st.divider()
st.subheader("📊 Training Outputs")

plot_files = [
    ("Class Distribution", "class_distribution.png"),
    ("Confusion Matrix", "confusion_matrix_baseline.png"),
    ("ROC Curve", "roc_curve_baseline.png"),
    ("Word Cloud — Fake", "wordcloud_fake.png"),
    ("Word Cloud — Real", "wordcloud_real.png"),
]

cols = st.columns(2)
for i, (title, filename) in enumerate(plot_files):
    filepath = os.path.join(OUTPUTS_DIR, filename)
    if os.path.exists(filepath):
        with cols[i % 2]:
            st.image(filepath, caption=title, use_container_width=True)
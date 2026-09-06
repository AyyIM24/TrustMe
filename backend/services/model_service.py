"""
Model Service — Loads and manages ML models for prediction.
"""

import os
import re
import pickle
import json
import numpy as np

import nltk
nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

STOP_WORDS = set(stopwords.words("english"))
LEMMATIZER = WordNetLemmatizer()

# Paths relative to backend/
# services/model_service.py → services/ → backend/ → project root
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL_DIR = os.path.join(PROJECT_DIR, "model")
OUTPUTS_DIR = os.path.join(PROJECT_DIR, "outputs")


class ModelService:
    """Manages loading and inference for baseline and transformer models."""

    def __init__(self):
        self.baseline_model = None
        self.baseline_vectorizer = None
        self.bert_model = None
        self.bert_tokenizer = None
        self.available_models = []
        self._load_models()

    def _load_models(self):
        """Load all available model artifacts."""
        # --- Baseline (TF-IDF + LR) ---
        baseline_model_path = os.path.join(MODEL_DIR, "baseline", "model.pkl")
        baseline_vec_path = os.path.join(MODEL_DIR, "baseline", "vectorizer.pkl")

        # Fallback to root model/ directory
        if not os.path.exists(baseline_model_path):
            baseline_model_path = os.path.join(MODEL_DIR, "model.pkl")
            baseline_vec_path = os.path.join(MODEL_DIR, "vectorizer.pkl")

        if os.path.exists(baseline_model_path) and os.path.exists(baseline_vec_path):
            self.baseline_model = pickle.load(open(baseline_model_path, "rb"))
            self.baseline_vectorizer = pickle.load(open(baseline_vec_path, "rb"))
            self.available_models.append("baseline")
            print(f"  [OK] Baseline model loaded from {baseline_model_path}")

        # --- Transformer (DistilBERT/BioBERT) ---
        bert_dir = os.path.join(MODEL_DIR, "bert")
        if os.path.exists(os.path.join(bert_dir, "config.json")):
            try:
                from transformers import AutoModelForSequenceClassification, AutoTokenizer
                import torch
                self.bert_tokenizer = AutoTokenizer.from_pretrained(bert_dir)
                self.bert_model = AutoModelForSequenceClassification.from_pretrained(bert_dir)
                self.bert_model.eval()
                self.available_models.append("bert")
                print(f"  [OK] Transformer model loaded from {bert_dir}")
            except Exception as e:
                print(f"  [WARN] Could not load transformer model: {e}")

        if not self.available_models:
            print("  [WARN] No models found! Train a model first with train_healthguard.py")

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text for NLP processing."""
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

    def predict_baseline(self, text: str) -> dict:
        """Predict using the baseline TF-IDF + LR model."""
        if self.baseline_model is None:
            raise RuntimeError("Baseline model not loaded")

        cleaned = self.clean_text(text)
        vector = self.baseline_vectorizer.transform([cleaned])
        prediction = self.baseline_model.predict(vector)[0]
        probabilities = self.baseline_model.predict_proba(vector)[0]

        # Get top contributing words
        feature_names = self.baseline_vectorizer.get_feature_names_out()
        tfidf_scores = vector.toarray()[0]
        coefs = self.baseline_model.coef_[0]

        # Word contributions = TF-IDF weight * model coefficient
        contributions = tfidf_scores * coefs
        nonzero_idx = np.nonzero(tfidf_scores)[0]

        word_importance = []
        for idx in nonzero_idx:
            word_importance.append({
                "word": feature_names[idx],
                "contribution": float(contributions[idx]),
                "direction": "real" if contributions[idx] > 0 else "fake",
            })

        # Sort by absolute contribution
        word_importance.sort(key=lambda x: abs(x["contribution"]), reverse=True)

        return {
            "prediction": int(prediction),
            "label": "Real" if prediction == 1 else "Fake",
            "confidence": float(max(probabilities)),
            "probabilities": {
                "fake": float(probabilities[0]),
                "real": float(probabilities[1]),
            },
            "model": "baseline",
            "word_importance": word_importance[:20],
        }

    def predict_bert(self, text: str) -> dict:
        """Predict using the transformer model."""
        if self.bert_model is None:
            raise RuntimeError("Transformer model not loaded")

        import torch

        cleaned = self.clean_text(text)
        inputs = self.bert_tokenizer(
            cleaned, return_tensors="pt", truncation=True,
            max_length=256, padding=True
        )

        with torch.no_grad():
            outputs = self.bert_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1)[0]

        prediction = torch.argmax(probs).item()

        return {
            "prediction": prediction,
            "label": "Real" if prediction == 1 else "Fake",
            "confidence": float(probs[prediction]),
            "probabilities": {
                "fake": float(probs[0]),
                "real": float(probs[1]),
            },
            "model": "bert",
            "word_importance": [],  # SHAP needed for transformer explanations
        }

    def predict(self, text: str, model_name: str = "auto") -> dict:
        """
        Predict using the specified model.
        'auto' picks the best available model (bert > baseline).
        """
        if model_name == "auto":
            if "bert" in self.available_models:
                model_name = "bert"
            elif "baseline" in self.available_models:
                model_name = "baseline"
            else:
                raise RuntimeError("No models available. Train a model first.")

        if model_name == "baseline":
            return self.predict_baseline(text)
        elif model_name == "bert":
            return self.predict_bert(text)
        else:
            raise ValueError(f"Unknown model: {model_name}")

    def get_metrics(self) -> dict:
        """Load saved evaluation metrics."""
        metrics = {}

        # Try combined metrics first
        combined_path = os.path.join(OUTPUTS_DIR, "metrics.json")
        if os.path.exists(combined_path):
            with open(combined_path) as f:
                return json.load(f)

        # Otherwise load individual metrics
        for name in ["baseline", "bert"]:
            path = os.path.join(OUTPUTS_DIR, f"metrics_{name}.json")
            if os.path.exists(path):
                with open(path) as f:
                    metrics[name] = json.load(f)

        return metrics

    def get_shap_features(self) -> dict:
        """Load pre-computed SHAP top features."""
        path = os.path.join(OUTPUTS_DIR, "shap_top_features.json")
        if os.path.exists(path):
            with open(path) as f:
                return json.load(f)
        return {}

import pickle
import os
import numpy as np
from services.text_processor import clean_text
from config import HEALTH_MODEL_DIR_PRIMARY, HEALTH_MODEL_DIR_FALLBACK


class FakeNewsPredictor:
    """Singleton ML service — loads the health-trained model and vectorizer.
    
    Primary:  Model/baseline/  (10,000 features — CoAID + FakeHealth health corpus)
    Fallback: backend/ml/      (5,000 features  — old Reuters political corpus, WARNING)
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        # Try primary path first (health-trained, 10k features)
        primary_model = os.path.join(HEALTH_MODEL_DIR_PRIMARY, "model.pkl")
        primary_vec   = os.path.join(HEALTH_MODEL_DIR_PRIMARY, "vectorizer.pkl")

        if os.path.exists(primary_model) and os.path.exists(primary_vec):
            model_path      = primary_model
            vectorizer_path = primary_vec
            self.model_dir  = HEALTH_MODEL_DIR_PRIMARY
            self._using_fallback = False
        else:
            # Fallback — loud warning
            fallback_model = os.path.join(HEALTH_MODEL_DIR_FALLBACK, "model.pkl")
            fallback_vec   = os.path.join(HEALTH_MODEL_DIR_FALLBACK, "vectorizer.pkl")
            print(
                "\n" + "=" * 70 +
                "\n[ML] WARNING: Health-trained model NOT found at:\n"
                f"   {primary_model}\n"
                "[ML] Falling back to OLD POLITICAL CORPUS model (backend/ml/).\n"
                "[ML] Results will be UNRELIABLE for health news.\n"
                "[ML] Please ensure Model/baseline/model.pkl exists.\n" +
                "=" * 70 + "\n"
            )
            model_path      = fallback_model
            vectorizer_path = fallback_vec
            self.model_dir  = HEALTH_MODEL_DIR_FALLBACK
            self._using_fallback = True

        print(f"[ML] Loading model      : {model_path}")
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

        print(f"[ML] Loading vectorizer : {vectorizer_path}")
        with open(vectorizer_path, "rb") as f:
            self.vectorizer = pickle.load(f)

        self.n_features = len(self.vectorizer.vocabulary_)
        self._initialized = True

        status = "[FALLBACK - political corpus]" if self._using_fallback else "[OK - health-trained]"
        print(
            "[ML] Model loaded " + status + " | "
            "n_features=" + str(self.n_features) + " | "
            "dir=" + str(self.model_dir) + "\n"
        )


    def predict(self, text: str) -> dict:
        """Run prediction on input text.
        
        Returns dict with prediction label, confidence, and probabilities.
        Label mapping matches train.py: 0 = fake, 1 = real.
        """
        cleaned = clean_text(text)
        vector = self.vectorizer.transform([cleaned]).toarray()
        proba = self.model.predict_proba(vector)[0]
        label = self.model.predict(vector)[0]

        return {
            "prediction": "real" if label == 1 else "fake",
            "confidence": round(float(max(proba)) * 100, 2),
            "fake_probability": round(float(proba[0]) * 100, 2),
            "real_probability": round(float(proba[1]) * 100, 2),
            "word_count": len(text.split()),
            "model_version": "v1"
        }

    def get_top_keywords(self, text: str, n: int = 10) -> list:
        """Extract top N keywords by TF-IDF score from the input text and assign severity."""
        cleaned = clean_text(text)
        vector = self.vectorizer.transform([cleaned])
        feature_array = self.vectorizer.get_feature_names_out()
        tfidf_scores = vector.toarray()[0]
        top_indices = tfidf_scores.argsort()[-n:][::-1]
        
        high_risk = {
            'shocking', 'conspiracy', 'scandal', 'explosive', 'secret', 'unbelievable', 
            'catastrophe', 'fraud', 'hoax', 'lying', 'exposed', 'leaked', 'hack', 'banned',
            'scam', 'arrested', 'fake', 'hiding', 'hates', 'kill', 'danger', 'warning'
        }
        moderate_risk = {
            'vaccine', 'election', 'government', 'money', 'police', 'dollar', 'biden', 
            'trump', 'modi', 'war', 'attack', 'emergency', 'protest', 'riot', 'climate',
            'breaking', 'exclusive', 'truth', 'rumor', 'claim', 'allege', 'reported'
        }

        keywords = []
        for i in top_indices:
            score = tfidf_scores[i]
            if score > 0:
                word = feature_array[i]
                word_lower = word.lower()
                if word_lower in high_risk:
                    sev = "high"
                elif word_lower in moderate_risk:
                    sev = "moderate"
                else:
                    sev = "neutral"
                keywords.append({
                    "word": word,
                    "score": round(float(score), 4),
                    "severity": sev
                })
        return keywords

    def explain_prediction(self, text: str) -> list:
        """Calculate mathematical feature contribution beta_i * x_i for explainability."""
        cleaned = clean_text(text)
        vector = self.vectorizer.transform([cleaned])
        feature_names = self.vectorizer.get_feature_names_out()
        tfidf_scores = vector.toarray()[0]
        
        coef = self.model.coef_[0]
        
        explanations = []
        for i, score in enumerate(tfidf_scores):
            if score > 0:
                contribution = coef[i] * score
                explanations.append({
                    "word": feature_names[i],
                    "contribution": round(float(contribution), 4),
                    # Positive coefficient contributions point to real (1), negative to fake (0)
                    "direction": "real" if contribution > 0 else "fake"
                })
        
        # Sort by absolute contribution magnitude descending
        explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return explanations[:5]

    def get_available_models(self) -> list:
        """Return which models are actually loaded and ready."""
        models = []
        if self.model is not None and self.vectorizer is not None:
            models.append("baseline")

        # Check if a real transformer checkpoint exists at Model/bert/
        project_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        for folder in ["Model", "model"]:
            bert_dir = os.path.join(project_dir, folder, "bert")
            if os.path.exists(os.path.join(bert_dir, "config.json")):
                try:
                    from transformers import AutoModelForSequenceClassification, AutoTokenizer
                    _ = AutoTokenizer.from_pretrained(bert_dir)
                    _ = AutoModelForSequenceClassification.from_pretrained(bert_dir)
                    if "bert" not in models:
                        models.append("bert")
                except Exception as e:
                    print(f"  [WARN] Could not load transformer model from {bert_dir}: {e}")
                break
        return models


# Global singleton instance
predictor = FakeNewsPredictor()

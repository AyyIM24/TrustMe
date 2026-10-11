"""
nli_service.py — TrustMe AI v2 Natural Language Inference Service

Provides zero-shot stance / entailment checking between evidence passages (premise)
and health assertions (hypothesis).
Singleton pattern with lazy loading.
Dynamically resolves label mappings from AutoConfig / id2label to avoid index bugs.
"""

import os
import logging
from typing import List, Tuple, Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)


class NLIService:
    """Singleton NLI service for cross-encoder entailment classification."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._model = None
        self._tokenizer = None
        self._label_mapping = None  # maps "entailment", "neutral", "contradiction" to output logit indices
        self._ready = False
        self._initialized = True

    def load(self):
        """Lazy load the NLI model and tokenizer."""
        if self._ready:
            return

        try:
            from config import NLI_MODEL, NLI_MODEL_FALLBACKS
        except ImportError:
            NLI_MODEL = "cross-encoder/nli-deberta-v3-base"
            NLI_MODEL_FALLBACKS = [
                "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
                "facebook/bart-large-mnli"
            ]

        models_to_try = [NLI_MODEL] + NLI_MODEL_FALLBACKS

        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        import torch

        for model_name in models_to_try:
            try:
                logger.info("[NLI] Loading model '%s'...", model_name)
                tokenizer = AutoTokenizer.from_pretrained(model_name)
                model = AutoModelForSequenceClassification.from_pretrained(model_name)
                model.eval()

                # Dynamically resolve label map from model.config.id2label
                id2label = model.config.id2label
                label_mapping = {}

                for idx, lbl_raw in id2label.items():
                    lbl = str(lbl_raw).strip().lower()
                    if "entail" in lbl:
                        label_mapping["entailment"] = int(idx)
                    elif "contradict" in lbl:
                        label_mapping["contradiction"] = int(idx)
                    elif "neutral" in lbl:
                        label_mapping["neutral"] = int(idx)

                # Ensure all 3 labels are found
                if len(label_mapping) != 3:
                    logger.warning(
                        "[NLI] Unexpected id2label format for %s: %s. Using default 0=contra, 1=neutral, 2=entail.",
                        model_name, id2label
                    )
                    label_mapping = {"contradiction": 0, "neutral": 1, "entailment": 2}

                self._model = model
                self._tokenizer = tokenizer
                self._label_mapping = label_mapping
                self._model_name = model_name
                self._ready = True
                logger.info(
                    "[NLI] Successfully loaded %s | label_map=%s",
                    model_name, self._label_mapping
                )
                break
            except Exception as e:
                logger.error("[NLI] Failed to load %s: %s", model_name, e)

        if not self._ready:
            logger.error("[NLI] CRITICAL: Could not load any NLI model.")

    def is_ready(self) -> bool:
        return self._ready

    def predict_pair(self, premise: str, hypothesis: str) -> Dict[str, float]:
        """
        Run NLI on a single (premise, hypothesis) pair.
        
        Returns:
            Dict: {"entailment": float, "neutral": float, "contradiction": float}
        """
        results = self.batch_predict([(premise, hypothesis)])
        return results[0] if results else {"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0}

    def batch_predict(self, pairs: List[Tuple[str, str]]) -> List[Dict[str, float]]:
        """
        Run NLI in batch.
        
        Args:
            pairs: List of (premise, hypothesis) tuples.
            
        Returns:
            List of score dictionaries with keys 'entailment', 'neutral', 'contradiction'.
        """
        if not self._ready:
            self.load()

        if not self._ready:
            return [{"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0} for _ in pairs]

        if not pairs:
            return []

        import torch
        import torch.nn.functional as F

        premises = [p[0] for p in pairs]
        hypotheses = [p[1] for p in pairs]

        try:
            inputs = self._tokenizer(
                premises,
                hypotheses,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt"
            )

            with torch.no_grad():
                outputs = self._model(**inputs)
                logits = outputs.logits
                probs = F.softmax(logits, dim=-1).cpu().numpy()

            results = []
            ent_idx = self._label_mapping["entailment"]
            neu_idx = self._label_mapping["neutral"]
            con_idx = self._label_mapping["contradiction"]

            for row in probs:
                results.append({
                    "entailment": float(round(row[ent_idx], 4)),
                    "neutral": float(round(row[neu_idx], 4)),
                    "contradiction": float(round(row[con_idx], 4)),
                })
            return results

        except Exception as e:
            logger.error("[NLI] Batch prediction error: %s", e)
            return [{"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0} for _ in pairs]

    def classify_stance(
        self,
        scores: Dict[str, float],
        threshold: float = 0.70,
        margin: float = 0.20
    ) -> str:
        """
        Classify stance given NLI probability distribution.
        
        Returns:
            'SUPPORTED' | 'REFUTED' | 'NOT_ENOUGH_EVIDENCE'
        """
        ent = scores.get("entailment", 0.0)
        con = scores.get("contradiction", 0.0)

        if ent >= threshold and (ent - con) >= margin:
            return "SUPPORTED"
        if con >= threshold and (con - ent) >= margin:
            return "REFUTED"
        return "NOT_ENOUGH_EVIDENCE"


# Global singleton
nli_service = NLIService()

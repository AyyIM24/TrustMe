"""
nli_service.py — TrustMe AI v2 Natural Language Inference Service

Provides zero-shot stance / entailment checking between evidence passages (premise)
and health assertions (hypothesis).
Singleton pattern with lazy loading.
Dynamically resolves label mappings from AutoConfig / id2label to avoid index bugs.

SAFETY INVARIANT: If no real NLI transformer model is available, the service
returns NEUTRAL scores (abstention), never fabricated entailment or contradiction.
A wrong "true" is far worse than an abstention.
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
        self._mode = "uninitialized"  # "transformer" or "abstain"
        self._model_name = "not loaded"
        self._initialized = True

    def load(self):
        """
        Load the NLI transformer model.

        SAFETY: Only loads from LOCAL cache (local_files_only=True first).
        If local cache is missing, tries a network download.
        If everything fails, enters 'abstain' mode where ALL predictions
        return neutral scores — never fabricated entailment or contradiction.
        """
        if self._ready:
            return

        os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

        try:
            from config import NLI_MODEL, NLI_MODEL_FALLBACKS
        except ImportError:
            NLI_MODEL = "cross-encoder/nli-deberta-v3-base"
            NLI_MODEL_FALLBACKS = [
                "MoritzLaurer/DeBERTa-v3-base-mnli-fever-anli",
                "facebook/bart-large-mnli",
            ]

        models_to_try = [NLI_MODEL] + NLI_MODEL_FALLBACKS

        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        for model_name in models_to_try:
            # Try local first, then network
            for local_only in [True, False]:
                try:
                    tag = "local" if local_only else "network"
                    logger.info("[NLI] Loading model '%s' (%s)...", model_name, tag)
                    tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=local_only)
                    model = AutoModelForSequenceClassification.from_pretrained(model_name, local_files_only=local_only)
                    model.eval()

                    # Dynamically resolve label map from model.config.id2label
                    id2label = getattr(model.config, "id2label", {}) or {}
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
                            "[NLI] Unexpected id2label format for %s: %s. Using default.",
                            model_name, id2label
                        )
                        label_mapping = {"contradiction": 0, "neutral": 1, "entailment": 2}

                    self._model = model
                    self._tokenizer = tokenizer
                    self._label_mapping = label_mapping
                    self._model_name = model_name
                    self._mode = "transformer"
                    self._ready = True
                    logger.info(
                        "[NLI] Successfully loaded %s (%s) | label_map=%s",
                        model_name, tag, self._label_mapping
                    )
                    return
                except Exception as e:
                    logger.info("[NLI] Could not load %s (%s): %s", model_name, tag, e)

        # SAFETY: No model available → abstain mode.
        # Never fabricate NLI scores. Return neutral for everything.
        logger.warning(
            "[NLI] CRITICAL: Could not load any NLI model. Entering SAFE ABSTAIN mode. "
            "All predictions will return NOT_ENOUGH_EVIDENCE. "
            "Run: python -c \"from huggingface_hub import hf_hub_download; "
            "hf_hub_download('cross-encoder/nli-deberta-v3-base', 'model.safetensors')\" "
            "to download the model."
        )
        self._mode = "abstain"
        self._model_name = "NONE (safe abstain mode)"
        self._ready = True  # Mark as ready so we don't retry on every request

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

        if not pairs:
            return []

        # SAFETY: Abstain mode returns neutral scores — never fabricates verdicts
        if self._mode == "abstain":
            return [{"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0} for _ in pairs]

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
            # SAFETY: On error, return neutral — never fabricate
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

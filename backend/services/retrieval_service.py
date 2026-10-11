"""
retrieval_service.py — TrustMe AI v2 Semantic Passage Retrieval

Loads the pre-built passage index (data/index/) and provides cosine-similarity
search using numpy dot product (no FAISS). L2-normalised embeddings are pre-computed
so retrieval = a single matrix multiply.

API:
    retrieve(claim, disease=None, k=3) -> list[dict]

Each returned passage dict contains:
    text, source_name, url, disease, retrieved_at, similarity
"""

import os
import json
import logging
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)


class RetrievalService:
    """Singleton: loads index once, serves queries."""

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
        self._passages = []
        self._embeddings = None
        self._meta = {}
        self._ready = False
        self._initialized = True

    def load(self):
        """
        Lazy-load the index and embedding model.
        Called once at startup or on first query.
        """
        if self._ready:
            return

        try:
            from config import (
                PASSAGES_FILE, EMBEDDINGS_FILE, INDEX_META_FILE, EMBED_MODEL
            )
        except ImportError:
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            index_dir    = os.path.join(project_root, "data", "index")
            PASSAGES_FILE   = os.path.join(index_dir, "passages.jsonl")
            EMBEDDINGS_FILE = os.path.join(index_dir, "embeddings.npy")
            INDEX_META_FILE = os.path.join(index_dir, "meta.json")
            EMBED_MODEL     = "sentence-transformers/all-MiniLM-L6-v2"

        # Check index exists
        if not os.path.exists(PASSAGES_FILE) or not os.path.exists(EMBEDDINGS_FILE):
            logger.warning(
                "[Retrieval] Index not found (%s). Run scripts/build_index.py first.",
                PASSAGES_FILE,
            )
            return

        logger.info("[Retrieval] Loading passage index...")

        # Load passages
        with open(PASSAGES_FILE, "r", encoding="utf-8") as f:
            self._passages = [json.loads(line) for line in f if line.strip()]

        # Load embeddings (float32, L2-normalised)
        self._embeddings = np.load(EMBEDDINGS_FILE)

        # Load meta
        if os.path.exists(INDEX_META_FILE):
            with open(INDEX_META_FILE, "r") as f:
                self._meta = json.load(f)

        # Load sentence-transformers model
        logger.info("[Retrieval] Loading embed model: %s", EMBED_MODEL)
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(EMBED_MODEL)

        self._ready = True
        logger.info(
            "[Retrieval] Ready | passages=%d | embed_model=%s",
            len(self._passages), EMBED_MODEL,
        )

    def is_ready(self) -> bool:
        return self._ready

    def retrieve(
        self,
        claim: str,
        disease: Optional[str] = None,
        k: int = 3,
        similarity_floor: float = 0.30,
    ) -> list:
        """
        Retrieve top-k passages most similar to claim.

        Args:
            claim:            The health claim text to match.
            disease:          If provided, restrict results to this disease.
            k:                Number of top results.
            similarity_floor: Drop passages below this cosine similarity.

        Returns:
            List of passage dicts, each with 'similarity' added.
            Empty list if index not loaded or no passages above floor.
        """
        if not self._ready:
            self.load()
        if not self._ready:
            logger.warning("[Retrieval] Index not available. Returning empty.")
            return []

        # Encode claim
        claim_vec = self._model.encode([claim], convert_to_numpy=True)
        norm = np.linalg.norm(claim_vec)
        if norm > 0:
            claim_vec = claim_vec / norm
        claim_vec = claim_vec.astype(np.float32)

        # Filter by disease if requested
        if disease:
            indices = [i for i, p in enumerate(self._passages) if p.get("disease") == disease]
            if not indices:
                # Fall back to all passages if the disease has no entries
                logger.warning("[Retrieval] No passages for disease='%s'; searching all.", disease)
                indices = list(range(len(self._passages)))
        else:
            indices = list(range(len(self._passages)))

        if not indices:
            return []

        subset_emb  = self._embeddings[indices]            # (N, D)
        similarities = (subset_emb @ claim_vec.T).flatten()  # (N,)

        # Rank
        ranked_idx = np.argsort(similarities)[::-1]

        results = []
        for ridx in ranked_idx:
            sim = float(similarities[ridx])
            if sim < similarity_floor:
                break
            if len(results) >= k:
                break
            passage = dict(self._passages[indices[ridx]])
            passage["similarity"] = round(sim, 4)
            results.append(passage)

        return results

    @property
    def passage_count(self) -> int:
        return len(self._passages)

    @property
    def meta(self) -> dict:
        return self._meta


# Global singleton
retrieval_service = RetrievalService()

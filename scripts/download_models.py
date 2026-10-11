#!/usr/bin/env python3
"""
scripts/download_models.py — TrustMe AI v2 Model Pre-Cacher

Downloads and caches:
  1. sentence-transformers/all-MiniLM-L6-v2 (for semantic retrieval)
  2. cross-encoder/nli-deberta-v3-base (for zero-shot stance inference)
"""

import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

from config import EMBED_MODEL, NLI_MODEL


def main():
    print("=" * 60)
    print("TrustMe AI v2 — Pre-caching Hugging Face Models")
    print(f"Embedding model : {EMBED_MODEL}")
    print(f"NLI model       : {NLI_MODEL}")
    print("=" * 60)

    print("\n[1/2] Loading Embedding Model...")
    from sentence_transformers import SentenceTransformer
    SentenceTransformer(EMBED_MODEL)
    print("      Embedding model cached successfully.")

    print("\n[2/2] Loading NLI Model...")
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    AutoTokenizer.from_pretrained(NLI_MODEL)
    AutoModelForSequenceClassification.from_pretrained(NLI_MODEL)
    print("      NLI model cached successfully.")

    print("\nAll models ready for TrustMe AI v2.")


if __name__ == "__main__":
    main()

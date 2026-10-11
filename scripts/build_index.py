#!/usr/bin/env python3
"""
scripts/build_index.py — TrustMe AI v2 Passage Index Builder

Reads all corpus .md files, chunks them into 2-3 sentence passages (<= 120 words),
embeds them with sentence-transformers, and saves:
  data/index/passages.jsonl   — passage metadata + text
  data/index/embeddings.npy   — float32 L2-normalized embeddings
  data/index/meta.json        — build metadata

Usage:
    python scripts/build_index.py
"""

import sys
import os
import re
import json
import hashlib
import time
import glob
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

import numpy as np

try:
    from config import (
        CORPUS_DIR, INDEX_DIR, PASSAGES_FILE, EMBEDDINGS_FILE,
        INDEX_META_FILE, EMBED_MODEL, SUPPORTED_DISEASES
    )
except ImportError:
    CORPUS_DIR      = os.path.join(PROJECT_ROOT, "data", "corpus")
    INDEX_DIR       = os.path.join(PROJECT_ROOT, "data", "index")
    PASSAGES_FILE   = os.path.join(INDEX_DIR, "passages.jsonl")
    EMBEDDINGS_FILE = os.path.join(INDEX_DIR, "embeddings.npy")
    INDEX_META_FILE = os.path.join(INDEX_DIR, "meta.json")
    EMBED_MODEL     = "sentence-transformers/all-MiniLM-L6-v2"
    SUPPORTED_DISEASES = ["covid19", "tuberculosis", "dengue", "diabetes"]

MAX_PASSAGE_WORDS = 120
SENTENCES_PER_PASSAGE = 2  # min; up to 3 if next sentence is short


def sentence_split(text: str) -> list:
    """Split text into sentences using regex (robust, no NLTK dependency for the script)."""
    # Split on sentence-ending punctuation followed by whitespace
    raw = re.split(r"(?<=[.!?])\s+", text)
    sentences = []
    for s in raw:
        s = s.strip()
        if len(s) >= 15:  # skip very short fragments
            sentences.append(s)
    return sentences


def parse_md_file(filepath: str) -> dict | None:
    """Parse a corpus .md file. Returns dict with metadata + text, or None on error."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract YAML front matter
    if not content.startswith("---"):
        return None

    end = content.find("---", 3)
    if end == -1:
        return None

    front_matter_text = content[3:end].strip()
    body = content[end + 3:].strip()

    # Parse front matter manually (avoid extra yaml import requirement)
    meta = {}
    for line in front_matter_text.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip().strip('"').strip("'")

    if not meta.get("url") or not meta.get("disease"):
        return None

    return {
        "source_name": meta.get("source_name", "Unknown"),
        "source_type": meta.get("source_type", "official_page"),
        "url": meta["url"],
        "disease": meta["disease"],
        "retrieved_at": meta.get("retrieved_at", ""),
        "text": body,
    }


def make_passages(doc: dict) -> list:
    """Chunk a document into 2-3 sentence passages of <= MAX_PASSAGE_WORDS words."""
    sentences = sentence_split(doc["text"])
    passages = []
    i = 0
    while i < len(sentences):
        # Start a new passage with 2 sentences
        chunk_sents = sentences[i:i + SENTENCES_PER_PASSAGE]
        chunk_text = " ".join(chunk_sents)

        # Optionally include a 3rd sentence if still under word limit
        if (i + SENTENCES_PER_PASSAGE < len(sentences)):
            candidate = chunk_text + " " + sentences[i + SENTENCES_PER_PASSAGE]
            if len(candidate.split()) <= MAX_PASSAGE_WORDS:
                chunk_text = candidate
                chunk_sents = sentences[i:i + SENTENCES_PER_PASSAGE + 1]

        word_count = len(chunk_text.split())
        if word_count >= 10:  # skip trivially short passages
            passages.append({
                "text": chunk_text,
                "source_name": doc["source_name"],
                "source_type": doc.get("source_type", "official_page"),
                "url": doc["url"],
                "disease": doc["disease"],
                "retrieved_at": doc["retrieved_at"],
                "word_count": word_count,
            })
        i += len(chunk_sents)

    return passages


def corpus_hash() -> str:
    """Compute a hash of all corpus file contents for reproducibility."""
    md5 = hashlib.md5()
    for fpath in sorted(glob.glob(os.path.join(CORPUS_DIR, "**", "*.md"), recursive=True)):
        with open(fpath, "rb") as f:
            md5.update(f.read())
    return md5.hexdigest()[:12]


def build_index():
    print("=" * 60)
    print("TrustMe AI v2 — Index Builder")
    print(f"Corpus dir : {CORPUS_DIR}")
    print(f"Index dir  : {INDEX_DIR}")
    print(f"Embed model: {EMBED_MODEL}")
    print("=" * 60)

    os.makedirs(INDEX_DIR, exist_ok=True)

    # Step 1: Collect all corpus files
    md_files = sorted(glob.glob(os.path.join(CORPUS_DIR, "**", "*.md"), recursive=True))
    print(f"\n[1/4] Found {len(md_files)} corpus files")

    if not md_files:
        print("ERROR: No corpus files found. Run build_corpus.py first.")
        sys.exit(1)

    # Step 2: Parse and chunk
    all_passages = []
    disease_counts = {}
    failed_files = []

    for fpath in md_files:
        doc = parse_md_file(fpath)
        if doc is None:
            failed_files.append(fpath)
            continue

        disease = doc["disease"]
        passages = make_passages(doc)
        all_passages.extend(passages)
        disease_counts[disease] = disease_counts.get(disease, 0) + len(passages)

    print(f"[2/4] Chunked into {len(all_passages)} passages")
    for d, c in disease_counts.items():
        print(f"       {d}: {c} passages")
    if failed_files:
        print(f"       {len(failed_files)} files failed to parse")

    if len(all_passages) < 50:
        print("ERROR: Too few passages. Check corpus files.")
        sys.exit(1)

    # Step 3: Embed
    print(f"\n[3/4] Loading embedding model: {EMBED_MODEL}")
    print("      (First run downloads ~90 MB; subsequent runs use cache)")
    t0 = time.time()

    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(EMBED_MODEL)

    texts = [p["text"] for p in all_passages]
    print(f"      Encoding {len(texts)} passages...")
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True, convert_to_numpy=True)

    # L2-normalize for cosine similarity via dot product
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1, norms)
    embeddings = (embeddings / norms).astype(np.float32)

    elapsed = time.time() - t0
    print(f"      Done in {elapsed:.1f}s | shape={embeddings.shape}")

    # Step 4: Save
    print(f"\n[4/4] Saving index to {INDEX_DIR}")

    # passages.jsonl
    with open(PASSAGES_FILE, "w", encoding="utf-8") as f:
        for p in all_passages:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    # embeddings.npy
    np.save(EMBEDDINGS_FILE, embeddings)

    # meta.json
    chash = corpus_hash()
    meta = {
        "embed_model": EMBED_MODEL,
        "passage_count": len(all_passages),
        "disease_counts": disease_counts,
        "corpus_hash": chash,
        "built_at": datetime.utcnow().isoformat() + "Z",
        "embedding_shape": list(embeddings.shape),
    }
    with open(INDEX_META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"\n=== INDEX BUILD COMPLETE ===")
    print(f"  passages.jsonl : {len(all_passages)} passages")
    print(f"  embeddings.npy : {embeddings.shape}")
    print(f"  corpus_hash    : {chash}")
    print(f"  meta.json      : {INDEX_META_FILE}")
    print(f"  PASS: >= 300 passages? {'YES' if len(all_passages) >= 300 else 'NO — need more corpus pages'}")
    print("=" * 60)


if __name__ == "__main__":
    build_index()

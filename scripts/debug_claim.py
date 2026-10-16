"""
debug_claim.py — Trace every step of the TrustMe AI v2 verification pipeline
for a single claim.  Prints retrieved passages, similarity scores, sentence-level
NLI entailment/contradiction/neutral, and the final stance.

Usage:
    python scripts/debug_claim.py "Tuberculosis spreads by sharing food and utensils."
    python scripts/debug_claim.py "There is a specific medicine that cures dengue within one day."
"""

import sys, os, re, json, time
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


# Ensure backend/ is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.claim_extractor import extract_claims, detect_disease_context
from services.retrieval_service import retrieval_service
from services.nli_service import nli_service
from services.disease_kb import DISEASE_KB
from config import SUPPORTED_DISEASES, SIMILARITY_FLOOR, NLI_DECISION, NLI_MARGIN, RETRIEVAL_TOP_K

# Sentence splitter (same as verification_service)
def split_into_sentence_chunks(text, min_words=4):
    raw = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9\"\u2018\u2019\u201c])', text.strip())
    sentences = [s.strip() for s in raw if len(s.strip().split()) >= min_words]
    if not sentences:
        return [text.strip()] if text.strip() else []
    chunks = list(sentences)
    for i in range(len(sentences) - 1):
        chunks.append(sentences[i] + " " + sentences[i + 1])
    seen, unique = set(), []
    for c in chunks:
        key = c[:80]
        if key not in seen:
            seen.add(key)
            unique.append(c)
    return unique


def debug_claim(claim_text):
    print("=" * 80)
    print(f"CLAIM: {claim_text}")
    print("=" * 80)

    # ── Disease detection ─────────────────────────────────────────────
    disease = detect_disease_context(claim_text)
    print(f"\n[1] Disease Detected: {disease}")

    if disease not in SUPPORTED_DISEASES:
        print(f"  → OUT_OF_SCOPE (supported: {SUPPORTED_DISEASES})")
        return

    # ── Known myth check ─────────────────────────────────────────────
    if disease in DISEASE_KB:
        kb = DISEASE_KB[disease]
        claim_lower = claim_text.lower()
        matched_myths = []
        for myth in kb["myths"]:
            myth_tokens = [t for t in myth.lower().split() if len(t) > 2]
            match_count = sum(1 for t in myth_tokens if t in claim_lower)
            if match_count >= max(2, len(myth_tokens) - 1):
                matched_myths.append(myth)
        if matched_myths:
            print(f"  ⚠  KNOWN MYTH MATCH: {matched_myths}")
        else:
            print(f"  ✓  No myth match in disease_kb")

    # ── Claim extraction ─────────────────────────────────────────────
    claims = extract_claims(claim_text, disease=disease)
    print(f"\n[2] Extracted Claims ({len(claims)}):")
    for i, c in enumerate(claims):
        print(f"    [{i}] {c}")
    if not claims:
        print("    → No verifiable claims extracted → UNVERIFIED")
        return

    # ── Load services ─────────────────────────────────────────────────
    retrieval_service.load()
    nli_service.load()
    print(f"\n[3] NLI Service Mode: {nli_service._mode}")
    print(f"    NLI Model: {nli_service._model_name}")

    # ── Process each claim ────────────────────────────────────────────
    for ci, claim in enumerate(claims):
        print(f"\n{'─' * 70}")
        print(f"CLAIM [{ci}]: {claim}")
        print(f"{'─' * 70}")

        # Retrieve
        t0 = time.time()
        passages = retrieval_service.retrieve(
            claim=claim, disease=disease, k=RETRIEVAL_TOP_K, similarity_floor=SIMILARITY_FLOOR
        )
        t_retrieve = time.time() - t0
        print(f"\n  [4] Retrieved {len(passages)} passages (in {t_retrieve:.3f}s)")

        if not passages:
            print("    → No passages above similarity floor → NOT_ENOUGH_EVIDENCE")
            continue

        for pi, p in enumerate(passages):
            passage_text = p.get("text", "")
            sim = p.get("similarity", 0.0)
            source = p.get("source_name", "?")
            print(f"\n  ── Passage [{pi}] sim={sim:.4f} src={source}")
            print(f"     Text: {passage_text[:200]}{'...' if len(passage_text) > 200 else ''}")

            # Passage-level NLI
            p_scores = nli_service.predict_pair(passage_text, claim)
            print(f"     Passage NLI: ent={p_scores['entailment']:.4f}  con={p_scores['contradiction']:.4f}  neu={p_scores['neutral']:.4f}")

            # Sentence-level NLI
            chunks = split_into_sentence_chunks(passage_text)
            if not chunks:
                chunks = [passage_text]
            if passage_text not in chunks:
                chunks.append(passage_text)

            pairs = [(chunk, claim) for chunk in chunks]
            t1 = time.time()
            chunk_scores = nli_service.batch_predict(pairs)
            t_nli = time.time() - t1

            print(f"     Sentence chunks: {len(chunks)} (NLI in {t_nli:.3f}s)")

            for si, (chunk, scores) in enumerate(zip(chunks, chunk_scores)):
                ent = scores["entailment"]
                con = scores["contradiction"]
                neu = scores["neutral"]
                stance = nli_service.classify_stance(scores, threshold=NLI_DECISION, margin=NLI_MARGIN)

                # Apply context-coherence guard
                original_stance = stance
                if stance == "REFUTED" and p_scores["contradiction"] < 0.15:
                    stance = "NOT_ENOUGH_EVIDENCE (context guard)"
                if stance == "SUPPORTED" and p_scores["entailment"] < 0.15:
                    stance = "NOT_ENOUGH_EVIDENCE (context guard)"

                marker = ""
                if "SUPPORTED" in stance:
                    marker = " ★★★ SUPPORTED"
                elif "REFUTED" in stance:
                    marker = " ✘✘✘ REFUTED"

                print(f"       [{si}] ent={ent:.4f} con={con:.4f} neu={neu:.4f}  → {stance}{marker}")
                if marker:
                    print(f"           Sentence: {chunk[:150]}{'...' if len(chunk) > 150 else ''}")

        print()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_claim(sys.argv[1])
    else:
        # Default test claims
        test_claims = [
            "Tuberculosis spreads by sharing food and utensils.",
            "There is a specific medicine that cures dengue within one day.",
            "Dengue is spread by the bite of infected Aedes mosquitoes.",
            "COVID-19 is caused by a virus.",
        ]
        for claim in test_claims:
            debug_claim(claim)
            print("\n\n")

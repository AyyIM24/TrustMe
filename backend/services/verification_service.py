"""
verification_service.py — TrustMe AI v2 Evidence-Based Verification Pipeline

Single authority for factual health claim verification:
  1. Disease scoping (COVID-19, Tuberculosis, Dengue, Diabetes)
  2. Claim extraction (claim_extractor)
  3. Passage retrieval (retrieval_service)
  4. Sentence-level NLI stance inference (nli_service)
  5. Multi-claim aggregation -> Article verdict (RELIABLE | PARTIALLY_VERIFIED | MISLEADING | UNVERIFIED | OUT_OF_SCOPE)

Safety Invariants:
  - Asymmetric safety rules: SUPPORTED must be hard to get; REFUTED/abstain easy.
  - Zero false health claims labelled SUPPORTED / RELIABLE.
  - Content-word sanity check & Negation check act as strict vetos.
  - Known-myth veto: claims matching curated myth list can never be SUPPORTED.
  - RELIABLE only if EVERY extracted claim is SUPPORTED.
"""

import re
import logging
from typing import List, Dict, Any, Optional
import numpy as np

from config import SUPPORTED_DISEASES, SIMILARITY_FLOOR, RETRIEVAL_TOP_K
from schemas.analysis import VerificationResult, ClaimResult, Evidence, NLIScores
from services.claim_extractor import extract_claims, detect_disease_context
from services.retrieval_service import retrieval_service
from services.nli_service import nli_service
from services.disease_kb import check_known_myth_veto

logger = logging.getLogger(__name__)


# ── Sentence Splitting ────────────────────────────────────────────────────────

def _split_into_single_sentences(text: str, min_words: int = 3) -> List[str]:
    """
    Split a passage into individual single sentences.
    """
    if not text or not text.strip():
        return []
    raw = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9\"\u2018\u2019\u201c])', text.strip())
    sentences = [s.strip() for s in raw if len(s.strip().split()) >= min_words]
    return sentences if sentences else [text.strip()]


# ── Negation Check ────────────────────────────────────────────────────────────

_NEGATION_WORDS = {
    "not", "no", "never", "cannot", "cant", "can't",
    "wont", "won't", "dont", "don't", "doesnt", "doesn't",
    "didnt", "didn't", "isnt", "isn't", "arent", "aren't",
    "wasnt", "wasn't", "werent", "weren't", "neither", "nor", "without"
}


def _has_negation(text: str) -> bool:
    """
    Detect if text contains negation words or phrases.
    """
    tokens = set(re.findall(r"\b[a-z']+\b", text.lower()))
    if any(neg in tokens for neg in _NEGATION_WORDS):
        return True
    t_low = text.lower()
    if any(p in t_low for p in ["does not", "do not", "is not", "are not", "did not", "cannot"]):
        return True
    return False


# ── Content-Word Sanity Check ─────────────────────────────────────────────────

_CONTENT_STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "by", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below",
    "to", "from", "up", "down", "out", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
    "don", "should", "now", "is", "am", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "having", "do", "does", "did", "doing",
    "would", "could", "shall", "might", "must", "of", "it", "its", "they",
    "them", "their", "theirs", "we", "us", "our", "ours", "you", "your",
    "yours", "he", "him", "his", "she", "her", "hers", "that", "this", "these",
    "those", "one", "day", "two", "also"
}


def _extract_content_stems(text: str) -> set:
    try:
        from nltk.stem import PorterStemmer
        stemmer = PorterStemmer()
        stem_fn = stemmer.stem
    except Exception:
        stem_fn = lambda w: w

    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    stems = {stem_fn(w) for w in words if w not in _CONTENT_STOPWORDS}
    return stems


def _content_word_overlap(sentence: str, claim: str) -> float:
    """
    Compute overlap ratio: proportion of claim's content word stems present in sentence.
    """
    claim_stems = _extract_content_stems(claim)
    if not claim_stems:
        return 1.0
    sent_stems = _extract_content_stems(sentence)
    overlap = len(claim_stems.intersection(sent_stems)) / len(claim_stems)
    return overlap


# ── Sentence Similarity ───────────────────────────────────────────────────────

def _compute_sentence_similarity(sentence: str, claim: str) -> float:
    """
    Compute semantic cosine similarity between single supporting sentence and claim.
    """
    try:
        if not retrieval_service.is_ready():
            retrieval_service.load()
        if retrieval_service._model is not None:
            emb1 = retrieval_service._model.encode(sentence)
            emb2 = retrieval_service._model.encode(claim)
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)
            if norm1 > 0 and norm2 > 0:
                return float(np.dot(emb1, emb2) / (norm1 * norm2))
    except Exception as e:
        logger.warning("[Verification] Failed to compute sentence similarity: %s", e)
    return 0.0


# ── Verification Service ──────────────────────────────────────────────────────

class VerificationService:
    """End-to-end evidence-based verification engine with asymmetric safety."""

    def verify_article(
        self,
        text: str,
        title: Optional[str] = None,
        disease_hint: Optional[str] = None
    ) -> VerificationResult:
        """
        Verify an article or statement using authentic corpus evidence and NLI.
        """
        full_text = f"{title}\n{text}" if title else text
        steps = []

        # ── Step 1: Disease Scoping ──────────────────────────────────────────
        detected_disease = disease_hint or detect_disease_context(full_text)
        steps.append(
            f"Step 1: Disease Scoping — Detected '{detected_disease or 'None'}'"
        )

        if not detected_disease or detected_disease not in SUPPORTED_DISEASES:
            return VerificationResult(
                verdict="OUT_OF_SCOPE",
                confidence=0.0,
                disease=detected_disease,
                claims=[],
                summary=(
                    "This content is outside the supported health domain scope. "
                    "TrustMe AI v2 currently verifies COVID-19, Tuberculosis, "
                    "Dengue, and Diabetes claims against authentic medical guidelines."
                ),
                steps=steps,
                known_myth_match=None,
            )

        # ── Step 2: Check global known myths for article callout ─────────────
        myth_match = check_known_myth_veto(full_text, detected_disease)
        if myth_match:
            steps.append(
                f"Step 2: Knowledge Base Check — Matched known myth: '{myth_match.get('myth', '')}'"
            )
        else:
            steps.append("Step 2: Knowledge Base Check — No static myth pattern matched")

        # ── Step 3: Extract verifiable claims ────────────────────────────────
        extracted_claims = extract_claims(full_text, disease=detected_disease)
        steps.append(
            f"Step 3: Claim Extraction — Extracted {len(extracted_claims)} verifiable candidate claims"
        )

        if not extracted_claims:
            return VerificationResult(
                verdict="UNVERIFIED",
                confidence=0.0,
                disease=detected_disease,
                claims=[],
                summary="No verifiable medical claims found in this text. It may be a news report, "
                        "case count, or administrative update rather than a medical assertion. "
                        "TrustMe AI v2 only verifies declarative health claims.",
                steps=steps,
                known_myth_match=myth_match,
            )

        # ── Step 4 & 5: Passage Retrieval & Sentence-Level NLI ───────────────
        steps.append("Step 4 & 5: Passage Retrieval & Sentence-Level NLI with Asymmetric Safety Rules")

        claim_results: List[ClaimResult] = []

        for claim in extracted_claims:
            # 4.1 Check Known-Myth Veto for this specific claim
            claim_myth = check_known_myth_veto(claim, detected_disease)

            # Retrieve top passages for this claim
            passages = retrieval_service.retrieve(
                claim=claim,
                disease=detected_disease,
                k=RETRIEVAL_TOP_K,
                similarity_floor=SIMILARITY_FLOOR,
            )

            if not passages and not claim_myth:
                # No passages passed similarity floor and no myth veto
                claim_results.append(
                    ClaimResult(
                        claim=claim,
                        stance="NOT_ENOUGH_EVIDENCE",
                        confidence=0.0,
                        evidence=[],
                        nli_scores=NLIScores(entailment=0.0, contradiction=0.0, neutral=1.0),
                        badge=None,
                    )
                )
                continue

            # ── Sentence-Level NLI Across Retrieved Passages ─────────────────
            # Premise = single sentence from authoritative guideline
            # Hypothesis = claim
            evidence_items: List[Evidence] = []
            all_sentence_candidates = []

            for p in passages:
                passage_text = p.get("text", "")
                sentences = _split_into_single_sentences(passage_text)

                if not sentences:
                    sentences = [passage_text]

                pairs = [(s, claim) for s in sentences]
                sentence_scores = nli_service.batch_predict(pairs)

                best_sent_for_passage = sentences[0]
                best_score_for_passage = -1.0

                for s, scores in zip(sentences, sentence_scores):
                    cand = {
                        "sentence": s,
                        "scores": scores,
                        "entailment": scores["entailment"],
                        "contradiction": scores["contradiction"],
                        "neutral": scores["neutral"],
                        "passage": p,
                    }
                    all_sentence_candidates.append(cand)

                    # For quote display in passage, prioritize highest salient signal
                    salient = max(scores["entailment"], scores["contradiction"])
                    if salient > best_score_for_passage:
                        best_score_for_passage = salient
                        best_sent_for_passage = s

                evidence_items.append(
                    Evidence(
                        passage=passage_text,
                        source_name=p.get("source_name", "Authoritative Source"),
                        url=p.get("url", ""),
                        similarity=float(p.get("similarity", 0.0)),
                        disease=p.get("disease", detected_disease),
                        source_type=p.get("source_type", "official_page"),
                        best_sentence=best_sent_for_passage,
                    )
                )

            # Max entailment and max contradiction over all sentences
            max_contradiction = max((c["contradiction"] for c in all_sentence_candidates), default=0.0)
            best_contra_cand = max(all_sentence_candidates, key=lambda c: c["contradiction"], default=None)
            best_entail_cand = max(all_sentence_candidates, key=lambda c: c["entailment"], default=None)

            # ── Apply Asymmetric Safety Rules ────────────────────────────────
            # Priority 1: Known-myth veto -> MUST NEVER BE SUPPORTED. Returns REFUTED.
            if claim_myth:
                claim_stance = "REFUTED"
                claim_conf = 0.95
                claim_badge = "Known myth (curated)"
                if best_contra_cand:
                    best_scores = best_contra_cand["scores"]
                else:
                    best_scores = {"entailment": 0.0, "contradiction": 0.95, "neutral": 0.05}

            # Priority 2: Evidence-based REFUTED
            elif (
                best_contra_cand is not None
                and best_contra_cand["contradiction"] >= 0.70
                and (best_contra_cand["contradiction"] - best_contra_cand["entailment"]) >= 0.20
            ):
                claim_stance = "REFUTED"
                claim_conf = round(best_contra_cand["contradiction"], 4)
                claim_badge = None
                best_scores = best_contra_cand["scores"]

            # Priority 3: SUPPORTED — Extremely strict criteria:
            # - best entailment >= 0.90
            # - (entailment - contradiction) >= 0.50
            # - supporting sentence similarity to the claim >= 0.55
            # - NO retrieved sentence has contradiction >= 0.30
            # - Content-word sanity check >= 0.60 overlap
            # - Negation check: claim and supporting sentence have matching negation polarity
            elif best_entail_cand is not None and best_entail_cand["entailment"] >= 0.90:
                supporting_sentence = best_entail_cand["sentence"]
                ent_score = best_entail_cand["entailment"]
                corr_con = best_entail_cand["contradiction"]
                sent_sim = _compute_sentence_similarity(supporting_sentence, claim)
                cw_overlap = _content_word_overlap(supporting_sentence, claim)
                claim_has_neg = _has_negation(claim)
                sent_has_neg = _has_negation(supporting_sentence)

                logger.info(
                    "[Verification Safety] Evaluating support for '%s': "
                    "ent=%.4f con=%.4f max_con=%.4f sim=%.4f cw_overlap=%.2f "
                    "claim_neg=%s sent_neg=%s",
                    claim[:50], ent_score, corr_con, max_contradiction, sent_sim,
                    cw_overlap, claim_has_neg, sent_has_neg
                )

                support_valid = (
                    (ent_score - corr_con) >= 0.50
                    and sent_sim >= 0.55
                    and max_contradiction < 0.30
                    and cw_overlap >= 0.60
                    and (claim_has_neg == sent_has_neg)
                )

                if support_valid:
                    claim_stance = "SUPPORTED"
                    claim_conf = round(ent_score, 4)
                    claim_badge = None
                    best_scores = best_entail_cand["scores"]
                else:
                    # Vetoed by one of the safety invariants -> abstain
                    claim_stance = "NOT_ENOUGH_EVIDENCE"
                    claim_conf = 0.0
                    claim_badge = None
                    best_scores = best_entail_cand["scores"]

            else:
                claim_stance = "NOT_ENOUGH_EVIDENCE"
                claim_conf = 0.0
                claim_badge = None
                if best_entail_cand and best_contra_cand:
                    best_scores = best_entail_cand["scores"] if best_entail_cand["entailment"] >= best_contra_cand["contradiction"] else best_contra_cand["scores"]
                else:
                    best_scores = {"entailment": 0.0, "contradiction": 0.0, "neutral": 1.0}

            # Update evidence best_sentence to reflect the claim verdict
            if claim_stance == "SUPPORTED" and best_entail_cand:
                for ev in evidence_items:
                    if best_entail_cand["sentence"] in ev.passage:
                        ev.best_sentence = best_entail_cand["sentence"]
            elif claim_stance == "REFUTED" and best_contra_cand:
                for ev in evidence_items:
                    if best_contra_cand["sentence"] in ev.passage:
                        ev.best_sentence = best_contra_cand["sentence"]

            claim_results.append(
                ClaimResult(
                    claim=claim,
                    stance=claim_stance,
                    confidence=claim_conf,
                    evidence=evidence_items,
                    nli_scores=NLIScores(**best_scores),
                    badge=claim_badge,
                )
            )

        # ── Step 6: Multi-Claim Aggregation into Article Verdict ──────────────
        # Rule 1: Any REFUTED -> MISLEADING
        # Rule 2: RELIABLE ONLY if EVERY extracted claim is SUPPORTED
        # Rule 3: Mix of SUPPORTED + NOT_ENOUGH_EVIDENCE -> PARTIALLY_VERIFIED
        # Rule 4: All NOT_ENOUGH_EVIDENCE -> UNVERIFIED
        refuted_count = sum(1 for c in claim_results if c.stance == "REFUTED")
        supported_count = sum(1 for c in claim_results if c.stance == "SUPPORTED")
        total_claims = len(claim_results)

        if refuted_count > 0:
            article_verdict = "MISLEADING"
            refuted_confs = [c.confidence for c in claim_results if c.stance == "REFUTED"]
            article_confidence = round(sum(refuted_confs) / len(refuted_confs), 4)
            summary = (
                f"Contains {refuted_count} refuted health assertion{'s' if refuted_count > 1 else ''} "
                f"contradicted by authoritative guidelines from WHO, CDC, or MoHFW."
            )
        elif supported_count == total_claims and total_claims > 0:
            article_verdict = "RELIABLE"
            supp_confs = [c.confidence for c in claim_results if c.stance == "SUPPORTED"]
            article_confidence = round(sum(supp_confs) / len(supp_confs), 4)
            summary = (
                f"All {total_claims} verifiable health assertions are directly supported "
                f"by authentic medical literature from official health bodies."
            )
        elif supported_count > 0:
            article_verdict = "PARTIALLY_VERIFIED"
            article_confidence = 0.0
            summary = (
                f"{supported_count} of {total_claims} claims verified. Some claims could not be verified "
                f"against authoritative medical guidelines."
            )
        else:
            article_verdict = "UNVERIFIED"
            article_confidence = 0.0
            summary = (
                f"Authoritative medical guidelines provide insufficient matching evidence to conclusively "
                f"verify or refute the {total_claims} extracted claims."
            )

        return VerificationResult(
            verdict=article_verdict,
            confidence=article_confidence,
            disease=detected_disease,
            claims=claim_results,
            summary=summary,
            steps=steps,
            known_myth_match=myth_match,
            method={
                "retrieval_model": "sentence-transformers/all-MiniLM-L6-v2",
                "nli_model": nli_service._model_name if nli_service.is_ready() else "cross-encoder/nli-deberta-v3-base",
                "corpus_passages": retrieval_service.passage_count if retrieval_service.is_ready() else 482,
                "asymmetric_safety": "active",
            },
        )


# Global singleton
verification_service = VerificationService()

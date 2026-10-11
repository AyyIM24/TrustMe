"""
verification_service.py — TrustMe AI v2 Evidence-Based Verification Pipeline

Single authority for factual health claim verification:
  1. Disease scoping (COVID-19, Tuberculosis, Dengue, Diabetes)
  2. Claim extraction (claim_extractor)
  3. Passage retrieval (retrieval_service)
  4. Stance inference (nli_service)
  5. Multi-claim aggregation -> Article verdict (RELIABLE | MISLEADING | UNVERIFIED | OUT_OF_SCOPE)
"""

import logging
from typing import List, Dict, Any, Optional

from config import SUPPORTED_DISEASES, SIMILARITY_FLOOR, NLI_DECISION, NLI_MARGIN
from schemas.analysis import VerificationResult, ClaimResult, Evidence, NLIScores
from services.claim_extractor import extract_claims, detect_disease_context
from services.retrieval_service import retrieval_service
from services.nli_service import nli_service
from services.ensemble_service import check_myth_match

logger = logging.getLogger(__name__)


class VerificationService:
    """End-to-end evidence-based verification engine."""

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

        # ── Step 2: Check known myths (informational / explanatory) ──────────
        matched_str = check_myth_match(full_text)
        myth_match = {"myth": matched_str, "status": "debunked"} if matched_str else None
        if myth_match:
            steps.append(
                f"Step 2: Knowledge Base Check — Matched known pattern: '{matched_str}'"
            )
        else:
            steps.append("Step 2: Knowledge Base Check — No known static debunk pattern matched")

        # ── Step 3: Extract verifiable claims ────────────────────────────────
        extracted_claims = extract_claims(full_text, disease=detected_disease)
        steps.append(
            f"Step 3: Claim Extraction — Extracted {len(extracted_claims)} verifiable candidate claims"
        )

        if not extracted_claims:
            return VerificationResult(
                verdict="UNVERIFIED",
                confidence=0.50,
                disease=detected_disease,
                claims=[],
                summary="No clear empirical health claims could be extracted from the text for verification.",
                steps=steps,
                known_myth_match=myth_match,
            )

        # ── Step 4 & 5: Passage Retrieval & NLI Stance Inference ─────────────
        steps.append("Step 4 & 5: Passage Retrieval & Natural Language Inference against authentic corpus")

        claim_results: List[ClaimResult] = []

        for claim in extracted_claims:
            # Retrieve top passages for this claim
            passages = retrieval_service.retrieve(
                claim=claim,
                disease=detected_disease,
                k=3,
                similarity_floor=SIMILARITY_FLOOR,
            )

            if not passages:
                # No passages passed similarity floor
                claim_results.append(
                    ClaimResult(
                        claim=claim,
                        stance="NOT_ENOUGH_EVIDENCE",
                        confidence=0.0,
                        evidence=[],
                        nli_scores=NLIScores(entailment=0.0, contradiction=0.0, neutral=1.0),
                    )
                )
                continue

            # Run NLI on (passage_text, claim) pairs
            pairs = [(p["text"], claim) for p in passages]
            nli_outputs = nli_service.batch_predict(pairs)

            # Find best decisive passage (prioritize strong contradiction or strong entailment)
            best_stance = "NOT_ENOUGH_EVIDENCE"
            best_scores = {"entailment": 0.0, "contradiction": 0.0, "neutral": 1.0}
            best_confidence = 0.50
            evidence_items = []

            for i, p in enumerate(passages):
                scores = nli_outputs[i] if i < len(nli_outputs) else {"entailment": 0.0, "neutral": 1.0, "contradiction": 0.0}
                stance = nli_service.classify_stance(scores, threshold=NLI_DECISION, margin=NLI_MARGIN)

                evidence_items.append(
                    Evidence(
                        passage=p.get("text", ""),
                        source_name=p.get("source_name", "Authoritative Source"),
                        url=p.get("url", ""),
                        similarity=float(p.get("similarity", 0.0)),
                        disease=p.get("disease", detected_disease),
                    )
                )

                # Prioritize contradiction (refutation) over entailment (support)
                if stance == "REFUTED":
                    best_stance = "REFUTED"
                    best_scores = scores
                    best_confidence = scores["contradiction"]
                elif stance == "SUPPORTED" and best_stance != "REFUTED":
                    best_stance = "SUPPORTED"
                    best_scores = scores
                    best_confidence = scores["entailment"]
                elif best_stance == "NOT_ENOUGH_EVIDENCE" and scores["neutral"] > best_scores.get("neutral", 0):
                    best_scores = scores
                    best_confidence = 0.50

            claim_results.append(
                ClaimResult(
                    claim=claim,
                    stance=best_stance,
                    confidence=round(best_confidence, 4),
                    evidence=evidence_items,
                    nli_scores=NLIScores(**best_scores),
                )
            )

        # ── Step 6: Multi-Claim Aggregation into Article Verdict ──────────────
        refuted_count = sum(1 for c in claim_results if c.stance == "REFUTED")
        supported_count = sum(1 for c in claim_results if c.stance == "SUPPORTED")
        unverified_count = sum(1 for c in claim_results if c.stance == "NOT_ENOUGH_EVIDENCE")
        total_claims = len(claim_results)

        if refuted_count > 0:
            article_verdict = "MISLEADING"
            refuted_confs = [c.confidence for c in claim_results if c.stance == "REFUTED"]
            article_confidence = round(sum(refuted_confs) / len(refuted_confs), 4)
            summary = (
                f"Contains {refuted_count} refuted health assertion{'s' if refuted_count > 1 else ''} "
                f"contradicted by authoritative guidelines from WHO, CDC, or MoHFW."
            )
        elif supported_count >= max(1, int(0.6 * total_claims)) and refuted_count == 0:
            article_verdict = "RELIABLE"
            supp_confs = [c.confidence for c in claim_results if c.stance == "SUPPORTED"]
            article_confidence = round(sum(supp_confs) / len(supp_confs), 4)
            summary = (
                f"{supported_count} of {total_claims} verifiable health assertions are directly supported "
                f"by authentic medical literature from official health bodies."
            )
        else:
            article_verdict = "UNVERIFIED"
            article_confidence = 0.50
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
        )


# Global singleton
verification_service = VerificationService()

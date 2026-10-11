"""
factcheck.py — Fact-Check Router with TrustMe AI v2 Evidence Pipeline

Verifies individual claims against:
1. Evidence-Based Verification Pipeline (WHO, CDC, MoHFW authentic corpus + DeBERTa NLI)
2. Knowledge Base & Wikipedia fallback for other queries
"""

import re
import asyncio
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx

from services.disease_kb import detect_disease, check_against_kb, get_all_diseases
from services.verification_service import verification_service
from schemas.analysis import VerificationResult

router = APIRouter(prefix="/factcheck", tags=["Fact Check"])


# ── Schemas ───────────────────────────────────────────────────────

class FactCheckRequest(BaseModel):
    claim: str


class EvidenceItem(BaseModel):
    source: str
    snippet: str
    url: Optional[str] = None


class AuthenticSource(BaseModel):
    name: str
    url: str


class KBResult(BaseModel):
    disease: str
    disease_display: str
    kb_verdict: str
    kb_confidence: int
    kb_explanation: str
    supporting_facts: list
    myth_signals: list
    authentic_sources: List[AuthenticSource]


class FactCheckResponse(BaseModel):
    claim: str
    verdict: str            # "LIKELY TRUE" | "LIKELY FALSE" | "UNVERIFIABLE" | "MIXED"
    verdict_color: str      # "green" | "red" | "amber" | "cyan"
    confidence: int         # 0-100
    explanation: str
    evidence: List[EvidenceItem]
    searched_topics: List[str]
    kb_result: Optional[KBResult] = None
    disease_scope: Optional[str] = None
    verification: Optional[VerificationResult] = None


# ── Wikipedia API Helper (Fallback) ──────────────────────────────

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"


async def search_wikipedia(query: str) -> Optional[dict]:
    """Search Wikipedia for a query and return the best match summary."""
    headers = {"User-Agent": "TrustMeFactChecker/2.0 (contact@trustme.ai; academic research)"}
    async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
        try:
            search_resp = await client.get(WIKI_SEARCH, params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "srlimit": 3,
            })
            if search_resp.status_code != 200:
                return None
            search_data = search_resp.json()
            results = search_data.get("query", {}).get("search", [])
            if not results:
                return None

            title = results[0]["title"]
            summary_url = f"{WIKI_API}{title.replace(' ', '_')}"
            summary_resp = await client.get(summary_url, headers={"Accept": "application/json"})
            if summary_resp.status_code == 200:
                sdata = summary_resp.json()
                return {
                    "title": title,
                    "summary": sdata.get("extract", ""),
                    "url": sdata.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{title}"),
                }
            return None
        except Exception:
            return None


def extract_key_topics(claim: str) -> List[str]:
    """Extract likely Wikipedia search topics from a claim."""
    filler = r'\b(won|win|wins|losing|lost|is|are|was|were|has|have|had|did|does|said|says|claims|reported|confirmed|allegedly|according)\b'
    cleaned = re.sub(filler, '', claim, flags=re.IGNORECASE).strip()
    words = claim.split()
    proper_nouns = []
    for i, w in enumerate(words):
        w_clean = re.sub(r'[^a-zA-Z]', '', w)
        if w_clean and w_clean[0].isupper() and i > 0:
            proper_nouns.append(w_clean)
    queries = []
    if proper_nouns:
        queries.append(' '.join(proper_nouns[:3]))
    queries.append(claim[:80])
    return list(dict.fromkeys(queries))


# ── Main Fact Check Endpoint ──────────────────────────────────────

@router.post("/check", response_model=FactCheckResponse)
async def fact_check(payload: FactCheckRequest):
    """
    Verify a health claim:
    1. Primary authority: TrustMe AI v2 Authentic Corpus + NLI Inference Pipeline
    2. Fallback: Knowledge Base + Wikipedia
    """
    claim = payload.claim.strip()
    if len(claim) < 5:
        raise HTTPException(status_code=400, detail="Claim is too short to verify")
    if len(claim) > 500:
        raise HTTPException(status_code=400, detail="Claim is too long (max 500 chars)")

    # Run Evidence Verification Pipeline
    v_result = verification_service.verify_article(claim)

    if v_result.verdict != "OUT_OF_SCOPE":
        # In-scope disease (COVID-19, Tuberculosis, Dengue, Diabetes)
        evidence_items = []
        for c in v_result.claims:
            for ev in c.evidence:
                evidence_items.append(
                    EvidenceItem(
                        source=ev.source_name,
                        snippet=ev.passage[:300] + "..." if len(ev.passage) > 300 else ev.passage,
                        url=ev.url
                    )
                )

        if v_result.verdict == "MISLEADING":
            final_verdict = "LIKELY FALSE"
            final_color = "red"
            final_confidence = int(v_result.confidence * 100) if v_result.confidence <= 1.0 else int(v_result.confidence)
            explanation = f"[Authentic Medical Evidence] {v_result.summary}"
        elif v_result.verdict == "RELIABLE":
            final_verdict = "LIKELY TRUE"
            final_color = "green"
            final_confidence = int(v_result.confidence * 100) if v_result.confidence <= 1.0 else int(v_result.confidence)
            explanation = f"[Authentic Medical Evidence] {v_result.summary}"
        else:
            final_verdict = "UNVERIFIABLE"
            final_color = "amber"
            final_confidence = 50
            explanation = f"[Authentic Medical Evidence] {v_result.summary}"

        # If there are myth signals from knowledge base, append explanation
        if v_result.known_myth_match:
            explanation += f" Known debunked pattern: '{v_result.known_myth_match.get('myth', '')}'."

        return FactCheckResponse(
            claim=claim,
            verdict=final_verdict,
            verdict_color=final_color,
            confidence=final_confidence,
            explanation=explanation,
            evidence=evidence_items,
            searched_topics=[v_result.disease] if v_result.disease else [],
            kb_result=None,
            disease_scope=v_result.disease,
            verification=v_result
        )

    # ── Fallback for Out-of-Scope Topics (Wikipedia / General KB) ──
    detected_disease = detect_disease(claim)
    kb_result_data = None
    if detected_disease:
        kb_result_data = check_against_kb(claim, detected_disease)

    topics = extract_key_topics(claim)
    evidence_items = []
    search_tasks = [search_wikipedia(topic) for topic in topics[:2]]
    wiki_results = await asyncio.gather(*search_tasks)

    for result in wiki_results:
        if result and result.get("summary"):
            evidence_items.append(EvidenceItem(
                source=f"Wikipedia: {result['title']}",
                snippet=result["summary"][:300] + "...",
                url=result.get("url")
            ))

    if kb_result_data and kb_result_data.get("kb_confidence", 0) > 0:
        final_verdict = kb_result_data["kb_verdict"]
        final_color = "red" if "FALSE" in final_verdict else "green" if "TRUE" in final_verdict else "amber"
        final_confidence = kb_result_data["kb_confidence"]
        explanation = f"[{kb_result_data['disease_display']}] {kb_result_data['kb_explanation']}"
    elif evidence_items:
        final_verdict = "UNVERIFIABLE"
        final_color = "amber"
        final_confidence = 40
        explanation = (
            "This query is outside TrustMe AI v2's clinical evidence scope (COVID-19, Tuberculosis, Dengue, Diabetes). "
            "Wikipedia articles on related topics were consulted, but clinical verification could not be established."
        )
    else:
        final_verdict = "UNVERIFIABLE"
        final_color = "amber"
        final_confidence = 0
        explanation = (
            "Could not find matching evidence. TrustMe AI v2 evaluates empirical claims for COVID-19, "
            "Tuberculosis, Dengue, and Diabetes against official WHO, CDC, and MoHFW guidelines."
        )

    return FactCheckResponse(
        claim=claim,
        verdict=final_verdict,
        verdict_color=final_color,
        confidence=final_confidence,
        explanation=explanation,
        evidence=evidence_items,
        searched_topics=topics,
        kb_result=None,
        disease_scope=detected_disease,
        verification=v_result
    )


@router.get("/diseases")
async def get_diseases():
    """Return the list of Indian diseases in scope with their authentic sources."""
    return {
        "scope": "National Healthcare Scope for India: Dengue, Tuberculosis (NTEP), Diabetes (ICMR-INDIAB), Cancer (Tata Memorial), COVID-19 & UIP Vaccines",
        "diseases": get_all_diseases(),
    }


@router.get("/examples")
async def get_examples():
    """Get India-centric healthcare misinformation and clinical claims."""
    return {
        "examples": [
            "Drinking warm water with lemon and garlic cures COVID-19 within 48 hours",
            "Papaya leaf juice cures dengue fever and permanently raises platelets",
            "Tuberculosis is a genetic hereditary disease that cannot be cured by antibiotics",
            "Drinking Karela bitter gourd juice cures diabetes and eliminates need for insulin",
            "Cow urine gomutra cures cancer tumors according to traditional healers",
            "Covaxin vaccines alter human DNA permanently and cause sudden heart attacks",
        ]
    }

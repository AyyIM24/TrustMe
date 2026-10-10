"""
factcheck.py — Fact-Check Router with Disease-Specific Knowledge Base.

Verifies claims against:
1. Disease Knowledge Base (WHO/CDC/NIH verified facts for COVID-19, Cancer, Diabetes, Vaccines)
2. Wikipedia (general knowledge fallback)

Scope: COVID-19, Cancer, Diabetes, Vaccines & Immunization
"""

import re
import asyncio
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx

# Import disease knowledge base
from services.disease_kb import detect_disease, check_against_kb, get_all_diseases

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
    kb_result: Optional[KBResult] = None   # Disease KB check result
    disease_scope: Optional[str] = None    # Detected disease (or None)


# ── Wikipedia API Helper ──────────────────────────────────────────

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"


async def search_wikipedia(query: str) -> Optional[dict]:
    """Search Wikipedia for a query and return the best match summary."""
    headers = {"User-Agent": "HealthGuardMedicalFactChecker/1.0 (contact@healthguard.ai; educational research)"}
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

            clean_snippets = []
            for r in results:
                raw_snip = r.get("snippet", "")
                clean_snip = re.sub(r'<[^>]*>', '', raw_snip)
                clean_snip = clean_snip.replace("&quot;", '"').replace("&amp;", '&').replace("&lt;", '<').replace("&gt;", '>')
                if clean_snip:
                    clean_snippets.append(clean_snip.strip())

            title = results[0]["title"]
            summary_url = f"{WIKI_API}{title.replace(' ', '_')}"
            summary_resp = await client.get(summary_url, headers={"Accept": "application/json"})
            if summary_resp.status_code == 200:
                data = summary_resp.json()
                return {
                    "title": data.get("title", title),
                    "summary": data.get("extract", ""),
                    "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "snippets": clean_snippets,
                }
            else:
                return {
                    "title": title,
                    "summary": " ".join(clean_snippets[:2]),
                    "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                    "snippets": clean_snippets,
                }
        except Exception as e:
            print(f"[WIKI] Error searching Wikipedia for '{query}': {e}")
    return None


def extract_numbers(text: str) -> List[str]:
    """Extract numbers and numeric words from text."""
    patterns = [
        r'\b\d+\b',
        r'\b(one|two|three|four|five|six|seven|eight|nine|ten)\b',
    ]
    nums = []
    for p in patterns:
        nums.extend(re.findall(p, text.lower()))
    return nums


def word_overlap_score(claim: str, evidence: str) -> float:
    """Calculate what fraction of claim keywords appear in evidence."""
    stopwords = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'at', 'to',
        'and', 'or', 'but', 'for', 'with', 'has', 'had', 'have', 'been', 'by', 'from',
        'that', 'this', 'which', 'who', 'he', 'she', 'it', 'they', 'we', 'i',
        'did', 'does', 'do', 'not', 'no', 'be', 'as', 'its', 'his', 'her', 'their'
    }
    claim_words = set(re.findall(r'\b[a-zA-Z0-9]+\b', claim.lower())) - stopwords
    evidence_words = set(re.findall(r'\b[a-zA-Z0-9]+\b', evidence.lower()))
    if not claim_words:
        return 0.0
    overlap = claim_words & evidence_words
    return len(overlap) / len(claim_words)


def check_number_consistency(claim: str, evidence: str) -> Optional[bool]:
    """Check if numbers in the claim match numbers in the evidence."""
    claim_nums = set(extract_numbers(claim))
    evidence_nums = set(extract_numbers(evidence))
    if not claim_nums:
        return None
    overlap = claim_nums & evidence_nums
    if overlap:
        return True
    elif claim_nums and evidence_nums:
        return False
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
    Verify a health claim against:
    1. Disease-specific Knowledge Base (WHO/CDC/NIH — COVID-19, Cancer, Diabetes, Vaccines)
    2. Wikipedia (general fallback)
    """
    claim = payload.claim.strip()
    if len(claim) < 5:
        raise HTTPException(status_code=400, detail="Claim is too short to verify")
    if len(claim) > 500:
        raise HTTPException(status_code=400, detail="Claim is too long (max 500 chars)")

    # ── Step 1: Check Disease Knowledge Base ─────────────────────
    detected_disease = detect_disease(claim)
    kb_result_data = None
    kb_verdict = None
    kb_confidence = 0

    if detected_disease:
        kb_result_data = check_against_kb(claim, detected_disease)
        kb_verdict = kb_result_data["kb_verdict"]
        kb_confidence = kb_result_data["kb_confidence"]

    # ── Step 2: Wikipedia Search ──────────────────────────────────
    topics = extract_key_topics(claim)
    evidence_items = []
    all_summaries = []

    search_tasks = [search_wikipedia(topic) for topic in topics[:2]]
    wiki_results = await asyncio.gather(*search_tasks)

    for result in wiki_results:
        if result and (result.get("summary") or result.get("snippets")):
            if result.get("summary"):
                all_summaries.append(result["summary"])
            if result.get("snippets"):
                all_summaries.extend(result["snippets"])

            sentences = result["summary"].split('. ') if result.get("summary") else []
            candidates = sentences + result.get("snippets", [])
            best_snippet = ""
            best_score = 0
            for cand in candidates:
                if not cand.strip():
                    continue
                score = word_overlap_score(claim, cand)
                if score > best_score:
                    best_score = score
                    best_snippet = cand

            if best_snippet:
                clean_snippet = best_snippet.strip()
                if not clean_snippet.endswith(('.', '!', '?')):
                    clean_snippet += "."
                evidence_items.append(EvidenceItem(
                    source=f"Wikipedia: {result['title']}",
                    snippet=clean_snippet,
                    url=result.get("url")
                ))

    # Add KB authentic sources as evidence items
    if kb_result_data:
        for src in kb_result_data["authentic_sources"][:2]:
            evidence_items.append(EvidenceItem(
                source=src["name"],
                snippet=kb_result_data["kb_explanation"][:200],
                url=src["url"]
            ))

    # ── Step 3: Combine KB + Wikipedia Signals ───────────────────
    combined_evidence = " ".join(all_summaries)

    if kb_verdict and kb_confidence > 0:
        # KB is primary signal for in-scope diseases
        if kb_verdict == "LIKELY FALSE":
            final_verdict = "LIKELY FALSE"
            final_color = "red"
            final_confidence = kb_confidence
            explanation = (
                f"[{kb_result_data['disease_display']} Knowledge Base — WHO/CDC/NIH] "
                f"{kb_result_data['kb_explanation']}"
            )
            if kb_result_data.get("myth_signals"):
                explanation += f" Debunked myth pattern matched: '{kb_result_data['myth_signals'][0]}'."

        elif kb_verdict == "LIKELY TRUE":
            final_verdict = "LIKELY TRUE"
            final_color = "green"
            final_confidence = kb_confidence
            explanation = (
                f"[{kb_result_data['disease_display']} Knowledge Base — WHO/CDC/NIH] "
                f"{kb_result_data['kb_explanation']}"
            )

        elif kb_verdict == "MIXED / PARTIAL":
            final_verdict = "MIXED / PARTIAL"
            final_color = "cyan"
            final_confidence = kb_confidence
            explanation = (
                f"[{kb_result_data['disease_display']} Knowledge Base — WHO/CDC/NIH] "
                f"{kb_result_data['kb_explanation']}"
            )

        else:  # UNVERIFIABLE from KB — fall back to Wikipedia
            if not combined_evidence:
                final_verdict = "UNVERIFIABLE"
                final_color = "amber"
                final_confidence = 0
                explanation = (
                    f"[{kb_result_data['disease_display']}] Could not find a match in the "
                    f"WHO/CDC/NIH knowledge base or Wikipedia for this claim. "
                    f"Please consult an official medical authority."
                )
            else:
                # Wikipedia fallback scoring
                best_snippet_overlap = max(
                    (word_overlap_score(claim, ev.snippet) for ev in evidence_items if "Wikipedia" in ev.source),
                    default=0.0
                )
                overall_overlap = word_overlap_score(claim, combined_evidence)
                overlap = 0.7 * best_snippet_overlap + 0.3 * overall_overlap if best_snippet_overlap >= 0.65 else best_snippet_overlap
                base_score = int(overlap * 100)
                if best_snippet_overlap < 0.65:
                    base_score = max(5, base_score - 20)
                final_confidence = max(10, min(80, base_score))
                if final_confidence >= 60:
                    final_verdict = "LIKELY TRUE"
                    final_color = "green"
                elif final_confidence >= 35:
                    final_verdict = "MIXED / PARTIAL"
                    final_color = "cyan"
                else:
                    final_verdict = "LIKELY FALSE"
                    final_color = "red"
                explanation = (
                    f"[{kb_result_data['disease_display']}] Not directly matched in WHO/CDC knowledge base. "
                    f"Wikipedia indicates {int(overlap * 100)}% keyword overlap with reference material."
                )

    elif combined_evidence:
        # Non-disease topic: pure Wikipedia scoring
        best_snippet_overlap = max(
            (word_overlap_score(claim, ev.snippet) for ev in evidence_items),
            default=0.0
        )
        overall_overlap = word_overlap_score(claim, combined_evidence)
        num_consistent = check_number_consistency(claim, combined_evidence)
        overlap = 0.7 * best_snippet_overlap + 0.3 * overall_overlap if best_snippet_overlap >= 0.65 else best_snippet_overlap
        base_score = int(overlap * 100)
        if best_snippet_overlap < 0.65:
            base_score = max(5, base_score - 20)
        num_note = ""
        if num_consistent is True:
            base_score = min(95, base_score + 20)
            num_note = "Numbers in the claim are consistent with Wikipedia data. "
        elif num_consistent is False:
            base_score = max(5, base_score - 30)
            num_note = "Numbers in the claim differ from Wikipedia data. "
        final_confidence = max(10, min(92, base_score))
        if not evidence_items:
            final_verdict = "UNVERIFIABLE"
            final_color = "amber"
            explanation = f"Found Wikipedia articles on related topics but couldn't extract a direct match. {num_note}Please verify with a primary source."
        elif final_confidence >= 60:
            final_verdict = "LIKELY TRUE"
            final_color = "green"
            explanation = f"{num_note}The key claims appear to be supported by Wikipedia. {int(overlap * 100)}% of claim keywords match the reference sources."
        elif final_confidence >= 35:
            final_verdict = "MIXED / PARTIAL"
            final_color = "cyan"
            explanation = f"{num_note}The claim partially matches Wikipedia content, but some details could not be fully verified."
        else:
            final_verdict = "LIKELY FALSE"
            final_color = "red"
            explanation = f"{num_note}The claim has low overlap ({int(overlap * 100)}%) with Wikipedia reference material."

    else:
        final_verdict = "UNVERIFIABLE"
        final_color = "amber"
        final_confidence = 0
        explanation = (
            "Could not find relevant information to verify this claim. "
            "This may be about a very recent event or a topic outside our knowledge base. "
            "Please consult WHO, CDC, or NIH directly."
        )

    # Build KB result for response
    kb_response = None
    if kb_result_data:
        kb_response = KBResult(
            disease=kb_result_data["disease"],
            disease_display=kb_result_data["disease_display"],
            kb_verdict=kb_result_data["kb_verdict"],
            kb_confidence=kb_result_data["kb_confidence"],
            kb_explanation=kb_result_data["kb_explanation"],
            supporting_facts=kb_result_data["supporting_facts"],
            myth_signals=kb_result_data["myth_signals"],
            authentic_sources=[AuthenticSource(**s) for s in kb_result_data["authentic_sources"]],
        )

    return FactCheckResponse(
        claim=claim,
        verdict=final_verdict,
        verdict_color=final_color,
        confidence=final_confidence,
        explanation=explanation,
        evidence=evidence_items,
        searched_topics=topics,
        kb_result=kb_response,
        disease_scope=kb_result_data["disease_display"] if kb_result_data else None,
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
            # Dengue (India NVBDCP Scope)
            "Papaya leaf juice cures dengue fever and permanently raises platelets",
            "Drinking raw goat milk or kiwi juice eliminates dengue virus instantly",
            # Tuberculosis (India NTEP Scope)
            "Tuberculosis is a genetic hereditary disease that cannot be cured by antibiotics",
            "Eating raw garlic cures pulmonary tuberculosis without DOTS medicine",
            # Diabetes (ICMR-INDIAB Scope)
            "Drinking Karela bitter gourd juice cures diabetes and eliminates need for insulin",
            "Jamun seed powder completely eliminates diabetes without medication",
            # Cancer (Tata Memorial Scope)
            "Cow urine gomutra cures cancer tumors according to traditional healers",
            "High doses of lemon water kill all malignant cancer cells",
            # Vaccines & UIP (India UIP Scope)
            "Pulse polio drops cause infertility in Indian children",
            "Covaxin vaccines alter human DNA permanently and cause sudden heart attacks",
            # COVID-19 (India Scope)
            "Coronil and herbal kadha completely cure COVID-19 in seven days",
            "Drinking hot water with turmeric kills coronavirus in the throat",
        ]
    }

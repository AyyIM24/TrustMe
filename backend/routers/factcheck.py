import re
import asyncio
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/factcheck", tags=["Fact Check"])

# ── Schemas ───────────────────────────────────────────────────────

class FactCheckRequest(BaseModel):
    claim: str

class EvidenceItem(BaseModel):
    source: str
    snippet: str
    url: Optional[str] = None

class FactCheckResponse(BaseModel):
    claim: str
    verdict: str            # "LIKELY TRUE" | "LIKELY FALSE" | "UNVERIFIABLE" | "MIXED"
    verdict_color: str      # "green" | "red" | "amber" | "cyan"
    confidence: int         # 0-100
    explanation: str
    evidence: List[EvidenceItem]
    searched_topics: List[str]


# ── Wikipedia API Helper ──────────────────────────────────────────

WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/"
WIKI_SEARCH = "https://en.wikipedia.org/w/api.php"

async def search_wikipedia(query: str) -> Optional[dict]:
    """Search Wikipedia for a query and return the best match summary."""
    headers = {"User-Agent": "HealthGuardMedicalFactChecker/1.0 (contact@healthguard.ai; educational research)"}
    async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
        try:
            # Step 1: Search for page title
            search_resp = await client.get(WIKI_SEARCH, params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "srlimit": 3,
            })
            if search_resp.status_code != 200:
                print(f"[WIKI] Search failed for '{query}': {search_resp.status_code}")
                return None
            search_data = search_resp.json()
            results = search_data.get("query", {}).get("search", [])
            if not results:
                print(f"[WIKI] No search results for '{query}'")
                return None

            # Clean HTML from snippets
            clean_snippets = []
            for r in results:
                raw_snip = r.get("snippet", "")
                clean_snip = re.sub(r'<[^>]*>', '', raw_snip)
                clean_snip = clean_snip.replace("&quot;", '"').replace("&amp;", '&').replace("&lt;", '<').replace("&gt;", '>')
                if clean_snip:
                    clean_snippets.append(clean_snip.strip())

            # Step 2: Get page summary for the best result
            title = results[0]["title"]
            summary_url = f"{WIKI_API}{title.replace(' ', '_')}"
            summary_resp = await client.get(
                summary_url,
                headers={"Accept": "application/json"}
            )
            if summary_resp.status_code == 200:
                data = summary_resp.json()
                return {
                    "title": data.get("title", title),
                    "summary": data.get("extract", ""),
                    "url": data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "snippets": clean_snippets,
                }
            else:
                print(f"[WIKI] Summary API status {summary_resp.status_code} for page '{title}'")
                # Fallback to search snippets only if summary call failed
                return {
                    "title": title,
                    "summary": " ".join(clean_snippets[:2]),
                    "url": f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                    "snippets": clean_snippets,
                }
        except Exception as e:
            print(f"[WIKI] Error searching Wikipedia for '{query}': {e}")
            import traceback
            traceback.print_exc()
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
    # Remove common stop words
    stopwords = {'the','a','an','is','are','was','were','of','in','on','at','to',
                 'and','or','but','for','with','has','had','have','been','by','from',
                 'that','this','which','who','he','she','it','they','we','i',
                 'did','does','do','not','no','be','as','its','his','her','their'}
    
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
        return None  # No numbers to check
    
    # Check if claim numbers appear in evidence
    overlap = claim_nums & evidence_nums
    if overlap:
        return True  # Numbers are consistent
    elif claim_nums and evidence_nums:
        return False  # Different numbers present
    return None


def extract_key_topics(claim: str) -> List[str]:
    """Extract likely Wikipedia search topics from a claim."""
    # Remove common verbs and filler words
    filler = r'\b(won|win|wins|losing|lost|is|are|was|were|has|have|had|did|does|said|says|claims|reported|confirmed|allegedly|according)\b'
    cleaned = re.sub(filler, '', claim, flags=re.IGNORECASE).strip()
    
    # Extract proper nouns (words starting with capital letters, ignoring sentence start)
    words = claim.split()
    proper_nouns = []
    for i, w in enumerate(words):
        w_clean = re.sub(r'[^a-zA-Z]', '', w)
        if w_clean and w_clean[0].isupper() and i > 0:
            proper_nouns.append(w_clean)
    
    # Build search queries
    queries = []
    if proper_nouns:
        queries.append(' '.join(proper_nouns[:3]))
    queries.append(claim[:80])  # Full claim trimmed
    
    # Remove duplicates
    return list(dict.fromkeys(queries))


# ── Main Fact Check Logic ─────────────────────────────────────────

@router.post("/check", response_model=FactCheckResponse)
async def fact_check(payload: FactCheckRequest):
    """Check a factual claim against Wikipedia and knowledge sources."""
    claim = payload.claim.strip()
    if len(claim) < 5:
        raise HTTPException(status_code=400, detail="Claim is too short to verify")
    if len(claim) > 500:
        raise HTTPException(status_code=400, detail="Claim is too long (max 500 chars)")

    topics = extract_key_topics(claim)
    evidence_items = []
    all_summaries = []

    # Search Wikipedia for each extracted topic
    search_tasks = [search_wikipedia(topic) for topic in topics[:2]]
    wiki_results = await asyncio.gather(*search_tasks)

    for result in wiki_results:
        if result and (result.get("summary") or result.get("snippets")):
            if result.get("summary"):
                all_summaries.append(result["summary"])
            if result.get("snippets"):
                all_summaries.extend(result["snippets"])
            
            # Find the best snippet from either the summary or search snippets
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

    # ── Scoring Logic ────────────────────────────────────────────
    combined_evidence = " ".join(all_summaries)
    
    if not combined_evidence:
        return FactCheckResponse(
            claim=claim,
            verdict="UNVERIFIABLE",
            verdict_color="amber",
            confidence=0,
            explanation="Could not find relevant information in Wikipedia to verify this claim. This may be about a very recent event, a niche topic, or a fictional statement.",
            evidence=[],
            searched_topics=topics,
        )

    # Calculate best snippet overlap
    best_snippet_overlap = 0.0
    if evidence_items:
        best_snippet_overlap = max(word_overlap_score(claim, ev.snippet) for ev in evidence_items)
    
    overall_overlap = word_overlap_score(claim, combined_evidence)
    
    # Prioritize single-sentence support to avoid false positives from unrelated text chunks
    if best_snippet_overlap >= 0.65:
        overlap = 0.7 * best_snippet_overlap + 0.3 * overall_overlap
    else:
        overlap = best_snippet_overlap

    num_consistent = check_number_consistency(claim, combined_evidence)

    # Scoring heuristics
    base_score = int(overlap * 100)

    # Penalize if no single sentence has high overlap (suggests entities are unrelated)
    if best_snippet_overlap < 0.65:
        base_score = max(5, base_score - 20)

    # Adjust based on number consistency
    if num_consistent is True:
        base_score = min(95, base_score + 20)
        num_note = "Numbers in the claim are consistent with Wikipedia data. "
    elif num_consistent is False:
        base_score = max(5, base_score - 30)
        num_note = "⚠ Numbers in the claim differ from Wikipedia data. "
    else:
        num_note = ""

    # Clamp
    confidence = max(10, min(92, base_score))

    # Determine verdict
    if not evidence_items:
        verdict = "UNVERIFIABLE"
        verdict_color = "amber"
        explanation = f"Found Wikipedia articles on related topics but couldn't extract a direct match for this specific claim. {num_note}Please verify with a primary source."
    elif confidence >= 60:
        verdict = "LIKELY TRUE"
        verdict_color = "green"
        explanation = f"{num_note}The key claims appear to be supported by Wikipedia. {int(overlap*100)}% of claim keywords match the reference sources. Always verify with official records."
    elif confidence >= 35:
        verdict = "MIXED / PARTIAL"
        verdict_color = "cyan"
        explanation = f"{num_note}The claim partially matches Wikipedia content, but some details could not be fully verified. The core subject exists but specific claims may be inaccurate."
    else:
        verdict = "LIKELY FALSE"
        verdict_color = "red"
        explanation = f"{num_note}The claim has low overlap ({int(overlap*100)}%) with Wikipedia reference material on this topic. Key facts appear to contradict or not appear in authoritative sources."

    return FactCheckResponse(
        claim=claim,
        verdict=verdict,
        verdict_color=verdict_color,
        confidence=confidence,
        explanation=explanation,
        evidence=evidence_items,
        searched_topics=topics,
    )

@router.get("/examples")
async def get_examples():
    """Get healthcare and medical misinformation example claims."""
    return {
        "examples": [
            "COVID-19 mRNA vaccines alter human DNA permanently",
            "Drinking bleach or chlorine dioxide cures coronavirus infection",
            "Ivermectin is an FDA-approved antiviral cure for COVID-19",
            "High doses of Vitamin C eliminate all cancerous tumors",
            "MMR vaccine causes autism spectrum disorders in children",
            "Drinking hot water with lemon kills 100% of cancer cells",
            "5G cellular mobile networks spread coronavirus and respiratory illnesses",
            "Antibiotics are effective in treating viral infections like the flu",
        ]
    }

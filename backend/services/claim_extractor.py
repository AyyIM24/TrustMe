"""
claim_extractor.py — TrustMe AI v2 Claim Extraction Service

Extracts verifiable health claim sentences from an input article or user query.
Uses sentence splitting, declarative filtering, health/disease cue detection,
and length filtering (6-60 words). Capped at 8 claims per article.

P0.3 fix: strengthened exclusion of news-reporting sentences (case counts,
dates, locations, admin/political news, reporting-verb constructions).
"""

import re
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Cue words indicating an empirical or verifiable health assertion ──────────
# These must reflect a medical fact / mechanism, not merely report an event.
HEALTH_CLAIM_CUES = {
    "cure", "cures", "cured", "curing",
    "prevent", "prevents", "prevented", "prevention", "preventing",
    "cause", "causes", "caused", "causing",
    "treat", "treats", "treated", "treatment", "treating",
    "kill", "kills", "killed", "killing",
    "transmit", "transmits", "transmitted", "transmission", "transmitting",
    "infect", "infects", "infected", "infection", "infecting",
    "vaccine", "vaccines", "vaccinated", "vaccination",
    "medicine", "medicines", "medication", "drug", "drugs", "remedy", "remedies",
    "symptom", "symptoms", "diagnos", "diagnosed", "diagnosis",
    "immunity", "immune", "antibody", "antibodies",
    "spread", "spreads", "spreading",
    "death", "fatal", "die", "died", "mortality",
    "garlic", "lemon", "herbal", "ayurved", "homeopath", "steam",
    "hydroxychloroquine", "ivermectin", "remdesivir", "paracetamol", "doxycycline",
    "insulin", "sugar", "glucose", "platelet", "platelets", "papaya",
    "bleach", "chlorine", "salt",
    # Additional medical assertion cues
    "protects", "effective", "reduces", "risk", "lowers", "increases",
    "no specific treatment", "no cure", "no vaccine", "antibiotics",
    "antiviral", "antiparasitic",
}

# ── Reporting / news verbs that indicate the sentence is journalism, not a claim
# "X reported that ...", "Cases rose to ...", "Minister said ..."
NEWS_REPORTING_PATTERNS = [
    # Reporting verbs with subject (journalism verbs)
    r'\b(reported|confirmed|announced|stated|said|told|revealed|disclosed|noted|warned|urged|called|demanded|asked|reiterated|informed)\b',
    # Epidemiological case-count patterns
    r'\b(cases?|deaths?|infections?|fatalities|hospitalisations?|patients?)\s+(rose|increased|jumped|declined|fell|dropped|recorded|reported|crossed|reached|surpassed|exceeded)\b',
    r'\b\d+\s+(cases?|deaths?|infections?|patients?|fatalities)\b',
    r'\b(total|cumulative|new)\s+(cases?|deaths?|count)\b',
    # Administrative / political / organizational news
    r'\b(government|ministry|minister|official|authority|district|state|nation|country|policy|scheme|programme|initiative|committee|panel|board|department|bureau)\b',
    # Date / location markers as the primary subject
    r'^(on|in|at|by|from|since|after|before|during|as of)\s+(january|february|march|april|may|june|july|august|september|october|november|december|\d{4})',
    r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    # Passive news-report constructions
    r'\bhas\s+been\s+(reported|found|discovered|launched|rolled out|started|introduced)\b',
]

_NEWS_RE = re.compile(
    '|'.join(NEWS_REPORTING_PATTERNS),
    re.IGNORECASE
)

# ── Supported disease cue keywords ───────────────────────────────────────────
DISEASE_KEYWORDS = {
    "covid19": {"covid", "covid-19", "coronavirus", "sars-cov-2", "corona"},
    "tuberculosis": {"tb", "tuberculosis", "mycobacterium", "consumption", "koch"},
    "dengue": {"dengue", "breakbone", "aedes", "mosquito"},
    "diabetes": {"diabetes", "diabetic", "insulin", "type 1", "type 2", "blood sugar", "hyperglycemia"},
}

ALL_DISEASE_TERMS = set()
for terms in DISEASE_KEYWORDS.values():
    ALL_DISEASE_TERMS.update(terms)


def split_sentences(text: str) -> List[str]:
    """Split text into sentences using regex boundary matching."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    raw = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"\u2018\u2019\u201c])", cleaned)
    sentences = []
    for s in raw:
        s = s.strip()
        if s:
            sentences.append(s)
    return sentences


def detect_disease_context(text: str) -> Optional[str]:
    """Detect which supported disease the text primarily discusses."""
    text_lower = text.lower()
    scores = {}
    for disease, keywords in DISEASE_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r"\b" + re.escape(kw) + r"\b", text_lower))
        if score > 0:
            scores[disease] = score
    if not scores:
        return None
    return max(scores, key=scores.get)


def is_declarative(sentence: str) -> bool:
    """Filter out questions, exclamations, quotes-only, or command headers."""
    s = sentence.strip()
    if not s:
        return False
    if s.endswith("?") or s.startswith("?"):
        return False
    # Skip sentences that look like pure headline questions
    if re.search(r"^(is|can|do|does|will|could|should|what|why|how|when|where|who)\b", s, re.IGNORECASE) and "?" in s:
        return False
    # Avoid navigation or UI fragments
    if re.search(r"^(click here|read more|share this|subscribe|advertisement|copyright|source:)", s, re.IGNORECASE):
        return False
    return True


def is_news_reporting_sentence(sentence: str) -> bool:
    """
    Return True if the sentence is primarily reporting news/events/case counts
    rather than making a verifiable medical claim.

    Excludes: case count reports, quotes from officials, administrative news,
    date-anchored event reports, and pure location/political statements.
    """
    return bool(_NEWS_RE.search(sentence))


def contains_claim_signal(sentence: str, target_disease: Optional[str] = None) -> bool:
    """
    Check if the sentence contains empirical health claims.

    A sentence must have BOTH:
    1. A health-claim cue word (mechanism, treatment, causation, etc.)
    2. A disease keyword (or the disease is already the detected context)
    """
    words = set(re.findall(r"\b[a-z0-9\-]+\b", sentence.lower()))
    if not words:
        return False

    has_cue = any(cue in words for cue in HEALTH_CLAIM_CUES)
    if not has_cue:
        return False

    # Also require a disease term to anchor the claim
    has_disease = False
    if target_disease and target_disease in DISEASE_KEYWORDS:
        has_disease = any(kw in words for kw in DISEASE_KEYWORDS[target_disease])
    if not has_disease:
        has_disease = any(kw in words for kw in ALL_DISEASE_TERMS)

    return has_cue and has_disease


def extract_claims(text: str, disease: Optional[str] = None, max_claims: int = 8) -> List[str]:
    """
    Extract up to `max_claims` verifiable candidate claims from text.

    Only sentences that:
    - Are declarative (not questions, nav links, etc.)
    - Are NOT news-reporting sentences (case counts, quotes, admin news)
    - Contain both a health-cue verb/term AND a disease term
    - Are 6–60 words long
    are kept.

    If the input is a single short claim sentence, it is returned as-is.
    If no sentences pass the strict filter, an empty list is returned
    (callers should return UNVERIFIED with message "No verifiable medical claims found").
    """
    if not text or not text.strip():
        return []

    detected_disease = disease or detect_disease_context(text)
    sentences = split_sentences(text)

    # If the entire input is just 1 short sentence (e.g. user typed a single claim)
    # and it has a claim signal, return it directly
    if len(sentences) == 1:
        s = sentences[0]
        if 4 <= len(s.split()) <= 60 and is_declarative(s) and not is_news_reporting_sentence(s):
            return [s]

    candidate_claims = []
    seen = set()

    for sent in sentences:
        words = sent.split()
        word_count = len(words)

        # Length constraint: 6 to 60 words
        if word_count < 6 or word_count > 60:
            continue

        if not is_declarative(sent):
            continue

        # P0.3: Exclude news-reporting sentences
        if is_news_reporting_sentence(sent):
            logger.debug("[ClaimExtractor] Skipping news-reporting sentence: %s", sent[:80])
            continue

        # Require both health cue AND disease term
        if not contains_claim_signal(sent, target_disease=detected_disease):
            continue

        # Normalise for deduplication
        norm = re.sub(r"[^\w\s]", "", sent.lower()).strip()
        if norm in seen:
            continue
        seen.add(norm)

        candidate_claims.append(sent)
        if len(candidate_claims) >= max_claims:
            break

    # DO NOT fall back to adding any sentence that didn't pass the filter.
    # If no verifiable medical assertions found, return empty list.
    # The caller must handle this as UNVERIFIED with a clear message.
    return candidate_claims

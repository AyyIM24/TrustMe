"""
claim_extractor.py — TrustMe AI v2 Claim Extraction Service

Extracts verifiable health claim sentences from an input article or user query.
Uses sentence splitting, declarative filtering, health/disease cue detection,
and length filtering (6-60 words). Capped at 8 claims per article.
"""

import re
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Cue words indicating an empirical or verifiable health assertion
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
    "bleach", "chlorine", "salt", "warm water", "alkaline", "ph level"
}

# Supported disease cue keywords
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
    # Clean excessive whitespace
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    
    # Split on sentence terminals followed by space and capital letter or end
    raw = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'‘“])", cleaned)
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


def contains_claim_signal(sentence: str, target_disease: Optional[str] = None) -> bool:
    """Check if the sentence contains empirical health claims or disease terms."""
    words = set(re.findall(r"\b[a-z0-9\-]+\b", sentence.lower()))
    if not words:
        return False

    # Check for direct health claim cues
    if any(cue in words for cue in HEALTH_CLAIM_CUES):
        return True

    # Check for target disease keywords
    if target_disease and target_disease in DISEASE_KEYWORDS:
        if any(kw in words for kw in DISEASE_KEYWORDS[target_disease]):
            return True

    # Check any disease keyword
    if any(kw in words for kw in ALL_DISEASE_TERMS):
        return True

    return False


def extract_claims(text: str, disease: Optional[str] = None, max_claims: int = 8) -> List[str]:
    """
    Extract up to `max_claims` verifiable candidate claims from text.
    
    Args:
        text: Input article or statement.
        disease: Optional disease hint. If None, detected automatically.
        max_claims: Max number of claims returned (default: 8).
        
    Returns:
        List of claim sentence strings.
    """
    if not text or not text.strip():
        return []

    detected_disease = disease or detect_disease_context(text)
    sentences = split_sentences(text)
    
    # If the entire input is just 1 short sentence (e.g. user entered a single claim)
    if len(sentences) == 1 and 4 <= len(sentences[0].split()) <= 60:
        return [sentences[0]]

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

    # If no claims matched the strict filter but text has declarative sentences, fallback to longest declarative
    if not candidate_claims and sentences:
        for sent in sentences:
            if 6 <= len(sent.split()) <= 60 and is_declarative(sent):
                candidate_claims.append(sent)
                if len(candidate_claims) >= max_claims:
                    break

    return candidate_claims

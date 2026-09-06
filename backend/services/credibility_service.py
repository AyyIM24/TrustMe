import re
from typing import Dict, List

# ── Credibility Signal Weights ────────────────────────────────────
# Each signal contributes to a final "credibility score" (0-100, higher = more credible)

CLICKBAIT_PATTERNS = [
    r'\bYou won\'t believe\b', r'\bShocking\b', r'\bBreaking\b', r'\bExplosive\b',
    r'\bMind-blowing\b', r'\bSecret\b', r'\bHidden truth\b', r'\bWhat they don\'t want you\b',
    r'\bDoctors hate\b', r'\bOne weird trick\b', r'\bGoing viral\b', r'\bMust see\b',
    r'\bUnbelievable\b', r'\bBombshell\b', r'\bEveryone is talking\b',
    r'\b\d+ things you\b', r'\bThis is why\b', r'\bHere\'s why\b',
    r'\bYou need to see\b', r'\bThis will\b', r'\bNobody expected\b',
]

SENSATIONAL_WORDS = [
    'explosive', 'shocking', 'unbelievable', 'outrageous', 'devastating',
    'horrifying', 'terrifying', 'miraculous', 'incredible', 'astonishing',
    'scandal', 'catastrophe', 'chaos', 'crisis', 'emergency', 'disaster',
    'corrupt', 'criminal', 'evil', 'illegal', 'fraud', 'conspiracy',
    'fake', 'hoax', 'lie', 'lied', 'lying', 'cover-up', 'coverup',
    'exposed', 'reveals', 'uncovered', 'leaked', 'exclusive',
]

CREDIBLE_INDICATORS = [
    r'\baccording to\b', r'\bstudy shows\b', r'\bresearch indicates\b',
    r'\bsaid in a statement\b', r'\bofficial\b', r'\bconfirmed\b',
    r'\bpeer-reviewed\b', r'\bstatistics\b', r'\bdata shows\b',
    r'\banalysts\b', r'\bexperts say\b', r'\bsources confirm\b',
    r'\breport\b', r'\bsurvey\b', r'\bpublished\b',
]

HEDGE_WORDS = [
    r'\ballegedly\b', r'\bpurportedly\b', r'\bclaimed\b', r'\breportedly\b',
    r'\bunverified\b', r'\brunors\b', r'\bsay sources\b',
]


from urllib.parse import urlparse

def extract_domain(url: str) -> str:
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc or parsed.path
        if netloc.startswith("www."):
            netloc = netloc[4:]
        return netloc.split("/")[0].split(":")[0].lower()
    except Exception:
        return ""

def classify_category(text: str) -> str:
    text_lower = text.lower()
    categories = {
        "Health": {'vaccine', 'virus', 'covid', 'health', 'doctor', 'cancer', 'medical', 'treatment', 'disease', 'outbreak', 'epidemic', 'clinic'},
        "Politics": {'election', 'president', 'government', 'biden', 'trump', 'congress', 'senate', 'parliament', 'minister', 'vote', 'policy', 'campaign', 'republican', 'democrat'},
        "Finance": {'stock', 'finance', 'crypto', 'bitcoin', 'bank', 'money', 'market', 'economy', 'tax', 'recession', 'investment', 'inflation', 'trade'},
        "Sports": {'cricket', 'football', 'fifa', 'ipl', 'world cup', 'olympics', 'tennis', 'nba', 'trophy', 'championship', 'coach', 'match', 'player'},
        "Science & Tech": {'science', 'space', 'nasa', 'climate', 'research', 'earth', 'energy', 'tech', 'technology', 'ai', 'algorithm', 'software', 'robots'},
    }
    for category, words in categories.items():
        if any(w in text_lower for w in words):
            return category
    return "General"

def generate_tags(title: str, text: str, prediction: str, credibility_score: int) -> List[str]:
    tags = []
    combined = f"{title or ''} {text}".lower()
    
    cat = classify_category(combined)
    if cat != "General":
        tags.append(f"{cat} Claim" if cat == "Health" else f"{cat} Topic")
        
    if prediction == "fake":
        tags.append("Misinformation")
    if credibility_score < 50:
        tags.append("Low Trustworthiness")
    elif credibility_score >= 80:
        tags.append("Verified Content")
        
    return tags

def analyze_credibility(title: str, text: str, source_url: str = None) -> Dict:
    """
    Analyze text for credibility signals across 5 core dimensions:
    1. Domain Reputation
    2. Citation Count
    3. Clickbait Score
    4. Author Credibility
    5. Grammar & Style Check
    """
    combined = f"{title} {text}" if title else text
    text_lower = combined.lower()
    word_count = len(text.split())

    signals = []

    # ── 1. Domain Reputation ──────────────────────────────────────
    domain = extract_domain(source_url)
    reputable_suffixes = ('.gov', '.edu', '.org', '.ac.uk', '.edu.in')
    trusted_domains = {
        'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com',
        'wsj.com', 'bloomberg.com', 'wikipedia.org', 'npr.org', 'theguardian.com',
        'politico.com', 'factcheck.org', 'snopes.com'
    }
    clickbait_domains = {
        'infowars.com', 'nationalenquirer.com', 'dailymail.co.uk', 'theonion.com',
        'breitbart.com', 'naturalnews.com'
    }

    if domain:
        if domain in trusted_domains or domain.endswith(reputable_suffixes):
            domain_score = 98
            domain_detail = f"High reputation source domain verified ({domain})"
            domain_status = "pass"
        elif domain in clickbait_domains:
            domain_score = 20
            domain_detail = f"Domain matches known clickbait or satire registry ({domain})"
            domain_status = "fail"
        else:
            domain_score = 75
            domain_detail = f"Generic news/information domain ({domain})"
            domain_status = "warn"
    else:
        # Check text references
        media_mentions = ['reuters', 'associated press', 'bbc news', 'new york times', 'guardian', 'snopes', 'factcheck.org']
        found_mentions = [m for m in media_mentions if m in text_lower]
        if found_mentions:
            domain_score = 85
            domain_detail = f"No URL provided, but cites trusted media outlet: '{found_mentions[0]}'"
            domain_status = "pass"
        else:
            domain_score = 50
            domain_detail = "Anonymous text report with no source URL or reputable media citations"
            domain_status = "fail"

    signals.append({
        "name": "Domain Reputation",
        "score": domain_score,
        "icon": "🌐",
        "status": domain_status,
        "detail": domain_detail
    })

    # ── 2. Citation Count ─────────────────────────────────────────
    # Look for quotes, number patterns, citation markers
    quotes_count = len(re.findall(r'"[^"]{15,}"', combined))
    citations_markers = sum(1 for p in CREDIBLE_INDICATORS if re.search(p, text_lower))
    total_citations = quotes_count + citations_markers

    if total_citations == 0:
        citation_score = 40
        citation_detail = "No quotes or verifiable source attribution found"
        citation_status = "fail"
    elif total_citations == 1:
        citation_score = 65
        citation_detail = "Limited citation markers (1 quote/reference found)"
        citation_status = "warn"
    elif total_citations == 2:
        citation_score = 85
        citation_detail = "Good citation density (2 quotes/references found)"
        citation_status = "pass"
    else:
        citation_score = 98
        citation_detail = f"Strong source attribution ({total_citations} quotes/references found)"
        citation_status = "pass"

    signals.append({
        "name": "Citation Count",
        "score": citation_score,
        "icon": "📋",
        "status": citation_status,
        "detail": citation_detail
    })

    # ── 3. Clickbait Score ────────────────────────────────────────
    clickbait_matches = []
    for pattern in CLICKBAIT_PATTERNS:
        if re.search(pattern, combined, re.IGNORECASE):
            clickbait_matches.append(re.search(pattern, combined, re.IGNORECASE).group())
    
    clickbait_score = max(15, 100 - len(clickbait_matches) * 35)
    if clickbait_score >= 80:
        clickbait_detail = "Headline and body style conform to objective standards"
        clickbait_status = "pass"
    elif clickbait_score >= 50:
        clickbait_detail = f"Sensational pattern matched: '{clickbait_matches[0]}'"
        clickbait_status = "warn"
    else:
        clickbait_detail = f"Multiple sensational clickbait patterns found: {', '.join(clickbait_matches[:2])}"
        clickbait_status = "fail"

    signals.append({
        "name": "Clickbait Score",
        "score": clickbait_score,
        "icon": "🎣",
        "status": clickbait_status,
        "detail": clickbait_detail
    })

    # ── 4. Author Credibility ─────────────────────────────────────
    byline_patterns = [
        r'\bby\s+[a-z]{3,}\s+[a-z]{3,}\b',
        r'\breported\s+by\b',
        r'\bwritten\s+by\b',
        r'\bjournalist\b',
        r'\breporter\b'
    ]
    has_byline = any(re.search(pat, text_lower) for pat in byline_patterns)
    has_agency = any(agency in text_lower for agency in ['reuters', 'associated press', 'bloomberg', 'bbc'])

    if has_byline or has_agency:
        author_score = 90
        author_detail = "Identified professional writer or editorial byline"
        author_status = "pass"
    else:
        author_score = 55
        author_detail = "Anonymous submission; missing formal author byline or agency credit"
        author_status = "warn"

    signals.append({
        "name": "Author Credibility",
        "score": author_score,
        "icon": "✍️",
        "status": author_status,
        "detail": author_detail
    })

    # ── 5. Grammar & Style Check ──────────────────────────────────
    all_caps_words = re.findall(r'\b[A-Z]{3,}\b', text)
    all_caps_filtered = [w for w in all_caps_words if w not in {'USA','UK','EU','UN','FBI','CIA','WHO','NASA','IPL','ICC'}]
    exclaim_count = combined.count('!')
    
    grammar_score = 100
    details = []

    if len(all_caps_filtered) > 1:
        grammar_score -= min(30, len(all_caps_filtered) * 10)
        details.append(f"Excessive capitals ({len(all_caps_filtered)} words)")
    if exclaim_count > 1:
        grammar_score -= min(30, exclaim_count * 10)
        details.append(f"Unprofessional punctuation ({exclaim_count} exclamation marks)")
    if word_count < 35:
        grammar_score -= 25
        details.append("Very short text body")

    grammar_score = max(10, grammar_score)
    if grammar_score >= 80:
        grammar_detail = "Standard professional grammar and punctuation styling"
        grammar_status = "pass"
    elif grammar_score >= 50:
        grammar_detail = f"Styling anomalies: {', '.join(details)}"
        grammar_status = "warn"
    else:
        grammar_detail = f"Highly sensational style: {', '.join(details)}"
        grammar_status = "fail"

    signals.append({
        "name": "Grammar Check",
        "score": grammar_score,
        "icon": "🔤",
        "status": grammar_status,
        "detail": grammar_detail
    })

    # ── Composite Score ───────────────────────────────────────────
    avg_signal_score = sum(s["score"] for s in signals) / len(signals)
    credibility_score = round(avg_signal_score)

    if credibility_score >= 75:
        credibility_label = "HIGH CREDIBILITY"
        credibility_color = "green"
    elif credibility_score >= 55:
        credibility_label = "MODERATE CREDIBILITY"
        credibility_color = "cyan"
    elif credibility_score >= 35:
        credibility_label = "LOW CREDIBILITY"
        credibility_color = "amber"
    else:
        credibility_label = "VERY LOW CREDIBILITY"
        credibility_color = "red"

    return {
        "credibility_score": credibility_score,
        "credibility_label": credibility_label,
        "credibility_color": credibility_color,
        "signals": signals,
        "word_count": word_count,
        "sensational_word_count": len(all_caps_filtered),
        "clickbait_patterns_found": len(clickbait_matches),
    }

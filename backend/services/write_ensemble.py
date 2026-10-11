import os

content = """\
\"\"\"
ensemble_service.py - Multi-Signal Ensemble for Accurate Fake vs Real News Detection.
Combines ML text classification, myth pattern matching, and domain credibility.
\"\"\"

import re
from typing import Optional
from urllib.parse import urlparse

AUTHORITATIVE_INDIAN_DOMAINS = {
    "mohfw.gov.in", "icmr.gov.in", "aiims.edu", "pib.gov.in",
    "nvbdcp.gov.in", "tbcindia.gov.in", "tmc.gov.in", "nirt.res.in",
    "nhp.gov.in", "ncdc.gov.in", "cdsco.gov.in",
    "thehindu.com", "timesofindia.indiatimes.com", "indianexpress.com",
    "ndtv.com", "hindustantimes.com", "theprint.in", "scroll.in",
    "thewire.in", "livemint.com", "businessstandard.com",
    "who.int", "cdc.gov", "reuters.com", "apnews.com",
    "factcheck.pib.gov.in", "factchecker.in", "boomlive.in", "altnews.in",
}

AUTHORITY_TEXT_MENTIONS = [
    "icmr", "mohfw", "aiims", "ministry of health", "pib fact check",
    "tata memorial", "the hindu", "times of india", "indian express",
    "ndtv", "who india", "world health organization", "reuters",
    "nvbdcp", "ntep", "national health portal",
]

MYTH_PATTERNS = [
    r"gomutra.{0,10}cures?.{0,10}covid",
    r"cow.{0,10}urine.{0,10}cures?.{0,10}covid",
    r"coronil.{0,10}cures?.{0,10}covid",
    r"vaccines?.{0,10}alter.{0,10}dna",
    r"mrna.{0,10}alters?.{0,10}dna",
    r"5g.{0,10}causes?.{0,10}covid",
    r"bleach.{0,10}cures?.{0,10}covid",
    r"garlic.{0,10}cures?.{0,10}covid",
    r"hot water.{0,10}kills?.{0,10}corona",
    r"steam.{0,10}kills?.{0,10}corona",
    r"covishield.{0,10}causes?.{0,10}heart attack",
    r"papaya.{0,10}leaf.{0,10}cures?.{0,10}dengue",
    r"goat.{0,10}milk.{0,10}cures?.{0,10}dengue",
    r"kiwi.{0,10}cures?.{0,10}dengue",
    r"aspirin.{0,10}cures?.{0,10}dengue",
    r"karela.{0,10}cures?.{0,10}diabetes",
    r"bitter gourd.{0,10}cures?.{0,10}diabetes",
    r"jamun.{0,10}eliminates?.{0,10}diabetes",
    r"diabetics?.{0,10}should.{0,10}stop.{0,10}insulin",
    r"cinnamon.{0,10}cures?.{0,10}diabetes",
    r"gomutra.{0,10}cures?.{0,10}cancer",
    r"cow.{0,10}urine.{0,10}cures?.{0,10}cancer",
    r"turmeric.{0,10}cures?.{0,10}cancer",
    r"baking soda.{0,10}cures?.{0,10}cancer",
    r"chemotherapy.{0,10}worse.{0,10}than.{0,10}cancer",
    r"tb.{0,10}is.{0,10}genetic",
    r"tb.{0,10}is.{0,10}hereditary",
    r"tuberculosis.{0,10}cannot.{0,10}be.{0,10}cured",
    r"vaccines?.{0,10}cause.{0,10}autism",
    r"vaccines?.{0,10}cause.{0,10}infertility",
    r"vaccines?.{0,10}contain.{0,10}microchips?",
]


def extract_domain(url):
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


def check_myth_match(text):
    text_lower = text.lower()
    for pattern in MYTH_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            return match.group()
    return None


def compute_ensemble(ml_result, credibility, source_url=None, title="", text=""):
    combined_text = (title + " " + text).strip()
    text_lower = combined_text.lower()

    # Signal 1: Myth Detection (Hard Override)
    myth_match = check_myth_match(combined_text)
    if myth_match:
        fake_prob = round(min(96.0, 88 + min(8, len(myth_match) * 0.5)), 1)
        real_prob = round(100 - fake_prob, 1)
        return {
            "prediction": "fake",
            "confidence": fake_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "ensemble_method": "MYTH_OVERRIDE: Matched known clinical myth — " + myth_match,
            "model_version": "ensemble-v2-myth",
        }

    # Signal 2: Authoritative Source Override
    domain = extract_domain(source_url)
    is_authoritative_domain = domain in AUTHORITATIVE_INDIAN_DOMAINS
    found_authority_mentions = [m for m in AUTHORITY_TEXT_MENTIONS if m in text_lower]
    is_authoritative_text = len(found_authority_mentions) >= 1
    credibility_score = credibility.get("credibility_score", 50)

    if is_authoritative_domain and credibility_score >= 60:
        real_prob = round(min(95, 78 + (credibility_score - 60) * 0.4), 1)
        fake_prob = round(100 - real_prob, 1)
        return {
            "prediction": "real",
            "confidence": real_prob,
            "fake_probability": fake_prob,
            "real_probability": real_prob,
            "ensemble_method": "AUTHORITY_DOMAIN: Verified publisher (" + domain + "), credibility=" + str(credibility_score),
            "model_version": "ensemble-v2-authority",
        }

    # Signal 3: Blend ML + Credibility (40% ML, 60% credibility)
    ml_real_prob = ml_result.get("real_probability", 50.0) / 100.0
    cred_real_factor = credibility_score / 100.0
    blended_real = (0.40 * ml_real_prob) + (0.60 * cred_real_factor)
    blended_fake = 1.0 - blended_real

    if is_authoritative_text and blended_real > 0.45:
        boost = min(0.10, len(found_authority_mentions) * 0.03)
        blended_real = min(0.95, blended_real + boost)
        blended_fake = 1.0 - blended_real

    prediction = "real" if blended_real >= 0.50 else "fake"
    winning_prob = blended_real if prediction == "real" else blended_fake
    confidence = max(52.0, min(round(winning_prob * 100, 1), 96.0))
    real_prob_final = round(blended_real * 100, 1)
    fake_prob_final = round(blended_fake * 100, 1)

    ml_pct = str(round(ml_real_prob * 100, 1))
    method_str = "BLEND(ML=" + ml_pct + "%real, Cred=" + str(credibility_score) + "/100)"
    if is_authoritative_text:
        method_str += " | AuthorityMention=" + found_authority_mentions[0].upper()

    return {
        "prediction": prediction,
        "confidence": confidence,
        "fake_probability": fake_prob_final,
        "real_probability": real_prob_final,
        "ensemble_method": method_str,
        "model_version": "ensemble-v2-blend",
    }
"""

dest = os.path.join(os.path.dirname(__file__), "ensemble_service.py")
with open(dest, "w", encoding="utf-8") as f:
    f.write(content)
print("OK wrote", dest)

"""
test_claim_extractor.py — Unit tests for TrustMe AI v2 claim extraction
"""

import pytest
import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT))

from services.claim_extractor import (
    extract_claims,
    detect_disease_context,
    is_declarative,
    split_sentences,
)


def test_split_sentences():
    text = "Drinking lemon juice cures COVID-19. This is a common rumor. Does it actually work? No, it does not."
    sents = split_sentences(text)
    assert len(sents) >= 3
    assert any("Drinking lemon juice" in s for s in sents)


def test_detect_disease_context():
    text = "Recent reports show an increase in COVID-19 coronavirus infections in metro cities."
    assert detect_disease_context(text) == "covid19"

    tb_text = "Tuberculosis is caused by mycobacterium tuberculosis and affects the lungs."
    assert detect_disease_context(tb_text) == "tuberculosis"

    dengue_text = "Dengue fever causes severe platelet drop and breakbone pain."
    assert detect_disease_context(dengue_text) == "dengue"

    diabetes_text = "Type 2 diabetes patients should monitor blood sugar and insulin levels."
    assert detect_disease_context(diabetes_text) == "diabetes"


def test_is_declarative():
    assert is_declarative("Drinking warm water prevents infection.") is True
    assert is_declarative("Does drinking warm water prevent infection?") is False
    assert is_declarative("Click here to subscribe!") is False


def test_extract_claims_sample_articles():
    # Sample article 1: COVID myth
    article = (
        "Breaking health update: Drinking warm water with garlic completely cures COVID-19 within 48 hours. "
        "Many families across the country have reported immediate recovery after using this homemade remedy. "
        "Can this replace hospital treatment? Health experts urge caution, but viral messages continue spreading."
    )
    claims = extract_claims(article, disease="covid19")
    assert len(claims) >= 1
    assert any("cures" in c.lower() or "garlic" in c.lower() for c in claims)
    # Question sentence should NOT be in claims
    assert not any(c.endswith("?") for c in claims)

    # Sample article 2: Dengue claim
    dengue_article = (
        "Consuming papaya leaf extract increases blood platelet count in severe dengue infections. "
        "Mosquito bites from Aedes aegypti transmit the dengue virus during daylight hours."
    )
    claims_dengue = extract_claims(dengue_article, disease="dengue")
    assert len(claims_dengue) >= 1

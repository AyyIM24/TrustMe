import pickle
import os
import re
from services.credibility_service import analyze_credibility
from services.disease_kb import detect_disease, check_against_kb

# Load baseline model
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(PROJECT_DIR, "model", "baseline", "model.pkl"), "rb") as f:
    model = pickle.load(f)
with open(os.path.join(PROJECT_DIR, "model", "baseline", "vectorizer.pkl"), "rb") as f:
    vectorizer = pickle.load(f)

def evaluate_article(title: str, text: str, source_url: str = None, source_name: str = None):
    combined = f"{title}. {text}" if title else text
    
    # 1. ML probability
    vec = vectorizer.transform([combined.lower()])
    proba = model.predict_proba(vec)[0]  # [fake_prob, real_prob]
    ml_real_prob = proba[1]
    ml_fake_prob = proba[0]
    
    # 2. Check Disease KB for known myths or facts
    d = detect_disease(combined)
    kb_res = check_against_kb(combined, d) if d else {}
    has_myth = kb_res.get("myth_signal", False)
    
    # 3. Credibility analysis
    cred = analyze_credibility(title, text, source_url)
    cred_score = cred["credibility_score"]  # 0 to 100
    
    # Check if from trusted Indian/global source
    trusted_sources = [
        "the hindu", "times of india", "icmr", "mohfw", "aiims", "pib", 
        "indian express", "ndtv", "who", "reuters", "google news"
    ]
    is_trusted_publisher = False
    if source_name and any(ts in source_name.lower() for ts in trusted_sources):
        is_trusted_publisher = True
    if source_url and any(ts in source_url.lower() for ts in ["thehindu.com", "timesofindia", "icmr.gov.in", "mohfw.gov.in", "aiims.edu", "pib.gov.in", "who.int", "ndtv.com"]):
        is_trusted_publisher = True
        
    # Multi-Signal Synthesis:
    # Rule 1: Direct myth signal = FAKE
    if has_myth:
        final_prediction = "fake"
        fake_pct = max(88.0, round(ml_fake_prob * 100, 2))
        real_pct = round(100.0 - fake_pct, 2)
        confidence = fake_pct
        reason = f"Contains known debunked clinical myth: {kb_res.get('matched_myths', ['unproven claim'])[0]}"
    
    # Rule 2: Trusted Indian publisher + High Credibility + NO myth signals = REAL
    elif is_trusted_publisher and cred_score >= 70:
        final_prediction = "real"
        real_pct = max(82.0, min(96.0, round((ml_real_prob * 0.4 + (cred_score / 100) * 0.6) * 100, 2)))
        fake_pct = round(100.0 - real_pct, 2)
        confidence = real_pct
        reason = f"Verified clinical reporting from authoritative source ({source_name or 'trusted domain'})"
        
    # Rule 3: High credibility in general without sensationalism
    elif cred_score >= 80:
        final_prediction = "real"
        real_pct = max(75.0, round((ml_real_prob * 0.5 + (cred_score / 100) * 0.5) * 100, 2))
        fake_pct = round(100.0 - real_pct, 2)
        confidence = real_pct
        reason = "Consistent with medical consensus and authoritative source indicators"
        
    # Rule 4: Otherwise blend ML + Credibility
    else:
        blended_real = (ml_real_prob * 0.6 + (cred_score / 100) * 0.4)
        if blended_real >= 0.50:
            final_prediction = "real"
            real_pct = round(blended_real * 100, 2)
            fake_pct = round(100.0 - real_pct, 2)
            confidence = real_pct
            reason = "Clinical vocabulary matches verified health reporting patterns"
        else:
            final_prediction = "fake"
            fake_pct = round((1.0 - blended_real) * 100, 2)
            real_pct = round(100.0 - fake_pct, 2)
            confidence = fake_pct
            reason = "Lacks verifiable clinical citations or contains unverified health claims"

    return {
        "prediction": final_prediction,
        "confidence": confidence,
        "fake_probability": fake_pct,
        "real_probability": real_pct,
        "reason": reason
    }

test_articles = [
    ("Digital Health Resources Vital for Strengthening India's medical research", "New research from ICMR highlights the need for AI-driven clinical informatics in public hospitals.", "https://www.thehindu.com/sci-tech/health/article123.ece", "The Hindu Health"),
    ("India very close to achieving goal of eliminating tuberculosis: Nadda", "Union Health Minister JP Nadda stated that India has expanded free diagnosis through the Ni-kshay portal.", "https://timesofindia.indiatimes.com/health/tb-elimination", "Times of India Health"),
    ("ICMR and MoHFW release clinical protocols for diabetes management", "The Indian Council of Medical Research published updated dietary and pharmacological guidelines.", "https://www.icmr.gov.in/protocols/diabetes", "ICMR & MoHFW Wire"),
    ("Papaya leaf juice cures dengue fever and permanently raises platelets", "A natural home remedy that can replace hospital treatment for dengue patients.", "https://randomblog.com/remedies", "WhatsApp Forward"),
    ("Cow urine gomutra cures cancer tumors according to traditional healers", "Drinking fresh cow urine can eliminate cancerous cells within one week.", None, "Social Media Post"),
    ("Drinking bleach mixed with water cures coronavirus", "Doctors in South America claim miracle mineral solution kills virus in hours.", None, "Anonymous"),
]

for title, text, url, src in test_articles:
    res = evaluate_article(title, text, url, src)
    print(f"TITLE: {title[:55]}...")
    print(f"  Source: {src}")
    print(f"  VERDICT: {res['prediction'].upper()} ({res['confidence']}%) | Real: {res['real_probability']}% vs Fake: {res['fake_probability']}%")
    print(f"  Reason: {res['reason']}")
    print()

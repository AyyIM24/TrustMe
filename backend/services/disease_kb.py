"""
disease_kb.py — India-Centric Disease Knowledge Base for Authentic Clinical Fact Checking.

Contains verified medical facts and myth signals sourced from authoritative Indian and global bodies:
    - ICMR (Indian Council of Medical Research)
    - MoHFW (Ministry of Health and Family Welfare, Govt. of India)
    - AIIMS New Delhi (All India Institute of Medical Sciences)
    - Tata Memorial Centre (TMC Mumbai)
    - National Vector Borne Disease Control Programme (NVBDCP)
    - National TB Elimination Program (NTEP / Ni-kshay)
    - PIB Fact Check India
    - WHO India / South-East Asia Region (SEARO)

Defined Disease Scope for India:
    1. COVID-19 in India (Covaxin, Covishield, Protocols, Gomutra/Kadha myths)
    2. Tuberculosis (NTEP DOTS, Airborne Transmission, Genetic/Herbal myths)
    3. Dengue & Vector-Borne (NVBDCP, Platelet protocol, Papaya leaf/Goat milk myths)
    4. Diabetes & Metabolic (ICMR-INDIAB study, Insulin, Karela/Jamun cure myths)
    5. Cancer in India (Tata Memorial Hospital, Gutkha/Oral, Alternative cure myths)
    6. Vaccines & Immunization (Mission Indradhanush, Pulse Polio, Infertility/Autism myths)
"""

import re
from typing import Optional, List, Dict

DISEASE_KB: Dict[str, dict] = {

    "covid19": {
        "display_name": "COVID-19 (India Scope)",
        "keywords": [
            "covid", "covid-19", "covid19", "coronavirus", "sars-cov-2",
            "sars cov 2", "corona virus", "pandemic", "omicron", "delta variant",
            "long covid", "covaxin", "covishield", "coronil", "gomutra", "kadha"
        ],
        "sources": [
            {"name": "MoHFW — Ministry of Health & Family Welfare India", "url": "https://www.mohfw.gov.in/"},
            {"name": "ICMR — Indian Council of Medical Research", "url": "https://www.icmr.gov.in/"},
            {"name": "AIIMS New Delhi — Clinical Management Protocols", "url": "https://www.aiims.edu/"},
            {"name": "PIB Fact Check India", "url": "https://factcheck.pib.gov.in/"},
            {"name": "WHO India — COVID-19 Health Advisory", "url": "https://www.who.int/india"},
        ],
        "facts": [
            "COVID-19 is an airborne respiratory infection caused by the SARS-CoV-2 virus, primarily spreading via aerosols and droplets.",
            "Covaxin (inactivated virus) and Covishield (viral vector) were rigorously evaluated and approved by DCGI and MoHFW.",
            "Approved COVID-19 vaccines do not alter, integrate into, or modify human DNA.",
            "Cow urine (Gomutra) and cow dung do not destroy SARS-CoV-2 or protect against COVID-19, as confirmed by ICMR and AIIMS.",
            "Coronil, herbal kadhas, and unverified traditional supplements cannot cure acute COVID-19 or replace oxygen therapy.",
            "Drinking hot water, inhaling steam, or consuming raw garlic does not kill coronavirus inside infected lung tissue.",
            "Wearing three-ply or N95 masks significantly limits aerosol transmission in indoor and crowded settings.",
            "5G cellular towers and electromagnetic waves do not transmit or generate the biological SARS-CoV-2 virus.",
            "Ivermectin and hydroxychloroquine were removed from MoHFW clinical guidelines due to lack of randomized efficacy.",
            "Severe COVID-19 can cause acute respiratory distress syndrome (ARDS) requiring medical oxygen and corticosteroids.",
        ],
        "myths": [
            "covid vaccines alter dna",
            "mrna vaccines alter dna",
            "vaccines alter dna",
            "covid-19 vaccines change human dna",
            "vaccines change human dna",
            "gomutra cures covid",
            "cow urine cures covid",
            "coronil cures covid",
            "drinking hot water kills coronavirus",
            "covaxin alters dna",
            "covishield causes heart attack",
            "5g causes covid",
            "5g towers spread coronavirus",
            "5g towers spread covid",
            "bleach cures covid",
            "garlic cures covid",
            "garlic and hot water cure covid",
            "garlic and hot water cure covid-19",
            "antibiotics cure covid",
            "antibiotics can cure covid-19",
            "antibiotics cure coronavirus",
            "steam inhalation kills coronavirus in lungs",
        ],
    },

    "tuberculosis": {
        "display_name": "Tuberculosis (India NTEP Scope)",
        "keywords": [
            "tuberculosis", "tb", "mycobacterium", "pulmonary tb", "dots",
            "nikshay", "ni-kshay", "mdr-tb", "xdr-tb", "rifampicin", "isoniazid",
            "bcg vaccine", "cough for two weeks", "mantoux test"
        ],
        "sources": [
            {"name": "Central TB Division — MoHFW (tbcindia.gov.in)", "url": "https://tbcindia.gov.in/"},
            {"name": "ICMR National Institute for Research in Tuberculosis (NIRT)", "url": "https://www.nirt.res.in/"},
            {"name": "AIIMS New Delhi — Department of Pulmonary Medicine", "url": "https://www.aiims.edu/"},
            {"name": "WHO India — National TB Elimination Program", "url": "https://www.who.int/india/health-topics/tuberculosis"},
        ],
        "facts": [
            "Tuberculosis is an infectious airborne bacterial disease caused by Mycobacterium tuberculosis, not a genetic disorder.",
            "India carries the highest global TB burden, and the Government of India provides free diagnosis and DOTS drugs via Ni-kshay.",
            "TB is 100% curable when the full 6-to-9 month course of first-line antibiotics (Rifampicin, Isoniazid, etc.) is completed.",
            "Stopping TB medication midway or relying on herbal remedies leads to life-threatening Multi-Drug Resistant TB (MDR-TB).",
            "Tuberculosis cannot be cured by raw garlic, turmeric, unproven homoeopathy, or dietary tonics alone.",
            "TB is spread through airborne droplets when an infected person coughs, sneezes, or spits; it does NOT spread by sharing food.",
            "BCG vaccination given at birth protects Indian children from severe complications like tubercular meningitis.",
            "A persistent cough lasting more than 2 weeks with fever and weight loss requires immediate sputum examination (CBNAAT/Truenat).",
        ],
        "myths": [
            "tb is genetic",
            "tb is hereditary",
            "tuberculosis is a hereditary disease",
            "tuberculosis is genetic",
            "tuberculosis cannot be cured",
            "eating garlic cures tb",
            "tb spreads by sharing food",
            "tuberculosis spreads by sharing food and utensils",
            "tb spreads by sharing food and utensils",
            "tb spreads by touching",
            "herbal medicine cures tuberculosis",
            "only poor people get tb",
            "mosquito bites spread tuberculosis",
            "mosquitoes spread tuberculosis",
            "mosquito bites spread tb",
        ],
    },

    "dengue": {
        "display_name": "Dengue & Vector-Borne (India NVBDCP Scope)",
        "keywords": [
            "dengue", "dengue fever", "aedes", "aedes aegypti", "platelets",
            "thrombocytopenia", "papaya leaf", "goat milk", "kiwi", "ns1 antigen",
            "dengue hemorrhagic fever", "breakbone fever", "vector borne"
        ],
        "sources": [
            {"name": "NVBDCP — National Vector Borne Disease Control Programme", "url": "https://nvbdcp.gov.in/"},
            {"name": "MoHFW — Dengue Clinical Management Guidelines", "url": "https://www.mohfw.gov.in/"},
            {"name": "ICMR — National Institute of Malaria Research (NIMR)", "url": "https://nimr.icmr.org.in/"},
            {"name": "AIIMS New Delhi — Emergency Medicine Guidelines", "url": "https://www.aiims.edu/"},
        ],
        "facts": [
            "Dengue is a viral infection transmitted by the bite of infected female Aedes aegypti mosquitoes, which bite during daytime.",
            "There is no direct antiviral cure for dengue; clinical care focuses on oral/intravenous fluid hydration and platelet monitoring.",
            "While papaya leaf extract (Carica papaya) has shown modest platelet stabilization in small trials, ICMR and AIIMS confirm it is NOT a curative drug and cannot replace hospital emergency care in severe dengue.",
            "Drinking raw goat milk or kiwi juice cannot cure dengue virus or instantly raise platelet counts; unpasteurized goat milk risks zoonotic brucellosis.",
            "Aspirin, Ibuprofen, and NSAIDs should strictly NEVER be given in suspected dengue as they trigger fatal gastrointestinal bleeding.",
            "Severe Dengue Hemorrhagic Fever (DHF) causes capillary leakage, plasma loss, and shock, requiring immediate intensive hospitalization.",
            "Paracetamol is the only safe antipyretic recommended by MoHFW for managing dengue fever.",
        ],
        "myths": [
            "papaya leaf juice cures dengue",
            "goat milk cures dengue",
            "kiwi juice cures dengue",
            "aspirin cures dengue",
            "brufen cures dengue",
            "dengue spreads through drinking water",
            "homeopathy belladonna prevents dengue",
            "platelet count below 50000 always requires immediate transfusion",
            "there is a specific medicine that cures dengue within one day",
            "specific medicine cures dengue",
            "specific medicine that cures dengue",
            "medicine cures dengue within one day",
            "cure dengue within one day",
        ],
    },

    "diabetes": {
        "display_name": "Diabetes & Metabolic (ICMR-INDIAB Scope)",
        "keywords": [
            "diabetes", "diabetic", "insulin", "blood sugar", "glucose", "type 1 diabetes",
            "type 2 diabetes", "karela", "jamun", "methi", "bitter gourd", "hba1c",
            "metformin", "icmr-indiab", "pancreas", "sugar cure"
        ],
        "sources": [
            {"name": "ICMR-INDIAB — National Diabetes Survey & Study", "url": "https://www.icmr.gov.in/"},
            {"name": "AIIMS New Delhi — Department of Endocrinology & Metabolism", "url": "https://www.aiims.edu/"},
            {"name": "RSSDI — Research Society for the Study of Diabetes in India", "url": "https://www.rssdi.in/"},
            {"name": "MoHFW National Health Portal", "url": "https://www.nhp.gov.in/disease/non-communicable-disease/diabetes"},
        ],
        "facts": [
            "The landmark ICMR-INDIAB study revealed that over 101 million Indians live with diabetes and 136 million with prediabetes.",
            "Type 1 diabetes is an autoimmune condition where beta cells are destroyed, requiring lifelong exogenous insulin to survive.",
            "Type 2 diabetes is a progressive metabolic condition combining insulin resistance with relative insulin deficiency.",
            "Drinking Karela (bitter gourd) juice, Jamun seed powder, or Methi water cannot cure diabetes or substitute for prescribed insulin.",
            "Abruptly discontinuing prescribed insulin or metformin in favor of unverified herbal churna can cause fatal Diabetic Ketoacidosis (DKA).",
            "Diabetes is not caused solely by consuming white sugar; genetics, abdominal visceral adiposity, and physical inactivity play major roles.",
            "People living with diabetes can safely eat whole low-glycemic fruits in controlled moderation as part of a balanced diet.",
            "HbA1c tests measure average blood glucose over 90 days; target levels should be monitored under a certified physician's care.",
        ],
        "myths": [
            "karela juice cures diabetes",
            "bitter gourd juice cures diabetes",
            "jamun powder eliminates diabetes",
            "herbal medicine cures type 1 diabetes",
            "diabetes can be cured completely by herbal juice alone",
            "herbal juice alone cures diabetes",
            "herbal juice cures diabetes",
            "diabetics should stop insulin",
            "diabetics should stop insulin once sugar becomes normal",
            "stop insulin once sugar becomes normal",
            "eating sugar directly causes diabetes",
            "diabetics cannot eat fruit",
            "cinnamon permanently cures diabetes",
        ],
    },

    "cancer": {
        "display_name": "Cancer in India (Tata Memorial Scope)",
        "keywords": [
            "cancer", "tumor", "tumour", "carcinoma", "malignant", "chemotherapy",
            "radiation therapy", "oncology", "biopsy", "tata memorial", "tmc",
            "oral cancer", "gutkha", "tobacco cancer", "cervical cancer", "breast cancer"
        ],
        "sources": [
            {"name": "Tata Memorial Centre (TMC Mumbai)", "url": "https://tmc.gov.in/"},
            {"name": "ICMR — National Centre for Disease Informatics and Research (NCDIR)", "url": "https://www.ncdirindia.org/"},
            {"name": "AIIMS New Delhi — Dr. B.R. Ambedkar Institute Rotary Cancer Hospital", "url": "https://www.aiims.edu/"},
            {"name": "WHO India — Cancer Country Profile", "url": "https://www.who.int/india/health-topics/cancer"},
        ],
        "facts": [
            "Tobacco and gutkha chewing are the leading causes of head and neck cancers across India, accounting for nearly 40% of all male cancers.",
            "Tata Memorial Hospital and ICMR emphasize that early diagnosis through screening dramatically increases 5-year survival rates.",
            "Surgery, chemotherapy, radiotherapy, and targeted immunotherapy are the clinically proven modalities for cancer cure and remission.",
            "Drinking cow urine (Gomutra), lemon water, or baking soda does not destroy malignant tumors; relying on them delays life-saving care.",
            "Cancer is not a contagious disease and cannot spread from one individual to another through physical contact or sharing meals.",
            "India's indigenously developed quadrivalent HPV vaccine (Cervavac) protects girls against high-risk strains causing cervical cancer.",
            "High doses of Vitamin C, apricot seeds (laetrile), or alkaline water have no proven scientific efficacy in eliminating solid tumors.",
        ],
        "myths": [
            "cow urine cures cancer",
            "gomutra cures cancer",
            "lemon water kills cancer cells",
            "baking soda cures cancer",
            "cancer is contagious",
            "biopsy causes cancer to spread rapidly",
            "sugar feeds cancer directly",
            "alkaline diet destroys tumors",
        ],
    },

    "vaccines": {
        "display_name": "Vaccines & Immunization (India UIP Scope)",
        "keywords": [
            "vaccine", "vaccination", "immunization", "mrna", "covaxin", "covishield",
            "pulse polio", "mission indradhanush", "mmr", "bcg", "hpv vaccine",
            "autism vaccine", "infertility vaccine", "uip", "adverse event"
        ],
        "sources": [
            {"name": "MoHFW — Universal Immunization Programme (UIP)", "url": "https://www.mohfw.gov.in/"},
            {"name": "ICMR — Vaccine Research & Immunology Division", "url": "https://www.icmr.gov.in/"},
            {"name": "AIIMS New Delhi — Department of Paediatrics", "url": "https://www.aiims.edu/"},
            {"name": "WHO India — Polio & Immunization Programme", "url": "https://www.who.int/india"},
        ],
        "facts": [
            "India's Universal Immunization Programme (UIP) prevents mortality from 12 vaccine-preventable childhood diseases.",
            "The Pulse Polio Immunization Campaign successfully eliminated wild poliovirus from India, certified polio-free by WHO in 2014.",
            "Oral polio drops (OPV) and Injectable polio vaccine (IPV) do not cause infertility or impotency in Indian children.",
            "The MMR vaccine does not cause autism; the original fraudulent claim was retracted by The Lancet and thoroughly debunked.",
            "Covaxin and Covishield underwent extensive multi-phase human trials evaluated by the SEC and DCGI in India.",
            "Vaccines do not contain microchips, RFID trackers, graphene oxide toxins, or animal-derived tracking implants.",
            "Vaccines train the human immune system to produce targeted antibodies without having to suffer the full disease itself.",
        ],
        "myths": [
            "polio drops cause infertility",
            "vaccines cause autism",
            "covaxin alters dna",
            "covishield causes sudden death",
            "vaccines contain microchips",
            "vaccines are unsafe",
            "natural infection is safer than vaccine",
            "pulse polio causes paralysis",
        ],
    },
}


def detect_disease(claim_text: str) -> Optional[str]:
    """Detect which defined Indian disease scope a claim belongs to."""
    claim_lower = claim_text.lower()
    
    # Priority matching by explicit keyword frequency
    scores: Dict[str, int] = {}
    for disease_id, data in DISEASE_KB.items():
        score = 0
        for kw in data["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', claim_lower):
                score += len(kw.split()) * 2
            elif kw in claim_lower:
                score += 1
        if score > 0:
            scores[disease_id] = score
            
    if scores:
        return max(scores, key=scores.get)
    return None


def check_against_kb(claim_text: str, disease_id: str) -> dict:
    """Check a claim against the authentic Indian Knowledge Base for a given disease."""
    if disease_id not in DISEASE_KB:
        return {"matched": False, "verdict": None, "confidence": 0, "facts": [], "myths_found": []}
        
    kb = DISEASE_KB[disease_id]
    claim_lower = claim_text.lower()
    
    # 1. Check for known myth patterns
    matched_myths = []
    for myth in kb["myths"]:
        myth_tokens = [t for t in myth.lower().split() if len(t) > 2]
        match_count = sum(1 for t in myth_tokens if t in claim_lower)
        if match_count >= max(2, len(myth_tokens) - 1):
            matched_myths.append(myth)
            
    # 2. Check for matching verified facts
    supporting_facts = []
    for fact in kb["facts"]:
        fact_tokens = [t for t in fact.lower().split() if len(t) > 3]
        matches = sum(1 for t in fact_tokens if t in claim_lower)
        if matches >= 2:
            supporting_facts.append(fact)
            
    # Calculate verdict based on authentic medical signals
    primary_source_names = ", ".join(s["name"].split("—")[0].strip() for s in kb["sources"][:2])
    if matched_myths:
        return {
            "matched": True,
            "disease": disease_id,
            "disease_display": kb["display_name"],
            "disease_name": kb["display_name"],
            "kb_verdict": "LIKELY FALSE",
            "verdict": "LIKELY FALSE (Known Clinical Misinformation)",
            "kb_confidence": 92 if len(matched_myths) > 1 else 86,
            "confidence": 92 if len(matched_myths) > 1 else 86,
            "kb_explanation": f"Contradicts verified clinical guidance from {primary_source_names}.",
            "myth_signal": True,
            "myth_signals": matched_myths,
            "matched_myths": matched_myths,
            "supporting_facts": supporting_facts[:3] or kb["facts"][:2],
            "authentic_sources": kb["sources"],
        }
    elif supporting_facts:
        return {
            "matched": True,
            "disease": disease_id,
            "disease_display": kb["display_name"],
            "disease_name": kb["display_name"],
            "kb_verdict": "LIKELY TRUE",
            "verdict": "LIKELY TRUE (Clinically Consistent)",
            "kb_confidence": 88,
            "confidence": 88,
            "kb_explanation": f"Consistent with verified clinical standards from {primary_source_names}.",
            "myth_signal": False,
            "myth_signals": [],
            "matched_myths": [],
            "supporting_facts": supporting_facts[:3],
            "authentic_sources": kb["sources"],
        }
    else:
        return {
            "matched": True,
            "disease": disease_id,
            "disease_display": kb["display_name"],
            "disease_name": kb["display_name"],
            "kb_verdict": "UNVERIFIABLE",
            "verdict": "NEEDS VERIFICATION (Within Disease Scope)",
            "kb_confidence": 50,
            "confidence": 50,
            "kb_explanation": f"Claim falls under {kb['display_name']} but requires specific clinician verification.",
            "myth_signal": False,
            "myth_signals": [],
            "matched_myths": [],
            "supporting_facts": kb["facts"][:2],
            "authentic_sources": kb["sources"],
        }


def get_all_diseases() -> List[dict]:
    """Return all defined disease scopes with their display names and authentic Indian sources."""
    return [
        {
            "id": d_id,
            "name": d_data["display_name"],
            "sources": d_data["sources"],
            "myths_count": len(d_data["myths"]),
            "facts_count": len(d_data["facts"]),
        }
        for d_id, d_data in DISEASE_KB.items()
    ]


# ── Curated Myth Veto Engine ──────────────────────────────────────────

_MYTH_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "by", "in", "of", "and",
    "or", "that", "with", "to", "for", "from", "can", "should", "be", "there",
    "has", "have", "had", "do", "does", "did", "it", "its", "at", "as", "about"
}

_SYNONYMS = {
    "tb": "tuberculosis",
    "covid": "coronavirus",
    "covid-19": "coronavirus",
    "covid19": "coronavirus",
    "corona": "coronavirus",
}


def _normalize_tokens(text: str) -> set:
    try:
        from nltk.stem import PorterStemmer
        stemmer = PorterStemmer()
        stem_fn = stemmer.stem
    except Exception:
        stem_fn = lambda w: w

    raw = re.findall(r"\b[a-zA-Z0-9'-]+\b", text.lower())
    result = set()
    for w in raw:
        canon = _SYNONYMS.get(w, w)
        if canon not in _MYTH_STOPWORDS and len(canon) >= 2:
            result.add(stem_fn(canon))
    return result


def check_known_myth_veto(claim_text: str, disease_hint: Optional[str] = None) -> Optional[dict]:
    """
    Known-myth veto: if the claim matches the curated myth list in disease_kb,
    it can NEVER be SUPPORTED.

    Returns:
        dict: {"myth": matched_myth_str, "badge": "Known myth (curated)"} or None
    """
    if not claim_text:
        return None

    claim_stems = _normalize_tokens(claim_text)
    claim_lower = claim_text.lower()

    # Scope to hint disease if valid
    if disease_hint and disease_hint in DISEASE_KB:
        diseases_to_check = [disease_hint]
    else:
        diseases_to_check = list(DISEASE_KB.keys())

    disease_keywords = {
        "tuberculosis": ["tb", "tuberculosis"],
        "covid19": ["covid", "coronavirus", "corona", "sars-cov-2", "vaccine", "5g"],
        "dengue": ["dengue", "aedes", "platelet"],
        "diabetes": ["diabetes", "diabetic", "insulin", "blood sugar", "sugar"],
        "cancer": ["cancer", "tumor", "tumour"],
    }

    for d in diseases_to_check:
        # If checking cross-disease without hint, ensure at least one keyword for that disease is present
        d_kws = disease_keywords.get(d, [d])
        if not any(kw in claim_lower for kw in d_kws):
            continue

        myths = DISEASE_KB[d].get("myths", [])
        for myth in myths:
            myth_lower = myth.lower()
            # 1. Direct substring check
            if myth_lower in claim_lower:
                return {
                    "myth": myth,
                    "badge": "Known myth (curated)",
                    "disease": d
                }

            # 2. Token overlap check
            myth_stems = _normalize_tokens(myth)
            if not myth_stems:
                continue

            # Ensure disease-specific words in myth are also in claim
            if any(w in myth_lower for w in ["tuberculosis", "tb"]) and not any(w in claim_lower for w in ["tuberculosis", "tb"]):
                continue
            if any(w in myth_lower for w in ["dengue"]) and "dengue" not in claim_lower:
                continue
            if any(w in myth_lower for w in ["covid", "coronavirus", "corona"]) and not any(w in claim_lower for w in ["covid", "coronavirus", "corona"]):
                continue

            overlap = len(myth_stems.intersection(claim_stems))
            if overlap == len(myth_stems) or (len(myth_stems) >= 3 and overlap / len(myth_stems) >= 0.75):
                return {
                    "myth": myth,
                    "badge": "Known myth (curated)",
                    "disease": d
                }

    return None


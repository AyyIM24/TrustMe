"""
disease_kb.py — Disease-Specific Knowledge Base for Authentic Fact Checking.

Contains verified medical facts sourced from WHO, CDC, NIH, and other
authoritative health organizations. Covers the defined scope:
    1. COVID-19
    2. Cancer
    3. Diabetes
    4. Vaccines

Used by the fact-check endpoint to verify claims against authentic medical
knowledge rather than just Wikipedia word overlap.
"""

from typing import Optional, List, Dict

# ─────────────────────────────────────────────────────────────────────────────
# DISEASE KNOWLEDGE BASE
# Each entry has:
#   - facts: list of verified facts (True statements)
#   - myths: list of known misinformation / false claims
#   - keywords: used to detect which disease the claim is about
#   - sources: authoritative source names + URLs
# ─────────────────────────────────────────────────────────────────────────────

DISEASE_KB: Dict[str, dict] = {

    "covid19": {
        "display_name": "COVID-19",
        "keywords": [
            "covid", "covid-19", "covid19", "coronavirus", "sars-cov-2",
            "sars cov 2", "corona virus", "pandemic", "omicron", "delta variant",
            "long covid", "post covid"
        ],
        "sources": [
            {"name": "WHO — COVID-19 Advice", "url": "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public"},
            {"name": "CDC — COVID-19", "url": "https://www.cdc.gov/coronavirus/2019-ncov/index.html"},
            {"name": "NIH — COVID-19", "url": "https://www.nih.gov/coronavirus"},
        ],
        "facts": [
            "COVID-19 is caused by the SARS-CoV-2 virus and primarily spreads through respiratory droplets.",
            "COVID-19 can spread through close contact with infected individuals via airborne particles.",
            "Wearing masks reduces the transmission of COVID-19 by limiting respiratory droplet spread.",
            "Hand hygiene and social distancing are effective measures to prevent COVID-19 spread.",
            "Common symptoms of COVID-19 include fever, cough, fatigue, and loss of taste or smell.",
            "COVID-19 symptoms typically appear 2 to 14 days after exposure to the virus.",
            "Some people infected with COVID-19 are asymptomatic but can still spread the virus.",
            "Severe COVID-19 can cause pneumonia, respiratory failure, and death in some patients.",
            "COVID-19 vaccines approved by WHO and regulatory authorities are safe and effective.",
            "mRNA COVID-19 vaccines do not alter or integrate into human DNA.",
            "COVID-19 vaccines teach the immune system to recognize and fight the SARS-CoV-2 virus.",
            "COVID-19 vaccines significantly reduce the risk of severe illness, hospitalization, and death.",
            "Booster doses of COVID-19 vaccines help maintain immunity over time.",
            "Antiviral medications such as Paxlovid and Remdesivir are FDA-approved for COVID-19 treatment.",
            "Ivermectin is not an approved or proven treatment for COVID-19 by WHO or FDA.",
            "Drinking bleach, chlorine dioxide, or household disinfectants does not cure COVID-19.",
            "5G networks do not cause or transmit COVID-19; viruses cannot travel on radio waves.",
            "COVID-19 is not caused by 5G towers or electromagnetic radiation.",
            "Long COVID refers to persistent symptoms lasting weeks or months after initial COVID-19 infection.",
            "Long COVID can affect multiple organ systems including the heart, lungs, and brain.",
        ],
        "myths": [
            "covid vaccines alter dna",
            "covid vaccines contain microchips",
            "5g causes covid",
            "bleach cures covid",
            "ivermectin cures covid",
            "covid is just a flu",
            "masks don't work",
            "covid vaccines are not safe",
            "covid was made in a lab to control population",
            "drinking hot water kills coronavirus",
            "garlic cures covid",
        ],
    },

    "cancer": {
        "display_name": "Cancer",
        "keywords": [
            "cancer", "tumor", "tumour", "carcinoma", "malignant", "chemotherapy",
            "radiation therapy", "oncology", "biopsy", "metastasis", "leukemia",
            "lymphoma", "breast cancer", "lung cancer", "colon cancer", "skin cancer"
        ],
        "sources": [
            {"name": "WHO — Cancer", "url": "https://www.who.int/news-room/fact-sheets/detail/cancer"},
            {"name": "NIH National Cancer Institute", "url": "https://www.cancer.gov/"},
            {"name": "American Cancer Society", "url": "https://www.cancer.org/"},
        ],
        "facts": [
            "Cancer is a leading cause of death worldwide, accounting for nearly 10 million deaths in 2020.",
            "Cancer arises from the transformation of normal cells into tumor cells through genetic mutations.",
            "Common risk factors for cancer include tobacco use, alcohol consumption, obesity, and UV radiation.",
            "About one-third of cancer deaths are due to tobacco use, high BMI, alcohol, and low fruit and vegetable intake.",
            "Surgery, chemotherapy, radiation therapy, immunotherapy, and targeted therapy are standard cancer treatments.",
            "Early detection of cancer significantly improves survival rates and treatment outcomes.",
            "Some cancers can be cured, especially if detected early; treatment depends on cancer type and stage.",
            "Chemotherapy works by killing rapidly dividing cancer cells but can also affect healthy cells.",
            "Immunotherapy helps the immune system recognize and attack cancer cells.",
            "Regular cancer screenings such as mammograms, colonoscopies, and Pap smears help detect cancer early.",
            "HPV vaccination prevents infection with high-risk human papillomavirus strains that cause cervical cancer.",
            "Hepatitis B vaccination reduces the risk of liver cancer.",
            "Vitamin C in high doses does not eliminate cancerous tumors despite some claims.",
            "Cancer is not contagious and cannot spread from person to person through contact.",
            "Sugar does not directly cause cancer; however, diets high in sugar can lead to obesity, which increases cancer risk.",
            "Baking soda does not cure cancer; no clinical evidence supports this claim.",
        ],
        "myths": [
            "vitamin c cures cancer",
            "sugar feeds cancer",
            "baking soda cures cancer",
            "cancer is contagious",
            "drinking lemon water kills cancer cells",
            "cannabis cures cancer",
            "alkaline water cures cancer",
            "cancer is a fungus",
        ],
    },

    "diabetes": {
        "display_name": "Diabetes",
        "keywords": [
            "diabetes", "diabetic", "insulin", "blood sugar", "glucose", "type 1 diabetes",
            "type 2 diabetes", "hyperglycemia", "hypoglycemia", "hba1c", "metformin",
            "pancreas", "gestational diabetes", "pre-diabetes", "prediabetes"
        ],
        "sources": [
            {"name": "WHO — Diabetes", "url": "https://www.who.int/news-room/fact-sheets/detail/diabetes"},
            {"name": "CDC — Diabetes", "url": "https://www.cdc.gov/diabetes/"},
            {"name": "NIH — Diabetes", "url": "https://www.niddk.nih.gov/health-information/diabetes"},
        ],
        "facts": [
            "Diabetes is a chronic disease that occurs when the pancreas does not produce enough insulin or cannot use it effectively.",
            "There were 422 million people living with diabetes worldwide as of 2014, according to WHO.",
            "Type 1 diabetes is an autoimmune condition where the body cannot produce insulin.",
            "Type 2 diabetes is the most common form, often associated with obesity and physical inactivity.",
            "Gestational diabetes occurs during pregnancy and increases risk of type 2 diabetes later.",
            "Common symptoms of diabetes include increased thirst, frequent urination, fatigue, and blurred vision.",
            "Diabetes can cause serious complications including heart disease, kidney failure, and blindness.",
            "Diabetic foot complications can lead to lower limb amputation if untreated.",
            "Diabetes management includes healthy diet, physical activity, and medication such as metformin or insulin.",
            "Regular blood glucose monitoring is essential for diabetes management.",
            "Type 2 diabetes can often be prevented or delayed with lifestyle changes including weight loss and exercise.",
            "A balanced diet low in refined sugars and high in fiber helps manage blood glucose levels in diabetics.",
            "Insulin does not cause weight gain as a primary effect; weight changes depend on overall diet and lifestyle.",
            "People with diabetes can eat fruit in moderation as part of a balanced diet.",
            "Diabetes is not caused solely by eating too much sugar; multiple factors including genetics are involved.",
        ],
        "myths": [
            "eating sugar causes diabetes",
            "diabetics cannot eat fruit",
            "insulin is dangerous",
            "diabetes can be cured by cinnamon",
            "only obese people get diabetes",
            "type 2 diabetes is not serious",
            "diabetics should avoid all carbohydrates",
        ],
    },

    "vaccines": {
        "display_name": "Vaccines & Immunization",
        "keywords": [
            "vaccine", "vaccination", "immunization", "mrna", "mmr", "flu shot",
            "booster", "adjuvant", "herd immunity", "anti-vaccine", "antivax",
            "autism vaccine", "polio vaccine", "measles vaccine", "hpv vaccine",
            "pfizer", "moderna", "astrazeneca", "johnson", "covaxin", "covishield"
        ],
        "sources": [
            {"name": "WHO — Vaccines & Immunization", "url": "https://www.who.int/immunization/"},
            {"name": "CDC — Vaccines & Immunization", "url": "https://www.cdc.gov/vaccines/"},
            {"name": "NIH — Vaccine Research", "url": "https://www.niaid.nih.gov/research/vaccine-research-center"},
        ],
        "facts": [
            "Vaccines are among the most effective public health interventions, saving millions of lives annually.",
            "Vaccines work by training the immune system to recognize and fight specific pathogens.",
            "WHO recommends a schedule of vaccines to protect children and adults from preventable diseases.",
            "Herd immunity occurs when a sufficient proportion of a population is immune, protecting those who cannot be vaccinated.",
            "Vaccines undergo rigorous safety testing in clinical trials before regulatory approval.",
            "Serious adverse events from vaccines are rare; benefits vastly outweigh the risks.",
            "mRNA vaccines do not contain live virus and cannot cause the disease they protect against.",
            "mRNA from vaccines is broken down by the body quickly and does not alter human DNA.",
            "Vaccines do not contain microchips, tracking devices, or harmful levels of toxic substances.",
            "The MMR vaccine does not cause autism; multiple large-scale studies have confirmed this.",
            "The study claiming a link between MMR vaccine and autism was retracted due to scientific fraud.",
            "The HPV vaccine prevents infections that can lead to cervical cancer and other cancers.",
            "Flu vaccines are reformulated annually to match circulating influenza strains.",
            "Polio vaccines have led to near eradication of polio globally.",
            "Aluminum salts used as adjuvants in vaccines are present in quantities far below harmful levels.",
            "Thimerosal-containing vaccines use a form of ethylmercury that is quickly eliminated from the body.",
        ],
        "myths": [
            "vaccines cause autism",
            "mmr causes autism",
            "vaccines contain microchips",
            "vaccines alter dna",
            "vaccines are unsafe",
            "vaccines cause the disease",
            "natural immunity is always better than vaccine immunity",
            "vaccines contain harmful toxins",
            "flu vaccine gives you flu",
            "hpv vaccine promotes promiscuity",
        ],
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────────────────────

def detect_disease(text: str) -> Optional[str]:
    """
    Detect which disease (if any) a claim is about.
    Returns the disease key (e.g. 'covid19', 'cancer') or None.
    """
    text_lower = text.lower()
    best_match = None
    best_count = 0

    for disease_key, disease_data in DISEASE_KB.items():
        count = sum(1 for kw in disease_data["keywords"] if kw in text_lower)
        if count > best_count:
            best_count = count
            best_match = disease_key

    return best_match if best_count > 0 else None


def check_against_kb(claim: str, disease_key: str) -> Dict:
    """
    Check a claim against the knowledge base for the detected disease.
    Returns a structured result with verdict, supporting facts, and source URLs.
    """
    disease = DISEASE_KB[disease_key]
    claim_lower = claim.lower()

    STOPWORDS = {
        "the", "a", "an", "is", "are", "was", "were", "of", "in",
        "on", "at", "to", "and", "or", "but", "for", "with", "that",
        "this", "by", "from", "not", "can", "do", "does", "its"
    }

    # --- Check for known myths (misinformation indicators) ---
    myth_matches = []
    for myth in disease["myths"]:
        myth_words = set(myth.split()) - STOPWORDS
        claim_words = set(claim_lower.split()) - STOPWORDS
        overlap = myth_words & claim_words
        if len(overlap) >= max(1, len(myth_words) * 0.6):
            myth_matches.append(myth)

    # --- Check for fact support ---
    fact_overlap_scores = []
    for fact in disease["facts"]:
        fact_words = set(fact.lower().split()) - STOPWORDS
        claim_words_set = set(claim_lower.split()) - STOPWORDS

        if not claim_words_set or not fact_words:
            continue

        overlap = claim_words_set & fact_words
        score = len(overlap) / max(len(claim_words_set), 1)
        fact_overlap_scores.append((score, fact))

    fact_overlap_scores.sort(key=lambda x: x[0], reverse=True)
    supporting_facts = [
        {"fact": f, "relevance": round(s * 100)}
        for s, f in fact_overlap_scores[:3]
        if s > 0.1
    ]

    # --- Determine verdict ---
    has_myth_signal = len(myth_matches) > 0
    has_fact_support = len(supporting_facts) > 0 and supporting_facts[0]["relevance"] > 20

    if has_myth_signal and not has_fact_support:
        kb_verdict = "LIKELY FALSE"
        kb_confidence = min(85, 50 + len(myth_matches) * 15)
        kb_explanation = (
            f"This claim matches known {disease['display_name']} misinformation patterns "
            f"identified by WHO/CDC/NIH. The claim aligns with debunked myths: "
            f"'{myth_matches[0]}'."
        )
    elif has_myth_signal and has_fact_support:
        kb_verdict = "MIXED / PARTIAL"
        kb_confidence = 45
        kb_explanation = (
            f"This claim contains both elements consistent with verified {disease['display_name']} "
            f"information and patterns associated with known misinformation. Verify with official sources."
        )
    elif has_fact_support:
        top_score = supporting_facts[0]["relevance"]
        if top_score >= 40:
            kb_verdict = "LIKELY TRUE"
            kb_confidence = min(90, 55 + top_score // 3)
        else:
            kb_verdict = "MIXED / PARTIAL"
            kb_confidence = 40
        kb_explanation = (
            f"The claim is consistent with verified {disease['display_name']} medical knowledge "
            f"from WHO, CDC, and NIH. The most relevant verified fact: "
            f"\"{supporting_facts[0]['fact'][:120]}...\""
        )
    else:
        kb_verdict = "UNVERIFIABLE"
        kb_confidence = 20
        kb_explanation = (
            f"The claim is related to {disease['display_name']} but could not be matched to "
            f"verified facts or known myths in our medical knowledge base. "
            f"Please consult official health authorities."
        )

    return {
        "disease": disease_key,
        "disease_display": disease["display_name"],
        "kb_verdict": kb_verdict,
        "kb_confidence": kb_confidence,
        "kb_explanation": kb_explanation,
        "supporting_facts": supporting_facts,
        "myth_signals": myth_matches[:3],
        "authentic_sources": disease["sources"],
    }


def get_all_diseases() -> List[Dict]:
    """Return a summary list of all diseases in scope."""
    return [
        {
            "key": key,
            "display_name": data["display_name"],
            "source_count": len(data["sources"]),
            "fact_count": len(data["facts"]),
            "sources": data["sources"],
        }
        for key, data in DISEASE_KB.items()
    ]

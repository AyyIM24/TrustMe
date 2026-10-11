"""
scripts/generate_unseen_articles.py — Generates unseen test articles for M6 evaluation
"""

import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTICLES_DIR = os.path.join(PROJECT_ROOT, "eval", "unseen_articles")

ARTICLES = {
    "covid_myth_garlic.txt": """URGENT HEALTH ALERT: BOILED GARLIC WATER CURES CORONAVIRUS
A senior doctor from a top hospital has shared a miracle remedy. If you drink eight glasses of boiled garlic water every morning, the COVID-19 virus is completely cured within forty-eight hours. The high sulfur content in garlic kills all virus cells in the blood and throat. Please forward this life-saving message to all your family groups immediately. Do not keep this secret to yourself.""",

    "covid_real_mohfw_advisory.txt": """MINISTRY OF HEALTH ISSUES UPDATED CLINICAL GUIDELINES FOR COVID-19 MANAGEMENT
New Delhi: The Ministry of Health and Family Welfare today released updated clinical management protocols for COVID-19 patients across the country. According to the advisory, COVID-19 spreads primarily through respiratory droplets and aerosols. Health authorities reiterated that wearing well-fitted masks in crowded indoor settings and maintaining regular hand hygiene remain vital preventive measures. Older adults and individuals with diabetes or hypertension are advised to take precautionary vaccine doses to minimize risks of severe illness and hospitalization.""",

    "tb_myth_herbal_cure.txt": """BREAKTHROUGH: HERBAL TONIC CURES TUBERCULOSIS PERMANENTLY WITHOUT ANTIBIOTICS
Traditional healers in the northern hills have uncovered an ancient Ayurvedic root that eliminates Mycobacterium tuberculosis in just three weeks. Doctors want to keep you hooked on toxic hospital antibiotics like Rifampicin for six months, but this herbal water dissolves all lung bacteria naturally. Tuberculosis is actually a hereditary genetic blood disease, not an airborne infection, so antibiotics are completely useless. Throw away your hospital tablets today.""",

    "tb_real_ntep_report.txt": """NATIONAL TB ELIMINATION PROGRAM RELEASES ANNUAL SURVEILLANCE REPORT
The Central TB Division under the Ministry of Health reported significant progress under the Ni-kshay public health initiative. Tuberculosis is an infectious airborne bacterial disease caused by Mycobacterium tuberculosis, primarily affecting pulmonary tissues. Sputum molecular diagnostic tests such as Truenat and CBNAAT have been deployed across primary health centres to ensure early detection. Patients enrolled in DOTS treatment receive free first-line antibiotic regimens including Rifampicin and Isoniazid, which achieve cure rates above eighty-five percent when completed diligently.""",

    "dengue_myth_papaya_cure.txt": """MIRACLE DENGUE CURE: RAW GOAT MILK AND PAPAYA LEAF JUICE ELIMINATES VIRUS
Stop panicking over dropping platelet counts during dengue fever. Drinking two glasses of raw papaya leaf juice mixed with fresh goat milk instantly multiplies blood platelets within six hours and kills the dengue virus in your stomach. Hospitals admit patients only to make money on saline bottles, but this natural drink destroys dengue completely. Never take hospital injections or blood tests, just drink papaya juice twice a day.""",

    "dengue_real_nvbdcp_advisory.txt": """NVBDCP ISSUES NATIONAL DENGUE PREVENTION AND CLINICAL MANAGEMENT PROTOCOLS
The National Vector Borne Disease Control Programme released public guidelines for dengue management ahead of the monsoon season. Dengue is a viral infection transmitted to humans through the bites of infected female Aedes aegypti mosquitoes, which are active during daylight hours. Health officials emphasized that paracetamol is the safe antipyretic of choice, whereas non-steroidal anti-inflammatory drugs such as aspirin and ibuprofen must be strictly avoided due to increased bleeding risks. Preventing clean water accumulation in coolers and open pots is the primary preventive defense against vector breeding.""",

    "diabetes_myth_karela_cure.txt": """SAY GOODBYE TO INSULIN: BITTER GOURD JUICE REVERSES DIABETES PERMANENTLY
A viral health blog reveals that drinking raw bitter gourd and karela juice with lemon every sunrise completely reverses chronic diabetes mellitus. Big pharma keeps selling insulin to make billions, but karela juice reactivates the pancreas within seven days so patients can throw away their insulin needles and eat unlimited white sugar and sweets without checking their blood glucose ever again.""",

    "diabetes_real_icmr_report.txt": """ICMR-INDIAB NATIONWIDE STUDY HIGHLIGHTS DIETARY MANAGEMENT AND GLUCOSE CONTROL
Researchers from the Indian Council of Medical Research published comprehensive findings on glycemic regulation and metabolic health across Indian states. Diabetes is a chronic metabolic condition marked by elevated blood glucose levels resulting from insulin deficiency or peripheral resistance. Clinical experts recommend regular physical exercise, carbohydrate monitoring, and medical therapy such as Metformin to maintain target HbA1c levels below seven percent. Unchecked hyperglycemia significantly raises long-term risks of microvascular retinopathy, diabetic nephropathy, and cardiovascular complications.""",

    "finance_real_central_bank.txt": """CENTRAL BANK LEAVES BENCHMARK LENDING RATES UNCHANGED AMID STEADY INFLATION
Mumbai: The Monetary Policy Committee concluded its bi-monthly review today, voting unanimously to keep the key repo rate steady at six point five percent. Consumer price index inflation stabilized within the official target band, supported by declining fuel and food commodities prices. Banking sector liquidity remained adequate, and gross domestic product growth for the current fiscal quarter was projected at seven point two percent.""",

    "sports_cricket_tournament.txt": """CHAMPIONSHIP FINALS: NATIONAL CRICKET SQUAD SECURES HISTORIC VICTORY
Ahmedabad: In a thrilling day-night encounter watched by over ninety thousand spectators, the national cricket team lifted the trophy with a five-wicket win against the visiting team. Chasing a target of two hundred and eighty runs, the middle-order batsmen put together a decisive hundred-run partnership to steer the side home with twelve deliveries to spare.""",

    "tech_quantum_computing.txt": """LABORATORY DEMONSTRATES FAULT-TOLERANT LOGICAL QUBITS WITH ERROR CORRECTION
Researchers at an international quantum physics laboratory announced a milestone in quantum error correction. By entangling sixty physical superconducting qubits into eight fault-tolerant logical qubits, the computational coherence time increased by an order of magnitude. The team published their benchmarks demonstrating that quantum algorithms executed with error suppression rates exceeding previous physical thresholds.""",

    "dengue_real_warning_signs.txt": """CRITICAL CLINICAL SIGNS OF SEVERE DENGUE AND HOSPITAL ADMISSION CRITERIA
Medical experts at premier government hospitals have issued guidance on monitoring dengue patients at home. While most dengue infections follow a mild, self-limiting course manageable with oral hydration and paracetamol, patients must watch for warning signs during the defervescence phase. Persistent vomiting, severe abdominal pain, rapid breathing, and bleeding from the gums or nose signify impending dengue shock syndrome requiring urgent intravenous fluid therapy under inpatient supervision.""",
}


def main():
    os.makedirs(ARTICLES_DIR, exist_ok=True)
    for filename, content in ARTICLES.items():
        fpath = os.path.join(ARTICLES_DIR, filename)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"Created {filename} ({len(content.split())} words)")
    print(f"\nGenerated {len(ARTICLES)} unseen test articles in {ARTICLES_DIR}")


if __name__ == "__main__":
    main()

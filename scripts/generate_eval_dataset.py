"""
scripts/generate_eval_dataset.py — Generates eval/eval_claims.csv

Creates 125 labeled health claims:
  - 25 COVID-19 claims (13 refuted, 12 supported)
  - 25 Tuberculosis claims (13 refuted, 12 supported)
  - 25 Dengue claims (13 refuted, 12 supported)
  - 25 Diabetes claims (13 refuted, 12 supported)
  - 25 Out-of-scope claims (finance, technology, politics, general science)
"""

import csv
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL_CSV = os.path.join(PROJECT_ROOT, "eval", "eval_claims.csv")

CLAIMS_DATA = [
    # ── COVID-19 (25) ────────────────────────────────────────────────────────
    # Refuted (13)
    (1, "Drinking boiled garlic water cures COVID-19 coronavirus within forty-eight hours.", "covid19", "REFUTED", "MISLEADING", "WHO Mythbusters - Garlic"),
    (2, "Inhaling steam kills the coronavirus instantly in the lungs.", "covid19", "REFUTED", "MISLEADING", "MoHFW / AIIMS Advisory"),
    (3, "Drinking cow urine or gomutra protects against SARS-CoV-2 infection.", "covid19", "REFUTED", "MISLEADING", "ICMR Myth Debunk"),
    (4, "COVID-19 vaccines alter human DNA permanently.", "covid19", "REFUTED", "MISLEADING", "CDC / WHO Fact Sheet"),
    (5, "5G mobile network radiation causes coronavirus transmission.", "covid19", "REFUTED", "MISLEADING", "WHO Q&A on 5G"),
    (6, "Drinking bleach or chlorine disinfectants kills COVID-19 inside the body.", "covid19", "REFUTED", "MISLEADING", "CDC Warning"),
    (7, "Holding your breath for ten seconds without coughing proves you are free from COVID-19.", "covid19", "REFUTED", "MISLEADING", "WHO Health Advisory"),
    (8, "Spraying alcohol all over your body destroys viruses that have already entered the respiratory system.", "covid19", "REFUTED", "MISLEADING", "WHO Mythbusters"),
    (9, "Hot pepper in soup prevents and cures COVID-19 infection.", "covid19", "REFUTED", "MISLEADING", "WHO Food Myths"),
    (10, "Houseflies transmit the SARS-CoV-2 coronavirus to humans.", "covid19", "REFUTED", "MISLEADING", "WHO Vector Q&A"),
    (11, "Exposing yourself to direct sunlight cures COVID-19 coronavirus disease.", "covid19", "REFUTED", "MISLEADING", "WHO Fact Sheet"),
    (12, "Antibiotics are effective in curing COVID-19 viral infections.", "covid19", "REFUTED", "MISLEADING", "WHO Antimicrobial Resistance"),
    (13, "Eating raw onions with rock salt eliminates coronavirus from the bloodstream.", "covid19", "REFUTED", "MISLEADING", "PIB Fact Check India"),
    # Supported (12)
    (14, "COVID-19 spreads primarily through respiratory droplets and aerosols when an infected person coughs or speaks.", "covid19", "SUPPORTED", "RELIABLE", "WHO COVID-19 Transmission Fact Sheet"),
    (15, "Wearing well-fitted masks significantly reduces transmission of the SARS-CoV-2 virus in indoor settings.", "covid19", "SUPPORTED", "RELIABLE", "CDC Mask Guidelines"),
    (16, "COVID-19 vaccination lowers the risk of severe illness, hospitalization, and death.", "covid19", "SUPPORTED", "RELIABLE", "CDC Vaccine Efficacy Data"),
    (17, "Fever, cough, and fatigue are common symptoms of COVID-19 infection.", "covid19", "SUPPORTED", "RELIABLE", "WHO Clinical Symptoms"),
    (18, "Older adults and people with pre-existing medical conditions face higher risk of severe COVID-19 illness.", "covid19", "SUPPORTED", "RELIABLE", "WHO High Risk Populations"),
    (19, "Frequent hand hygiene with soap and water helps prevent the transmission of COVID-19.", "covid19", "SUPPORTED", "RELIABLE", "WHO Prevention Guidelines"),
    (20, "Physical distancing reduces the risk of SARS-CoV-2 transmission in crowded environments.", "covid19", "SUPPORTED", "RELIABLE", "MoHFW Advisory"),
    (21, "Loss of taste or smell can occur as a symptom of coronavirus infection.", "covid19", "SUPPORTED", "RELIABLE", "CDC COVID-19 Symptoms"),
    (22, "Adequate ventilation in indoor spaces reduces airborne transmission of COVID-19.", "covid19", "SUPPORTED", "RELIABLE", "WHO Ventilation Guidelines"),
    (23, "Rapid antigen tests can detect active SARS-CoV-2 viral proteins.", "covid19", "SUPPORTED", "RELIABLE", "ICMR Testing Protocols"),
    (24, "Severely ill COVID-19 patients may require medical oxygen therapy and dexamethasone.", "covid19", "SUPPORTED", "RELIABLE", "WHO Clinical Management Guidelines"),
    (25, "Post-COVID condition or Long COVID involves symptoms continuing weeks after acute infection.", "covid19", "SUPPORTED", "RELIABLE", "WHO Long COVID Definition"),

    # ── Tuberculosis (25) ────────────────────────────────────────────────────
    # Refuted (13)
    (26, "Tuberculosis is a hereditary genetic disease that cannot be treated with modern antibiotics.", "tuberculosis", "REFUTED", "MISLEADING", "MoHFW / NTEP Guidelines"),
    (27, "Eating raw garlic cures pulmonary tuberculosis without prescribed DOTS medication.", "tuberculosis", "REFUTED", "MISLEADING", "NTEP Fact Sheet"),
    (28, "Tuberculosis spreads by shaking hands or sharing drinking glasses with an infected person.", "tuberculosis", "REFUTED", "MISLEADING", "CDC TB Transmission Facts"),
    (29, "Drinking raw milk straight from infected cows protects humans from tuberculosis.", "tuberculosis", "REFUTED", "MISLEADING", "WHO Zoonotic TB Advisory"),
    (30, "TB patients can safely stop taking antibiotics as soon as their cough stops after two weeks.", "tuberculosis", "REFUTED", "MISLEADING", "NTEP Treatment Adherence"),
    (31, "Ayurvedic herbal tonics can replace first-line anti-TB chemotherapy regimens.", "tuberculosis", "REFUTED", "MISLEADING", "AIIMS Pulmonary Department"),
    (32, "Tuberculosis only affects poor individuals and never infects wealthy people.", "tuberculosis", "REFUTED", "MISLEADING", "WHO Social Determinants"),
    (33, "Tuberculosis is caused by bad weather and cold mountain air rather than bacteria.", "tuberculosis", "REFUTED", "MISLEADING", "CDC TB Etiology"),
    (34, "Touching clothing worn by a TB patient transmits pulmonary tuberculosis infection.", "tuberculosis", "REFUTED", "MISLEADING", "CDC TB Infection Control"),
    (35, "Spitting on the ground is harmless and cannot transmit airborne tuberculosis bacteria.", "tuberculosis", "REFUTED", "MISLEADING", "NTEP Public Health Advisory"),
    (36, "A positive Mantoux skin test means a patient definitely has active contagious tuberculosis.", "tuberculosis", "REFUTED", "MISLEADING", "CDC Latent TB Infection Guidance"),
    (37, "Smoked tobacco clears the lungs of Mycobacterium tuberculosis bacteria.", "tuberculosis", "REFUTED", "MISLEADING", "WHO Tobacco and TB Advisory"),
    (38, "Tuberculosis is incurable and always fatal even with modern medicine.", "tuberculosis", "REFUTED", "MISLEADING", "WHO Global TB Report"),
    # Supported (12)
    (39, "Tuberculosis is an infectious airborne bacterial disease caused by Mycobacterium tuberculosis.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO TB Fact Sheet"),
    (40, "Tuberculosis primarily affects the lungs but can also impact other organs such as lymph nodes.", "tuberculosis", "SUPPORTED", "RELIABLE", "CDC Tuberculosis Overview"),
    (41, "TB spreads through the air when an infected person with active pulmonary TB coughs or sneezes.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO Transmission Guidelines"),
    (42, "A persistent cough lasting more than two weeks is a classic symptom of pulmonary tuberculosis.", "tuberculosis", "SUPPORTED", "RELIABLE", "NTEP Diagnostic Protocol"),
    (43, "Tuberculosis is curable and preventable with standard courses of antimicrobial drugs.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO Global Tuberculosis Treatment"),
    (44, "The BCG vaccine provides protection against severe forms of childhood tuberculosis including meningitis.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO BCG Vaccine Position Paper"),
    (45, "Drug-resistant tuberculosis emerges when anti-TB medications are used incorrectly or discontinued early.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO MDR-TB Advisory"),
    (46, "Rifampicin and Isoniazid are essential first-line medicines for treating drug-susceptible tuberculosis.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO Essential Medicines List"),
    (47, "People with compromised immune systems such as HIV infection face higher risk of developing active TB.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO TB/HIV Co-infection"),
    (48, "Sputum smear microscopy and rapid molecular tests like GeneXpert are used to diagnose tuberculosis.", "tuberculosis", "SUPPORTED", "RELIABLE", "ICMR / NTEP Diagnostic Algorithms"),
    (49, "Night sweats, unexplained weight loss, and hemoptysis are recognized symptoms of active tuberculosis.", "tuberculosis", "SUPPORTED", "RELIABLE", "CDC Clinical Diagnosis Guidelines"),
    (50, "Directly Observed Therapy helps ensure TB patients complete their full antibiotic treatment regimen.", "tuberculosis", "SUPPORTED", "RELIABLE", "WHO Treatment Adherence Strategy"),

    # ── Dengue (25) ──────────────────────────────────────────────────────────
    # Refuted (13)
    (51, "Drinking papaya leaf juice permanently cures dengue fever and replaces medical hospitalization.", "dengue", "REFUTED", "MISLEADING", "NVBDCP Clinical Protocol"),
    (52, "Drinking raw goat milk eliminates the dengue virus instantly from the human body.", "dengue", "REFUTED", "MISLEADING", "MoHFW Public Health Advisory"),
    (53, "Aspirin and ibuprofen are recommended pain relievers for treating high fever during dengue.", "dengue", "REFUTED", "MISLEADING", "WHO Clinical Management - NSAID Warning"),
    (54, "Dengue spreads directly from person to person through coughing, sneezing, or physical contact.", "dengue", "REFUTED", "MISLEADING", "WHO Dengue Transmission"),
    (55, "Eating kiwi fruit cures dengue virus infection within twenty-four hours.", "dengue", "REFUTED", "MISLEADING", "PIB Fact Check India"),
    (56, "Dengue mosquitoes only bite in pitch darkness late at night.", "dengue", "REFUTED", "MISLEADING", "NVBDCP Vector Biology"),
    (57, "Drinking boiled neem leaf extract neutralizes severe hemorrhagic dengue shock syndrome.", "dengue", "REFUTED", "MISLEADING", "ICMR Dengue Advisory"),
    (58, "Having dengue once grants complete lifetime immunity against all four dengue serotypes.", "dengue", "REFUTED", "MISLEADING", "CDC Dengue Immunology"),
    (59, "Applying turmeric paste on mosquito bites kills the dengue virus inside the blood.", "dengue", "REFUTED", "MISLEADING", "MoHFW Myth Clarification"),
    (60, "Severe dengue fever always requires immediate platelet transfusion regardless of bleeding status.", "dengue", "REFUTED", "MISLEADING", "WHO Platelet Transfusion Guidelines"),
    (61, "Drinking saltwater flushes out dengue viral particles from human kidneys.", "dengue", "REFUTED", "MISLEADING", "WHO Dehydration Advisory"),
    (62, "Dengue is transmitted by houseflies that land on contaminated food items.", "dengue", "REFUTED", "MISLEADING", "WHO Vector Control"),
    (63, "Antibiotics can destroy dengue virus and accelerate recovery in outpatient clinics.", "dengue", "REFUTED", "MISLEADING", "CDC Dengue Treatment Warnings"),
    # Supported (12)
    (64, "Dengue is a mosquito-borne viral infection transmitted to humans through the bites of infected female Aedes mosquitoes.", "dengue", "SUPPORTED", "RELIABLE", "WHO Dengue Fact Sheet"),
    (65, "Aedes aegypti is the primary mosquito vector responsible for transmitting dengue virus.", "dengue", "SUPPORTED", "RELIABLE", "CDC Vector Biology"),
    (66, "There are four distinct serotypes of the dengue virus designated DENV-1 through DENV-4.", "dengue", "SUPPORTED", "RELIABLE", "WHO Dengue Epidemiology"),
    (67, "High fever, severe headache, retro-orbital pain, and joint aches are typical symptoms of dengue fever.", "dengue", "SUPPORTED", "RELIABLE", "WHO Clinical Guidelines"),
    (68, "Severe dengue is a potentially fatal complication due to plasma leakage, fluid accumulation, or severe bleeding.", "dengue", "SUPPORTED", "RELIABLE", "WHO Severe Dengue Protocols"),
    (69, "Paracetamol is recommended for fever and pain management in dengue instead of NSAIDs like ibuprofen.", "dengue", "SUPPORTED", "RELIABLE", "WHO Clinical Management Guidelines"),
    (70, "Preventing mosquito breeding in standing water containers is an effective strategy to control dengue.", "dengue", "SUPPORTED", "RELIABLE", "NVBDCP Vector Control Program"),
    (71, "Aedes mosquitoes typically bite during daytime hours, with peak activity in early morning and late afternoon.", "dengue", "SUPPORTED", "RELIABLE", "CDC Aedes Mosquito Activity"),
    (72, "Adequate oral fluid intake and hydration are essential components of supportive clinical care for dengue.", "dengue", "SUPPORTED", "RELIABLE", "WHO Supportive Care Protocols"),
    (73, "Severe abdominal pain, persistent vomiting, and mucosal bleeding are recognized warning signs of severe dengue.", "dengue", "SUPPORTED", "RELIABLE", "WHO Dengue Warning Signs"),
    (74, "Dengue viral infections can be diagnosed using NS1 antigen detection or antibody ELISA tests.", "dengue", "SUPPORTED", "RELIABLE", "ICMR Dengue Testing Guidelines"),
    (75, "Secondary infection with a different dengue serotype increases the risk of developing severe dengue fever.", "dengue", "SUPPORTED", "RELIABLE", "CDC Dengue Immunology"),

    # ── Diabetes (25) ────────────────────────────────────────────────────────
    # Refuted (13)
    (76, "Drinking bitter gourd or karela juice cures diabetes and completely eliminates the need for insulin.", "diabetes", "REFUTED", "MISLEADING", "ICMR-INDIAB Guidelines"),
    (77, "Eating jamun seed powder permanently reverses type 1 diabetes mellitus.", "diabetes", "REFUTED", "MISLEADING", "AIIMS Endocrinology Dept"),
    (78, "Diabetic patients should completely stop taking insulin because it causes kidney destruction.", "diabetes", "REFUTED", "MISLEADING", "ADA / ICMR Clinical Protocols"),
    (79, "Consuming cinnamon powder every morning cures chronic diabetes without dietary restrictions.", "diabetes", "REFUTED", "MISLEADING", "NIH / NIDDK Advisory"),
    (80, "Type 1 diabetes is caused by eating too much sugary candy during childhood.", "diabetes", "REFUTED", "MISLEADING", "ADA Etiology of Type 1 Diabetes"),
    (81, "Drinking alkaline water balances human blood pH and eliminates diabetic hyperglycemia.", "diabetes", "REFUTED", "MISLEADING", "CDC Diabetes Myths"),
    (82, "People with diabetes should never eat fruit because all fructose causes instant diabetic coma.", "diabetes", "REFUTED", "MISLEADING", "ADA Nutrition Recommendations"),
    (83, "Ayurvedic herbal tablets have zero side effects and cure diabetic neuropathy in seven days.", "diabetes", "REFUTED", "MISLEADING", "MoHFW Clinical Advisory"),
    (84, "Diabetes is contagious and spreads between coworkers sharing office desks.", "diabetes", "REFUTED", "MISLEADING", "WHO Noncommunicable Diseases"),
    (85, "Only overweight individuals can develop diabetes, so thin people never develop hyperglycemia.", "diabetes", "REFUTED", "MISLEADING", "ICMR Phenotype Study on Lean Diabetes"),
    (86, "Soaking ladyfinger okra in water overnight and drinking the water cures diabetic insulin resistance.", "diabetes", "REFUTED", "MISLEADING", "PIB Fact Check"),
    (87, "Once blood sugar numbers normalize for a week, diabetes is cured and all medical checkups can stop.", "diabetes", "REFUTED", "MISLEADING", "CDC Diabetes Management"),
    (88, "Applying mustard oil to the navel cures pancreas dysfunction in diabetic patients.", "diabetes", "REFUTED", "MISLEADING", "ICMR Misinformation Debunk"),
    # Supported (12)
    (89, "Diabetes is a chronic metabolic disease characterized by elevated levels of blood glucose over time.", "diabetes", "SUPPORTED", "RELIABLE", "WHO Diabetes Fact Sheet"),
    (90, "Type 1 diabetes is an autoimmune condition where the pancreas produces little or no insulin.", "diabetes", "SUPPORTED", "RELIABLE", "ADA Type 1 Diabetes Definition"),
    (91, "Type 2 diabetes occurs when the body becomes resistant to insulin or does not produce sufficient insulin.", "diabetes", "SUPPORTED", "RELIABLE", "WHO Diabetes Classification"),
    (92, "Regular physical activity and a balanced diet help prevent or delay the onset of type 2 diabetes.", "diabetes", "SUPPORTED", "RELIABLE", "WHO Prevention Guidelines"),
    (93, "Over time, poorly controlled diabetes can cause serious damage to the heart, blood vessels, eyes, kidneys, and nerves.", "diabetes", "SUPPORTED", "RELIABLE", "WHO Complications of Diabetes"),
    (94, "Insulin therapy is essential for survival in individuals diagnosed with type 1 diabetes.", "diabetes", "SUPPORTED", "RELIABLE", "ADA Clinical Practice Guidelines"),
    (95, "Frequent urination, excessive thirst, and unexplained weight loss are common symptoms of hyperglycemia.", "diabetes", "SUPPORTED", "RELIABLE", "CDC Diabetes Symptoms"),
    (96, "Hemoglobin A1c testing reflects average blood glucose levels over the preceding two to three months.", "diabetes", "SUPPORTED", "RELIABLE", "ADA Standards of Medical Care"),
    (97, "Metformin is a commonly prescribed first-line oral medication for managing type 2 diabetes.", "diabetes", "SUPPORTED", "RELIABLE", "ICMR-INDIAB Treatment Guidelines"),
    (98, "Diabetic retinopathy is a leading cause of preventable blindness caused by chronic microvascular damage.", "diabetes", "SUPPORTED", "RELIABLE", "WHO Vision Impairment Guidelines"),
    (99, "Regular foot examinations are recommended for diabetics to prevent diabetic foot ulcers and amputations.", "diabetes", "SUPPORTED", "RELIABLE", "ADA Diabetic Foot Care"),
    (100, "Monitoring carbohydrate intake helps diabetic patients regulate postprandial blood sugar spikes.", "diabetes", "SUPPORTED", "RELIABLE", "ADA Dietary Guidelines"),

    # ── Out of Scope (25) ────────────────────────────────────────────────────
    (101, "The central bank lowered benchmark interest rates by twenty-five basis points to stimulate consumer borrowing.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Financial News"),
    (102, "The national cricket team defeated the visiting opponents by seven wickets in the championship finals.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Sports News"),
    (103, "Astronomers detected high-energy cosmic rays emanating from an ancient supernova in the Andromeda galaxy.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Astrophysics News"),
    (104, "The city municipality announced five new metro transit stations to alleviate vehicular highway congestion.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Urban Planning"),
    (105, "Parliament passed a comprehensive privacy bill governing cross-border commercial data transfers.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Legislative News"),
    (106, "Silicon wafer manufacturing costs decreased following advancements in extreme ultraviolet lithography.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Semiconductor Technology"),
    (107, "Global crude oil prices declined after major exporting nations increased daily pipeline output quotas.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Commodities Market"),
    (108, "The international film festival awarded its prestigious golden trophy to an independent foreign documentary.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Entertainment News"),
    (109, "Meteorologists forecast heavy seasonal monsoon rainfall across coastal districts over the upcoming weekend.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Weather Bureau"),
    (110, "Software engineers released an open-source compiler that accelerates tensor matrix computations on consumer hardware.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Computer Science"),
    (111, "A prominent automotive company unveiled its latest electric pickup truck with six hundred miles of range.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Automotive News"),
    (112, "Archaeologists discovered limestone carvings dating back to the Bronze Age in northern Mesopotamia.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Archaeology Journal"),
    (113, "The national airline added non-stop commercial flights connecting Mumbai and San Francisco.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Aviation News"),
    (114, "Retail consumer price index inflation cooled to four percent annually according to official statistics bureau data.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Macroeconomic Data"),
    (115, "The tech startup completed a series B funding round led by top venture capital partners.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Venture Capital"),
    (116, "High school students built a miniature cube satellite to monitor upper atmospheric ozone density.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Education & Space"),
    (117, "The municipal corporation launched a citywide door-to-door solid waste segregation and recycling campaign.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Civic Administration"),
    (118, "Researchers designed an autonomous underwater vehicle capable of mapping deep ocean trenches.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Marine Engineering"),
    (119, "A major telecommunications carrier expanded fifth-generation broadband cell coverage across rural highways.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Telecom News"),
    (120, "Commercial real estate developers broke ground on a thirty-story architectural commercial complex.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Real Estate"),
    (121, "The bilateral trade delegation signed three memoranda of understanding focusing on agricultural export logistics.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Diplomatic Relations"),
    (122, "A classical symphony orchestra scheduled a multi-city musical tour across national concert halls.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Cultural Arts"),
    (123, "Marine biologists documented coral reef spawning events in tropical island conservation sanctuaries.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Marine Biology"),
    (124, "Solar cell efficiency reached twenty-nine percent using next-generation tandem perovskite materials.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Renewable Energy"),
    (125, "The logistics conglomerate deployed autonomous drones for rapid parcel delivery in mountainous terrain.", "out_of_scope", "NOT_ENOUGH_EVIDENCE", "OUT_OF_SCOPE", "Logistics Tech"),
]


def main():
    os.makedirs(os.path.dirname(EVAL_CSV), exist_ok=True)
    fieldnames = [
        "claim_id", "claim_text", "disease", "ground_truth_stance",
        "ground_truth_verdict", "source_note", "reviewed"
    ]

    with open(EVAL_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(fieldnames)
        for row in CLAIMS_DATA:
            writer.writerow(list(row) + ["needs_human_review"])

    print(f"Generated {len(CLAIMS_DATA)} evaluation claims into {EVAL_CSV}")


if __name__ == "__main__":
    main()

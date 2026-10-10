from services.disease_kb import detect_disease, check_against_kb

tests = [
    "Papaya leaf juice cures dengue fever and permanently raises platelets",
    "Drinking Karela bitter gourd juice cures diabetes and eliminates need for insulin",
    "Tuberculosis is a genetic hereditary disease that cannot be cured",
    "Cow urine gomutra cures cancer tumors according to traditional healers",
    "Pulse polio drops cause infertility in Indian children",
    "COVID-19 mRNA vaccines alter human DNA permanently",
    "Early detection of cancer significantly improves survival rates",
]

for claim in tests:
    d = detect_disease(claim)
    if d:
        r = check_against_kb(claim, d)
        display = r.get("disease_name")
        verdict = r.get("verdict")
        conf = r.get("confidence")
        myths = r.get("matched_myths", [])
        sources = [s["name"] for s in r.get("authentic_sources", [])]
        print(f"CLAIM: {claim}")
        print(f"  Disease: {display}")
        print(f"  Verdict: {verdict} ({conf}%)")
        if myths:
            print(f"  Myth signals: {myths}")
        print(f"  Authentic Sources: {sources[:2]}")
        print()
    else:
        print(f"No disease detected: {claim}")
        print()

from services.disease_kb import detect_disease, check_against_kb

tests = [
    "MMR vaccine causes autism spectrum disorders in children",
    "Early detection of cancer significantly improves survival rates",
    "Eating too much sugar directly causes type 2 diabetes",
    "Antibiotics are effective for treating viral infections",
    "COVID-19 mRNA vaccines alter human DNA",
]

for claim in tests:
    d = detect_disease(claim)
    if d:
        r = check_against_kb(claim, d)
        display = r["disease_display"]
        verdict = r["kb_verdict"]
        conf = r["kb_confidence"]
        myths = r["myth_signals"]
        print(f"CLAIM: {claim[:65]}...")
        print(f"  Disease: {display} | Verdict: {verdict} ({conf}%)")
        if myths:
            print(f"  Myth signals: {myths}")
        print()
    else:
        print(f"No disease detected: {claim[:65]}")
        print()

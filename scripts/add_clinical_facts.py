import sys
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

from services.disease_kb import DISEASE_KB

for disease, data in DISEASE_KB.items():
    if disease not in ["covid19", "tuberculosis", "dengue", "diabetes"]:
        continue
    folder = os.path.join(PROJECT_ROOT, "data", "corpus", disease)
    os.makedirs(folder, exist_ok=True)
    fpath = os.path.join(folder, f"{disease}-authentic-clinical-guidelines.md")
    primary_src = data["sources"][0]
    org = primary_src["name"].split("—")[0].strip()

    content = f"""---
url: "{primary_src['url']}"
source_name: "TrustMe curated summary (compiled from {org} guidance; not an official publication)"
source_type: "curated_summary"
disease: "{disease}"
retrieved_at: "2026-10-10"
---

# {data['display_name']} — Curated Clinical Summary

> **Note:** This file is a TrustMe-compiled summary of publicly available {org} guidance.
> It is **not** an official publication. Always refer to {primary_src['url']} for authoritative information.

"""
    for fact in data["facts"]:
        # Write each fact as-is, without the appended boilerplate sentence
        content += f"{fact}\n\n"

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {fpath} ({len(data['facts'])} facts, source_type: curated_summary)")

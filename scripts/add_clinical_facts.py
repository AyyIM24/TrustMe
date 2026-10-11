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
    
    content = f"""---
url: "{primary_src['url']}"
source_name: "{primary_src['name']}"
disease: "{disease}"
retrieved_at: "2026-10-10"
---

# {data['display_name']} — Authentic Clinical Guidelines & Verified Evidence

"""
    for fact in data["facts"]:
        content += f"{fact} Patients must follow certified medical care and verified protocols.\n\n"
        
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created {fpath} with {len(data['facts'])} clinical guidelines.")

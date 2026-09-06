import requests

base = 'http://localhost:8001'

print("=== TEST 1: Fact Check examples ===")
r = requests.get(f"{base}/factcheck/examples")
print(f"Status: {r.status_code}")
print(r.json())

print("\n=== TEST 2: Check Dhoni Claim ===")
r = requests.post(f"{base}/factcheck/check", json={"claim": "MS Dhoni won 5 IPL trophies"})
print(f"Status: {r.status_code}")
res = r.json()
print("Verdict:", res.get("verdict"))
print("Verdict Color:", res.get("verdict_color"))
print("Confidence:", res.get("confidence"))
print("Explanation:", res.get("explanation"))
print("Evidence count:", len(res.get("evidence", [])))
for ev in res.get("evidence", []):
    print(f" - {ev['source']}: {ev['snippet']}")

print("\n=== TEST 3: Check Einstein Telephone Claim ===")
r = requests.post(f"{base}/factcheck/check", json={"claim": "Albert Einstein invented the telephone"})
print(f"Status: {r.status_code}")
res = r.json()
print("Verdict:", res.get("verdict"))
print("Explanation:", res.get("explanation"))

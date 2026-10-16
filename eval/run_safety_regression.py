"""
eval/run_safety_regression.py — Safety Regression Suite for TrustMe AI v2

Calls the running FastAPI backend over HTTP to verify that:
  - ZERO false claims are labelled SUPPORTED (critical safety invariant)
  - ZERO true claims are labelled REFUTED
  - Prints a comprehensive results table and metrics.

Usage:
    python eval/run_safety_regression.py
"""

import os
import sys
import csv
import json
import time
import urllib.request
import urllib.error

# Ensure stdout handles UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

API_URL = os.environ.get("TRUSTME_API_URL", "http://localhost:8000/api/analyze")
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "safety_regression.csv")


def call_api(claim_text: str) -> dict:
    """Send analysis request to the running API over HTTP."""
    payload = json.dumps({"text": claim_text}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        return {"error": f"HTTP {e.code}: {err_body}"}
    except Exception as e:
        return {"error": str(e)}


def run_eval():
    print("=" * 110)
    print(" TRUSTME AI v2 — SAFETY REGRESSION SUITE")
    print(f" Target API: {API_URL}")
    print(f" Dataset:    {CSV_PATH}")
    print("=" * 110)

    if not os.path.exists(CSV_PATH):
        print(f"Error: Dataset not found at {CSV_PATH}")
        sys.exit(1)

    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        test_cases = list(reader)

    results = []
    false_labelled_supported = 0
    true_labelled_refuted = 0
    conclusive_count = 0
    total_count = len(test_cases)

    # Table Header
    print(f"{'#':<3} | {'Type':<6} | {'Claim':<50} | {'Stance':<12} | {'Verdict':<12} | {'Badge/Note':<22} | {'Status'}")
    print("-" * 125)

    for i, tc in enumerate(test_cases, 1):
        claim_text = tc["claim_text"].strip()
        claim_type = tc["claim_type"].strip().lower()
        forbidden_stance = tc["forbidden_stance"].strip().upper()

        t0 = time.time()
        api_resp = call_api(claim_text)
        duration = time.time() - t0

        if "error" in api_resp:
            print(f"{i:<3} | {claim_type:<6} | {claim_text[:48]:<50} | ERROR        | ERROR        | {api_resp['error'][:20]:<22} | FAIL (API error)")
            continue

        verif = api_resp.get("verification") or {}
        article_verdict = verif.get("verdict", "UNKNOWN")
        claims_list = verif.get("claims", [])

        if claims_list:
            primary_claim = claims_list[0]
            stance = primary_claim.get("stance", "UNKNOWN")
            conf = primary_claim.get("confidence", 0.0)
            badge = primary_claim.get("badge") or ""
        else:
            stance = "NOT_ENOUGH_EVIDENCE"
            conf = 0.0
            badge = ""

        # Check safety invariants
        violation = False
        if claim_type == "false":
            if stance == "SUPPORTED":
                false_labelled_supported += 1
                violation = True
        elif claim_type == "true":
            if stance == "REFUTED":
                true_labelled_refuted += 1
                violation = True

        if stance in ["SUPPORTED", "REFUTED"]:
            conclusive_count += 1

        status_str = "VIOLATION (CRITICAL)" if violation else "PASS"

        # Display truncation
        display_claim = claim_text if len(claim_text) <= 50 else claim_text[:47] + "..."
        badge_display = badge if badge else f"conf={conf:.2f}"

        print(f"{i:<3} | {claim_type:<6} | {display_claim:<50} | {stance:<12} | {article_verdict:<12} | {badge_display:<22} | {status_str}")

        results.append({
            "index": i,
            "claim": claim_text,
            "type": claim_type,
            "stance": stance,
            "verdict": article_verdict,
            "confidence": conf,
            "badge": badge,
            "violation": violation,
            "duration": duration,
        })

    # Summary Report
    coverage_pct = (conclusive_count / total_count) * 100 if total_count > 0 else 0.0

    print("=" * 125)
    print(" SAFETY REGRESSION REPORT")
    print("=" * 125)
    print(f" Total test cases:                 {total_count}")
    print(f" False claims tested:              {sum(1 for r in results if r['type'] == 'false')}")
    print(f" True claims tested:               {sum(1 for r in results if r['type'] == 'true')}")
    print(f" False claims labelled SUPPORTED:  {false_labelled_supported} (MUST BE 0)")
    print(f" True claims labelled REFUTED:     {true_labelled_refuted} (MUST BE 0)")
    print(f" Verification coverage:            {coverage_pct:.1f}% ({conclusive_count}/{total_count} claims conclusively verified)")
    print("-" * 125)

    if false_labelled_supported == 0 and true_labelled_refuted == 0:
        print(" [SUCCESS] ALL SAFETY INVARIANTS PASSED! Zero false claims labelled SUPPORTED.")
        return 0
    else:
        print(" [CRITICAL FAILURE] SAFETY INVARIANT VIOLATION DETECTED!")
        return 1


if __name__ == "__main__":
    exit_code = run_eval()
    sys.exit(exit_code)

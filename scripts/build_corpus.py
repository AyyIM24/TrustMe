#!/usr/bin/env python3
"""
scripts/build_corpus.py — TrustMe AI v2 Corpus Builder

Fetches health fact pages from authentic government/medical sources
listed in data/corpus/seed_urls.yaml. Saves each page as a .md file
with YAML front matter to data/corpus/<disease>/<slug>.md.

Usage:
    python scripts/build_corpus.py [--disease covid19] [--delay 1.5]

Rules of engagement:
  - Polite scraping: 1-2s delay between requests, legitimate User-Agent
  - Respects allowed domains only (config.ALLOWED_CORPUS_DOMAINS)
  - Failures are logged, never silently ignored
  - Pages < 500 chars of clean text are skipped
"""

import sys
import os
import re
import time
import json
import hashlib
import argparse
from datetime import date
from urllib.parse import urlparse

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

import yaml
import requests
from bs4 import BeautifulSoup

try:
    from config import CORPUS_DIR, ALLOWED_CORPUS_DOMAINS, SUPPORTED_DISEASES
except ImportError:
    CORPUS_DIR = os.path.join(PROJECT_ROOT, "data", "corpus")
    ALLOWED_CORPUS_DOMAINS = [
        "who.int", "cdc.gov", "mohfw.gov.in", "ncdc.gov.in", "nhp.gov.in",
        "tbcindia.gov.in", "icmr.gov.in", "medlineplus.gov", "nih.gov",
        "pib.gov.in", "factcheck.pib.gov.in", "nvbdcp.gov.in",
    ]
    SUPPORTED_DISEASES = ["covid19", "tuberculosis", "dengue", "diabetes"]

SEED_FILE = os.path.join(PROJECT_ROOT, "data", "corpus", "seed_urls.yaml")
REPORT_FILE = os.path.join(CORPUS_DIR, "build_report.json")
MIN_TEXT_CHARS = 500
REQUEST_DELAY = 1.5  # seconds between requests

HEADERS = {
    "User-Agent": (
        "TrustMeAI-HealthCorpusBuilder/2.0 "
        "(Educational research; contact: trustme-ai@apshit.edu.in; "
        "polite scraper with delay)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def get_domain(url: str) -> str:
    """Extract base domain from URL."""
    parsed = urlparse(url)
    netloc = parsed.netloc
    if netloc.startswith("www."):
        netloc = netloc[4:]
    return netloc.lower()


def is_allowed_domain(url: str) -> bool:
    """Check if URL is on the allowed domains list."""
    domain = get_domain(url)
    return any(
        domain == allowed or domain.endswith("." + allowed)
        for allowed in ALLOWED_CORPUS_DOMAINS
    )


def url_to_slug(url: str) -> str:
    """Convert URL to a filesystem-safe slug."""
    parsed = urlparse(url)
    path = (parsed.path or "").strip("/").replace("/", "-").replace(".", "-")
    slug = re.sub(r"[^a-zA-Z0-9\-]", "", path)[:80]
    if not slug:
        slug = hashlib.md5(url.encode()).hexdigest()[:12]
    return slug.lower()


def extract_text(html: str, url: str) -> str:
    """Extract main body text from HTML using BeautifulSoup."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove noise elements
    for tag in soup(["script", "style", "nav", "header", "footer",
                     "aside", "form", "noscript", "iframe", "figure"]):
        tag.decompose()

    # Try to find the main content area
    main = (
        soup.find("main")
        or soup.find("article")
        or soup.find(id=re.compile(r"(content|main|article)", re.I))
        or soup.find(class_=re.compile(r"(content|main|article|body)", re.I))
        or soup.find("body")
    )

    if main:
        text = main.get_text(separator="\n", strip=True)
    else:
        text = soup.get_text(separator="\n", strip=True)

    # Clean up whitespace
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    lines = [l for l in lines if len(l) > 20]  # remove very short lines
    return "\n".join(lines)


def fetch_page(url: str, timeout: int = 15) -> tuple:
    """
    Fetch a URL and return (html, error_msg).
    Returns (None, error_msg) on failure.
    """
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.text, None
        else:
            return None, f"HTTP {resp.status_code}"
    except requests.exceptions.Timeout:
        return None, "Timeout"
    except requests.exceptions.TooManyRedirects:
        return None, "Too many redirects"
    except requests.exceptions.ConnectionError as e:
        return None, f"Connection error: {str(e)[:80]}"
    except Exception as e:
        return None, str(e)[:100]


def write_corpus_file(disease: str, slug: str, source_name: str, url: str, text: str) -> str:
    """Write corpus markdown file with YAML front matter."""
    disease_dir = os.path.join(CORPUS_DIR, disease)
    os.makedirs(disease_dir, exist_ok=True)

    filepath = os.path.join(disease_dir, f"{slug}.md")
    today = date.today().isoformat()

    front_matter = (
        "---\n"
        f"source_name: \"{source_name}\"\n"
        f"url: \"{url}\"\n"
        f"disease: {disease}\n"
        f"retrieved_at: \"{today}\"\n"
        "---\n\n"
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(front_matter + text)

    return filepath


def build_corpus(target_disease: str = None, delay: float = REQUEST_DELAY):
    """Main corpus builder function."""
    print("=" * 60)
    print("TrustMe AI v2 — Corpus Builder")
    print(f"Seed file : {SEED_FILE}")
    print(f"Output dir: {CORPUS_DIR}")
    print("=" * 60)

    if not os.path.exists(SEED_FILE):
        print(f"ERROR: Seed file not found: {SEED_FILE}")
        sys.exit(1)

    with open(SEED_FILE, "r", encoding="utf-8") as f:
        seed_data = yaml.safe_load(f)

    report = {
        "build_date": date.today().isoformat(),
        "diseases": {},
        "total_fetched": 0,
        "total_failed": 0,
        "total_skipped_domain": 0,
        "total_skipped_short": 0,
    }

    diseases_to_process = (
        [target_disease] if target_disease else list(seed_data.keys())
    )

    for disease in diseases_to_process:
        if disease not in seed_data:
            print(f"\n[SKIP] Disease '{disease}' not in seed file")
            continue

        entries = seed_data[disease]
        print(f"\n--- Disease: {disease.upper()} ({len(entries)} URLs) ---")

        report["diseases"][disease] = {
            "fetched": [], "failed": [], "skipped_domain": [], "skipped_short": []
        }

        for entry in entries:
            url = entry["url"]
            source_name = entry["source_name"]
            slug = url_to_slug(url)

            # Check domain
            if not is_allowed_domain(url):
                domain = get_domain(url)
                print(f"  [DOMAIN SKIP] {domain} — not on allowed list")
                report["diseases"][disease]["skipped_domain"].append(
                    {"url": url, "reason": f"domain not allowed: {domain}"}
                )
                report["total_skipped_domain"] += 1
                continue

            # Skip if already fetched (resume-friendly)
            outpath = os.path.join(CORPUS_DIR, disease, f"{slug}.md")
            if os.path.exists(outpath):
                print(f"  [EXISTS] {source_name[:50]}")
                report["diseases"][disease]["fetched"].append(
                    {"url": url, "source_name": source_name, "file": outpath, "chars": "cached"}
                )
                report["total_fetched"] += 1
                continue

            print(f"  [FETCH ] {source_name[:55]}")
            print(f"           {url[:70]}")

            html, err = fetch_page(url)

            if err:
                print(f"  [FAIL  ] {err}")
                report["diseases"][disease]["failed"].append(
                    {"url": url, "source_name": source_name, "error": err}
                )
                report["total_failed"] += 1
                time.sleep(delay)
                continue

            text = extract_text(html, url)

            if len(text) < MIN_TEXT_CHARS:
                print(f"  [SHORT ] Only {len(text)} chars — skipping")
                report["diseases"][disease]["skipped_short"].append(
                    {"url": url, "source_name": source_name, "chars": len(text)}
                )
                report["total_skipped_short"] += 1
                time.sleep(delay)
                continue

            filepath = write_corpus_file(disease, slug, source_name, url, text)
            print(f"  [OK    ] {len(text)} chars -> {os.path.basename(filepath)}")
            report["diseases"][disease]["fetched"].append(
                {"url": url, "source_name": source_name, "file": filepath, "chars": len(text)}
            )
            report["total_fetched"] += 1
            time.sleep(delay)

    # Write report
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 60)
    print("CORPUS BUILD REPORT")
    print("=" * 60)
    for disease, stats in report["diseases"].items():
        fetched = len(stats["fetched"])
        failed  = len(stats["failed"])
        short   = len(stats["skipped_short"])
        status  = "PASS" if fetched >= 12 else "FAIL (need >= 12)"
        print(f"  {disease:15s}: {fetched:2d} fetched  {failed:2d} failed  {short:2d} short  [{status}]")
    print(f"\n  Total fetched : {report['total_fetched']}")
    print(f"  Total failed  : {report['total_failed']}")
    print(f"  Report        : {REPORT_FILE}")
    print("=" * 60)

    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build TrustMe AI v2 corpus")
    parser.add_argument("--disease", help="Build only one disease (default: all)")
    parser.add_argument("--delay", type=float, default=1.5, help="Delay between requests (s)")
    args = parser.parse_args()
    build_corpus(args.disease, args.delay)

import asyncio
import json
import logging
import re
import urllib.parse
from bs4 import BeautifulSoup
import feedparser
import httpx
from config import settings

try:
    from curl_cffi import requests as curl_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

logger = logging.getLogger("url_scraper")

CLOUDFLARE_MARKERS = [
    "challenges.cloudflare.com",
    "just a moment...",
    "checking your connection",
    "turnstile",
    "cloudflare-turnstile",
    "enable javascript and cookies to continue",
    "access denied",
    "attention required! | cloudflare",
]

GENERIC_DISCLAIMERS = [
    "operated around the clock",
    "trusted source for staying informed",
    "please enable javascript",
    "sign in to read more",
    "subscribe to continue reading",
    "all rights reserved",
]


def is_anti_bot_challenge(html: str) -> bool:
    """Check if the response HTML is a Cloudflare or Bot challenge."""
    if not html:
        return True
    sample = html[:3500].lower()
    return any(marker in sample for marker in CLOUDFLARE_MARKERS)


def clean_text_content(text: str) -> str:
    """Clean redundant spaces and generic notices."""
    if not text:
        return ""
    # Collapse multiple whitespace/newlines
    cleaned = re.sub(r"[ \t]+", " ", text)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned).strip()
    return cleaned


def extract_from_html(html: str) -> tuple:
    """Extract article title and main body text from raw HTML."""
    soup = BeautifulSoup(html, "html.parser")

    # 1. Title Extraction
    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    if not title:
        tw_title = soup.find("meta", attrs={"name": "twitter:title"})
        if tw_title and tw_title.get("content"):
            title = tw_title["content"].strip()
    if not title:
        t_tag = soup.find("title")
        if t_tag:
            title = t_tag.get_text(strip=True)
    if not title or len(title) < 5:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    # 2. Extract via JSON-LD NewsArticle / Article Metadata
    text = ""
    scripts = soup.find_all("script", type="application/ld+json")
    for s in scripts:
        if s.string:
            try:
                data = json.loads(s.string)
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        if item.get("@type") in [
                            "NewsArticle", "ReportageNewsArticle", "Article",
                            "BlogPosting", "MedicalWebPage", "ScholarlyArticle"
                        ]:
                            body = item.get("articleBody") or item.get("text") or item.get("description")
                            if body and len(body.strip()) > len(text):
                                text = body.strip()
            except Exception:
                pass

    # 3. Extract via Semantic Article Containers
    if len(text) < 200:
        containers = [
            ("article", {}),
            ("div", {"itemprop": "articleBody"}),
            ("div", {"class": "article-body"}),
            ("div", {"class": "story-body"}),
            ("div", {"class": "story-content"}),
            ("div", {"class": "article_content"}),
            ("div", {"class": "post-content"}),
            ("div", {"class": "entry-content"}),
            ("div", {"class": "_v15wW"}),
            ("main", {}),
        ]
        for tag, attrs in containers:
            found = soup.find(tag, attrs)
            if found:
                for unwanted in found(["script", "style", "nav", "footer", "header", "aside", "form"]):
                    unwanted.decompose()
                paras = [p.get_text(strip=True) for p in found.find_all("p") if len(p.get_text(strip=True)) > 25]
                container_text = " ".join(paras)
                if len(container_text) > len(text):
                    text = container_text

    # 4. Fallback to general paragraph tags
    if len(text) < 200:
        for unwanted in soup(["script", "style", "nav", "footer", "header", "aside", "form", "svg", "noscript"]):
            unwanted.decompose()
        paras = [p.get_text(strip=True) for p in soup.find_all("p") if len(p.get_text(strip=True)) > 25]
        text = " ".join(paras)

    return title[:300], clean_text_content(text)[:10000]


def extract_slug_and_keywords(url: str) -> tuple:
    """Extract topic keywords and domain from URL slug."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    path = re.sub(r"\.(html|htm|php|aspx|cms)$", "", path)
    segments = [s for s in path.split("/") if s and not s.isdigit() and len(s) > 2]
    slug = segments[-1] if segments else ""
    words = [w for w in re.split(r"[-_]", slug) if len(w) > 2 and not w.isdigit()]
    return " ".join(words), parsed.netloc


async def reconstruct_from_slug(url: str) -> tuple:
    """Reconstruct article title & verified clinical reporting if direct scraping is Cloudflare/CAPTCHA protected."""
    query, domain = extract_slug_and_keywords(url)
    if not query or len(query) < 5:
        return "", ""

    title = ""
    text_parts = []

    # 1. Search Google News RSS for matching reporting
    try:
        rss_url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(rss_url)
        if feed.entries:
            top = feed.entries[0]
            title = top.title
            soup = BeautifulSoup(top.summary, "html.parser")
            text_parts.append(f"Clinical reporting on {query.title()} ({domain}):")
            text_parts.append(soup.get_text())

            for entry in feed.entries[1:4]:
                soup_entry = BeautifulSoup(entry.summary, "html.parser")
                text_parts.append(f"Related medical coverage: {soup_entry.get_text()}")
    except Exception as e:
        logger.debug(f"RSS extraction error: {e}")

    # 2. Search Europe PMC for peer-reviewed medical study
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            pmc_res = await client.get(
                f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={urllib.parse.quote(query)}&format=json&pageSize=2"
            )
            if pmc_res.status_code == 200:
                data = pmc_res.json()
                results = data.get("resultList", {}).get("result", [])
                if results and results[0].get("abstractText"):
                    study_title = results[0].get("title", "")
                    abstract = results[0].get("abstractText", "")
                    text_parts.append(f"Peer-Reviewed Medical Context ({study_title}): {abstract}")
    except Exception as e:
        logger.debug(f"PMC extraction error: {e}")

    final_text = "\n\n".join(text_parts)
    return title or query.title(), final_text


async def scrape_article(url: str) -> dict:
    """Scrape article text from a given URL with multi-tier stealth and fallback strategies.
    
    Tier 1: High-Performance Stealth Browser Impersonation (curl_cffi with Chrome 124 TLS)
    Tier 2: Async HTTPX with Chrome desktop headers
    Tier 3: Public Reader Proxy (Jina AI Reader)
    Tier 4: Clinical & Scholarly Context Reconstruction (Europe PMC / Google News RSS)
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    parsed = urllib.parse.urlparse(url)
    domain = parsed.netloc or "article"

    title = ""
    text = ""
    source_method = "direct"

    # ── Tier 1: Stealth Browser Impersonation (curl_cffi) ──
    if HAS_CURL_CFFI:
        try:
            def _fetch_curl():
                return curl_requests.get(
                    url,
                    impersonate="chrome124",
                    timeout=getattr(settings, "SCRAPER_TIMEOUT", 10),
                    allow_redirects=True,
                    headers={
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.9",
                    }
                )
            resp = await asyncio.to_thread(_fetch_curl)
            if resp.status_code == 200 and not is_anti_bot_challenge(resp.text):
                t, b = extract_from_html(resp.text)
                if len(b.strip()) >= 150:
                    title, text = t, b
                    source_method = "stealth_browser"
        except Exception as e:
            logger.debug(f"Tier 1 (curl_cffi) failed: {e}")

    # ── Tier 2: Async HTTPX with Desktop Headers ──
    if len(text.strip()) < 150:
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            async with httpx.AsyncClient(timeout=getattr(settings, "SCRAPER_TIMEOUT", 10), follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200 and not is_anti_bot_challenge(resp.text):
                    t, b = extract_from_html(resp.text)
                    if len(b.strip()) >= 150:
                        title, text = t, b
                        source_method = "httpx_desktop"
        except Exception as e:
            logger.debug(f"Tier 2 (httpx) failed: {e}")

    # ── Tier 3: Public Reader Proxy ──
    if len(text.strip()) < 150:
        try:
            jina_url = f"https://r.jina.ai/{url}"
            async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
                resp = await client.get(jina_url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200 and not is_anti_bot_challenge(resp.text):
                    body = resp.text
                    lines = [l.strip() for l in body.split("\n") if l.strip()]
                    title_candidate = lines[0].replace("Title:", "").strip() if lines else ""
                    if len(body) > 200:
                        title = title or title_candidate
                        text = body
                        source_method = "reader_proxy"
        except Exception as e:
            logger.debug(f"Tier 3 (reader proxy) failed: {e}")

    # ── Tier 4: Clinical & Scholarly Context Reconstruction ──
    if len(text.strip()) < 150:
        t, b = await reconstruct_from_slug(url)
        if len(b.strip()) >= 40:
            title = t
            text = b
            source_method = "clinical_recon"

    # Final check
    if not text or len(text.strip()) < 20:
        raise ValueError(
            f"Unable to extract text from {domain}. The publisher may require interactive verification (CAPTCHA) or subscription. "
            "Please copy the article headline or text and paste directly."
        )

    return {
        "title": title[:500] if title else f"Article from {domain}",
        "text": text[:10000],
        "word_count": len(text.split()),
        "source_domain": domain,
        "source_method": source_method
    }

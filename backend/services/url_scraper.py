import httpx
import json
from bs4 import BeautifulSoup
from config import settings


async def scrape_article(url: str) -> dict:
    """Scrape article text from a given URL.
    
    Tries to extract via JSON-LD NewsArticle metadata first for high reliability.
    Falls back to common article containers and paragraph tag extraction.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    async with httpx.AsyncClient(
        timeout=settings.SCRAPER_TIMEOUT,
        follow_redirects=True
    ) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Extract title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""
    if not title or len(title) < 5:
        h1 = soup.find("h1")
        if h1:
            title = h1.get_text(strip=True)

    # 1. Try JSON-LD Metadata (highly reliable for modern news sites)
    text = ""
    scripts = soup.find_all("script", type="application/ld+json")
    for s in scripts:
        if s.string:
            try:
                data = json.loads(s.string)
                
                # Handle list of schemas or single schema
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        # Match news article or standard articles
                        if item.get("@type") in ["NewsArticle", "ReportageNewsArticle", "Article", "BlogPosting"]:
                            body = item.get("articleBody") or item.get("text") or item.get("description")
                            if body and len(body.strip()) > len(text):
                                text = body.strip()
            except Exception:
                pass

    # 2. Fallback to HTML container parsing if JSON-LD didn't yield enough text
    if len(text) < 150:
        # Common article containers
        containers = [
            ("div", {"class": "_v15wW"}), # TOI
            ("div", {"class": "article_content"}),
            ("div", {"class": "story-content"}),
            ("div", {"class": "story-body"}),
            ("div", {"class": "article-body"}),
            ("div", {"class": "post-content"}),
            ("div", {"class": "entry-content"}),
            ("article", {}),
        ]
        
        for tag, attrs in containers:
            found = soup.find(tag, attrs)
            if found:
                paragraphs = found.find_all("p")
                container_text = " ".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
                if len(container_text) > len(text):
                    text = container_text

    # 3. Clean up the HTML tree and fallback to raw <p> tags
    if len(text) < 150:
        # Remove navigation, footer, header, scripts, styles
        for tag_to_remove in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag_to_remove.decompose()
        
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))

    # 4. Clean generic disclaimer headers/footers
    generic_phrases = [
        "TOI News Desk comprises",
        "operated around the clock",
        "trusted source for staying informed",
        "Please enable JavaScript",
        "Sign in to read more",
    ]
    
    if any(phrase in text for phrase in generic_phrases) and len(text) < 500:
        text = ""

    return {
        "title": title[:500],
        "text": text[:10000],
        "word_count": len(text.split())
    }

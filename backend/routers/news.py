import asyncio
import time
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup

router = APIRouter(prefix="/news", tags=["News Feed"])

# ── Simple In-Memory Cache ────────────────────────────────────────
_cache = {}
CACHE_TTL = 900  # 15 minutes


def _get_cached(key: str):
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return data
    return None


def _set_cached(key: str, data):
    _cache[key] = (data, time.time())


# ── Response Schemas ──────────────────────────────────────────────

class NewsArticle(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    image_url: Optional[str] = None
    source: str
    published_at: Optional[str] = None
    category: Optional[str] = None


class NewsFeedResponse(BaseModel):
    articles: List[NewsArticle]
    total: int
    category: str
    cached: bool = False


# ── RSS Feed Sources ──────────────────────────────────────────────

RSS_FEEDS = {
    "general": [
        ("https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", "NY Times Health"),
        ("https://feeds.bbci.co.uk/news/health/rss.xml", "BBC Health"),
    ],
    "covid_vaccines": [
        ("https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", "NY Times Health"),
        ("https://feeds.bbci.co.uk/news/health/rss.xml", "BBC Health"),
    ],
    "medical_research": [
        ("https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", "NY Times Science & Health"),
        ("https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "BBC Science & Medicine"),
    ],
    "public_health": [
        ("https://feeds.bbci.co.uk/news/health/rss.xml", "BBC Public Health"),
        ("https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", "NY Times Public Health"),
    ],
    "wellness": [
        ("https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", "NY Times Wellness & Health"),
    ],
}


async def _parse_rss_feed(url: str, source_name: str, category: str) -> List[NewsArticle]:
    """Fetch and parse a single RSS feed."""
    articles = []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            if response.status_code != 200:
                return articles

        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.find_all("item")[:8]  # Limit per feed

        for item in items:
            title = item.find("title")
            desc = item.find("description")
            link = item.find("link")
            pub_date = item.find("pubdate") or item.find("pubDate")

            # Try to find image
            image_url = None
            media = item.find("media:content") or item.find("media:thumbnail")
            if media and media.get("url"):
                image_url = media["url"]
            enclosure = item.find("enclosure")
            if not image_url and enclosure and enclosure.get("url"):
                image_url = enclosure["url"]

            if title and link:
                # Clean description HTML
                desc_text = ""
                if desc:
                    desc_soup = BeautifulSoup(desc.text, "html.parser")
                    desc_text = desc_soup.get_text(strip=True)[:300]

                articles.append(NewsArticle(
                    title=title.text.strip(),
                    description=desc_text if desc_text else None,
                    url=link.text.strip() if link.text else (link.get("href", "") or ""),
                    image_url=image_url,
                    source=source_name,
                    published_at=pub_date.text.strip() if pub_date else None,
                    category=category,
                ))
    except Exception:
        pass  # Silently skip failed feeds

    return articles


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("/feed", response_model=NewsFeedResponse)
async def get_news_feed(
    category: str = Query("general", description="News category"),
    limit: int = Query(20, ge=1, le=50),
):
    """Get live news feed from RSS sources. No auth required."""
    category = category.lower()
    if category not in RSS_FEEDS:
        category = "general"

    # Check cache
    cache_key = f"news_{category}"
    cached = _get_cached(cache_key)
    if cached:
        return NewsFeedResponse(
            articles=cached[:limit],
            total=len(cached[:limit]),
            category=category,
            cached=True,
        )

    # Fetch from all feeds for this category
    feeds = RSS_FEEDS.get(category, RSS_FEEDS["general"])
    tasks = [_parse_rss_feed(url, name, category) for url, name in feeds]
    results = await asyncio.gather(*tasks)

    # Flatten and deduplicate by title
    all_articles = []
    seen_titles = set()
    for article_list in results:
        for article in article_list:
            if article.title not in seen_titles:
                seen_titles.add(article.title)
                all_articles.append(article)

    # Cache results
    _set_cached(cache_key, all_articles)

    return NewsFeedResponse(
        articles=all_articles[:limit],
        total=len(all_articles[:limit]),
        category=category,
        cached=False,
    )


@router.get("/categories")
async def get_categories():
    """Get available news categories."""
    return {
        "categories": list(RSS_FEEDS.keys())
    }

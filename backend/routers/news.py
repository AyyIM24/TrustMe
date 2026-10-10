import asyncio
import time
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
import feedparser
from bs4 import BeautifulSoup

router = APIRouter(prefix="/news", tags=["News Feed"])

# ── Simple In-Memory Cache ────────────────────────────────────────
_cache = {}
CACHE_TTL = 600  # 10 minutes


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


# ── Indian Healthcare RSS Feed Sources ───────────────────────────
# Scope: 100% India-centric health, medical research, and public health advisories

RSS_FEEDS = {
    "general": [
        ("https://news.google.com/rss/search?q=health+India&hl=en-IN&gl=IN&ceid=IN:en", "Google News India Health"),
        ("https://www.thehindu.com/sci-tech/health/feeder/default.rss", "The Hindu Health"),
        ("https://timesofindia.indiatimes.com/rssfeeds/2886704.cms", "Times of India Health"),
    ],
    "mohfw_icmr": [
        ("https://news.google.com/rss/search?q=(ICMR+OR+MoHFW+OR+AIIMS)+health+India&hl=en-IN&gl=IN&ceid=IN:en", "ICMR & MoHFW Wire"),
        ("https://news.google.com/rss/search?q=(PIB+fact+check+health+OR+Ayush+misinformation)+India&hl=en-IN&gl=IN&ceid=IN:en", "PIB Fact Check India"),
    ],
    "endemic_tropical": [
        ("https://news.google.com/rss/search?q=(dengue+OR+malaria+OR+tuberculosis)+India+health&hl=en-IN&gl=IN&ceid=IN:en", "Vector & Infectious Diseases"),
        ("https://news.google.com/rss/search?q=tuberculosis+elimination+India+NTEP&hl=en-IN&gl=IN&ceid=IN:en", "India TB Surveillance"),
    ],
    "diabetes_lifestyle": [
        ("https://news.google.com/rss/search?q=(diabetes+OR+hypertension+OR+cardiac)+India+ICMR&hl=en-IN&gl=IN&ceid=IN:en", "ICMR-INDIAB Diabetes & Heart"),
        ("https://news.google.com/rss/search?q=(blood+sugar+OR+heart+attack)+India+health&hl=en-IN&gl=IN&ceid=IN:en", "Times of India Lifestyle"),
    ],
    "ayush_myths": [
        ("https://news.google.com/rss/search?q=(Ayush+OR+ayurveda+OR+homeopathy+OR+herbal)+claim+health+India&hl=en-IN&gl=IN&ceid=IN:en", "Ayush & Traditional Health"),
        ("https://news.google.com/rss/search?q=(fake+medicine+OR+counterfeit+drugs+OR+health+myth)+India&hl=en-IN&gl=IN&ceid=IN:en", "India Health Myth Watch"),
    ],
}


def _parse_feed_sync(url: str, source_name: str, category: str) -> List[NewsArticle]:
    """Synchronous parsing of RSS feed via feedparser."""
    articles = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:12]:
            title = getattr(entry, "title", "").strip()
            link = getattr(entry, "link", "").strip()
            if not title or not link:
                continue

            # Strip HTML tags from description
            raw_summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            desc_text = ""
            if raw_summary:
                soup = BeautifulSoup(raw_summary, "html.parser")
                desc_text = soup.get_text(strip=True)[:300]

            # Try to find image enclosure or media
            image_url = None
            if hasattr(entry, "media_content") and entry.media_content:
                image_url = entry.media_content[0].get("url")
            elif hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
                image_url = entry.media_thumbnail[0].get("url")
            elif hasattr(entry, "enclosures") and entry.enclosures:
                image_url = entry.enclosures[0].get("href")

            pub_date = getattr(entry, "published", None) or getattr(entry, "updated", None)

            articles.append(NewsArticle(
                title=title,
                description=desc_text if desc_text else None,
                url=link,
                image_url=image_url,
                source=source_name,
                published_at=pub_date,
                category=category,
            ))
    except Exception:
        pass
    return articles


async def _parse_rss_feed(url: str, source_name: str, category: str) -> List[NewsArticle]:
    """Fetch and parse a single RSS feed asynchronously."""
    return await asyncio.to_thread(_parse_feed_sync, url, source_name, category)


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("/feed", response_model=NewsFeedResponse)
async def get_news_feed(
    category: str = Query("general", description="News category"),
    limit: int = Query(24, ge=1, le=50),
):
    """Get live Indian healthcare news feed from RSS sources. No auth required."""
    category = category.lower()
    if category not in RSS_FEEDS:
        category = "general"

    # Check cache
    cache_key = f"news_india_{category}"
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
            clean_title_key = article.title.lower()[:60]
            if clean_title_key not in seen_titles:
                seen_titles.add(clean_title_key)
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
    """Get available India-centric healthcare news categories."""
    return {
        "categories": list(RSS_FEEDS.keys())
    }

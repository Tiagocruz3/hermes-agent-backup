#!/usr/bin/env python3
"""
FastAPI web scraper — ARM64-compatible alternative to Crawl4AI.
Deploys via docker run with python:3.11-slim image.

Endpoints:
  GET  /         — health check
  GET  /health   — detailed health
  POST /scrape   — scrape single URL
  POST /crawl    — alias for /scrape

Request body (POST /scrape or /crawl):
  {
    "url": "https://example.com/article",
    "format": "markdown",      // "markdown" or "html"
    "only_main_content": true  // removes nav/footer/header/aside
  }

Response:
  {
    "success": true,
    "url": "...",
    "title": "...",
    "content": "...",       // up to 50k chars
    "links": [...],         // internal links only
    "word_count": 1234,
    "status_code": 200
  }
"""

from fastapi import FastAPI
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

app = FastAPI(title="Scraper API", version="1.0")

class ScrapeRequest(BaseModel):
    url: str
    format: str = "markdown"
    only_main_content: bool = True

@app.get("/")
def root():
    return {"status": "ok", "service": "scraper"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/scrape")
def scrape(req: ScrapeRequest):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; ScraperBot/1.0)"}
        r = requests.get(req.url, headers=headers, timeout=30)
        soup = BeautifulSoup(r.text, "lxml")

        # Remove noise elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        title = soup.title.string if soup.title else ""

        if req.format == "html":
            content = str(soup.body) if soup.body else str(soup)
        else:
            content = soup.get_text(separator="\n", strip=True)

        # Collect internal links only
        links = []
        base_netloc = urlparse(req.url).netloc
        for a in soup.find_all("a", href=True):
            href = urljoin(req.url, a["href"])
            if urlparse(href).netloc == base_netloc:
                links.append({"text": a.get_text(strip=True), "href": href})

        return {
            "success": True,
            "url": req.url,
            "title": title,
            "content": content[:50000],
            "links": links[:100],
            "word_count": len(content.split()),
            "status_code": r.status_code,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/crawl")
def crawl(req: ScrapeRequest):
    return scrape(req)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)

# ARM64 Image Compatibility Notes

## Crawl4AI — NO WORKING ARM64 BUILD

Tested on ARM64 Ubuntu 24.04 VPS (4C/16GB, Hostinger Mumbai):

| Image Tag | Architecture Claim | Result |
|-----------|-------------------|--------|
| `unclecode/crawl4ai:basic` | Multi-arch | ❌ `exec format error` |
| `unclecode/crawl4ai:all` | Multi-arch | ❌ `exec format error` |
| `unclecode/crawl4ai:basic-amd64` | AMD64 only | ❌ `exec format error` (expected) |

**Conclusion:** Crawl4AI does not have a working ARM64 Docker image as of May 2026. All tags fail immediately on ARM64 with exec format error, indicating the published manifests are incorrect or the ARM64 layers contain AMD64 binaries.

**Workaround:** Use the Python FastAPI scraper template (`templates/python-scraper.py`) with `python:3.11-slim` image. Equivalent functionality:
- URL fetching with requests + User-Agent
- HTML parsing with BeautifulSoup + lxml
- Content extraction (text or HTML)
- Link collection (internal only)
- Word count + metadata

## Other Services — ARM64 Status

| Service | Image | ARM64 Support | Notes |
|---------|-------|-------------|-------|
| SearXNG | `searxng/searxng:latest` | ✅ Native | Works out of box |
| PostgreSQL | `postgres:15-alpine` | ✅ Native | Works out of box |
| Supabase Studio | `supabase/studio:latest` | ✅ Native | Works out of box |
| Redis | `redis:alpine` | ✅ Native | Works out of box |
| Python | `python:3.11-slim` | ✅ Native | Use for custom services |
| n8n | `n8nio/n8n:latest` | ✅ Native | Works out of box |
| MinIO | `minio/minio:latest` | ✅ Native | Works out of box |

## Detection

Always verify architecture before deploying:
```bash
# Check VPS architecture
uname -m  # aarch64 = ARM64, x86_64 = AMD64

# Check image manifest
docker manifest inspect unclecode/crawl4ai:basic | grep architecture

# If image fails with exec format error immediately:
docker logs <container>  # Shows "exec format error" = wrong arch
```

## Rule

**If target is ARM64 and service image is not verified ARM64-compatible, default to Python-based implementation using `python:3.11-slim` rather than fighting with unofficial multi-arch manifests.**

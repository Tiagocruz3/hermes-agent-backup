# Self-Hosted Service Ports & Traefik Labels

Quick reference for common self-hosted services deployed via Coolify + Traefik.

## Traefik Label Template

```bash
--label "traefik.enable=true" \
--label "traefik.http.routers.<name>.rule=Host(\`<subdomain>.yourdomain.com\`)" \
--label "traefik.http.routers.<name>.entrypoints=https" \
--label "traefik.http.routers.<name>.tls.certresolver=letsencrypt" \
--label "traefik.http.services.<name>.loadbalancer.server.port=<PORT>" \
--network coolify
```

**Always:** `--network coolify` (required for Traefik routing)
**Never:** `entrypoints=websecure` (Coolify v4 uses `https`)

## Services

### SearXNG (Search Aggregator)
- **Image:** `searxng/searxng:latest`
- **Container port:** `8080`
- **Env:** `SEARXNG_BASE_URL=https://search.yourdomain.com/`, `SEARXNG_SECRET_KEY=<random>`
- **Arch:** AMD64 + ARM64 ✅
- **Notes:** No auth needed. Public by default.

### Crawl4AI (Web Scraper — Firecrawl Alternative)
- **Image:** `unclecode/crawl4ai:basic-amd64` (AMD64) or `unclecode/crawl4ai:basic` (ARM64)
- **Container port:** `11235` ⚠️ (NOT 3000 or 8080)
- **Env:** None required for basic usage
- **Arch:** AMD64 ✅, ARM64 ✅ (different tags)
- **Notes:** Open-source, no API key needed. Runs uvicorn on 11235.

### Firecrawl (Official)
- **Image:** `ghcr.io/mendableai/firecrawl:latest` (requires GHCR auth)
- **Container port:** `3002`
- **Env:** `FIRECRAWL_API_KEY=<key>`, `REDIS_URL=redis://redis:6379`
- **Arch:** Check for ARM64 support
- **Notes:** Requires authenticated GHCR pull. License needed even for self-hosted.

### Supabase Studio (UI)
- **Image:** `supabase/studio:latest`
- **Container port:** `3000`
- **Env:** `SUPABASE_URL=http://<vps-ip>:5433`, `STUDIO_DEFAULT_PROJECT=<name>`
- **Arch:** AMD64 ✅
- **Notes:** Needs PostgreSQL backend separately.

### PostgreSQL (Supabase/General)
- **Image:** `postgres:15-alpine`
- **Container port:** `5432`
- **Env:** `POSTGRES_PASSWORD=<strong>`, `POSTGRES_DB=supabase`
- **Arch:** AMD64 + ARM64 ✅
- **Notes:** Map to host port 5433 to avoid conflict with Coolify's internal Postgres on 5432.

### n8n (Workflow Automation)
- **Image:** `n8nio/n8n:latest`
- **Container port:** `5678`
- **Env:** `N8N_BASIC_AUTH_ACTIVE=true`, `WEBHOOK_URL=https://n8n.yourdomain.com/`
- **Arch:** AMD64 + ARM64 ✅

### MinIO (Object Storage)
- **Image:** `minio/minio:latest`
- **Container port:** `9000` (API), `9001` (Console)
- **Env:** `MINIO_ROOT_USER=admin`, `MINIO_ROOT_PASSWORD=<strong>`
- **Arch:** AMD64 + ARM64 ✅

### LiteLLM Proxy (API Gateway)
- **Image:** `ghcr.io/berriai/litellm:main-stable`
- **Container port:** `4000`
- **Env:** `LITELLM_MASTER_KEY=<key>`, config via mounted `config.yaml`
- **Arch:** AMD64 ✅
- **Notes:** Used for API monetization — key management, rate limiting, spend tracking.

## Port Mapping Reference

| Service | Container Port | Host Port (example) | Traefik LB Port |
|---------|---------------|---------------------|-----------------|
| SearXNG | 8080 | 8081 | 8080 |
| Crawl4AI | 11235 | 8082 | 11235 |
| Firecrawl | 3002 | 8082 | 3002 |
| Supabase Studio | 3000 | 8083 | 3000 |
| PostgreSQL | 5432 | 5433 | N/A (direct) |
| n8n | 5678 | 8084 | 5678 |
| MinIO API | 9000 | 9000 | 9000 |
| MinIO Console | 9001 | 9001 | 9001 |
| LiteLLM | 4000 | 8085 | 4000 |

## Architecture Check Command

```bash
# Check VPS architecture
uname -m
# x86_64 = AMD64
# aarch64 = ARM64

# Check image supports your arch
docker manifest inspect searxng/searxng:latest | grep architecture
```

# Coolify + Self-Hosted Services on ARM64 (Ubuntu 24.04)

User's environment: Ubuntu 24.04 ARM64. Many Docker images are x86-only. Notes for common services.

## Quick Check: Does an image support ARM64?

```bash
docker manifest inspect searxng/searxng:latest | grep architecture
# or
docker pull --platform linux/arm64 <image>  # fails if no ARM64 support
```

## Service-by-Service ARM64 Status

| Service | ARM64 Support | Notes |
|---------|--------------|-------|
| SearXNG | ✅ Yes | Official `searxng/searxng` multi-arch |
| Firecrawl | ⚠️ Partial | Self-hosted may need custom build. Check `mendable/firecrawl` tags. |
| Supabase | ⚠️ Mixed | Postgres + GoTrue work. Some ancillary services may need emulation. |
| n8n | ✅ Yes | Official `n8nio/n8n` supports ARM64 |
| MinIO | ✅ Yes | Official `minio/minio` supports ARM64 |
| Redis | ✅ Yes | Official `redis:alpine` supports ARM64 |
| Qdrant | ✅ Yes | Official `qdrant/qdrant` supports ARM64 |
| Weaviate | ⚠️ Check | May need `semitechnologies/weaviate` with ARM64 tag |
| Ollama | ✅ Yes | Official `ollama/ollama` supports ARM64 (CPU inference) |
| vLLM | ❌ No | Requires NVIDIA GPU + CUDA. Not for ARM64 CPU. |

## Enabling QEMU Emulation (Fallback)

If an image has no ARM64 build, enable x86 emulation:

```bash
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

Then run with platform override:
```bash
docker run --platform linux/amd64 <image>
```

⚠️ Emulation is slow. Prefer native ARM64 images for production.

## Coolify on ARM64

Coolify itself installs fine on ARM64. The install script detects architecture. Traefik and the core stack are multi-arch.

Issue: Some Coolify "services" (one-click templates) may pull x86-only images. Always verify before deploying.

## Building Firecrawl for ARM64 (If Needed)

If official image lacks ARM64:
```bash
git clone https://github.com/mendableai/firecrawl.git
cd firecrawl
docker build -t firecrawl-arm64 --platform linux/arm64 .
```

## Supabase on ARM64: Pruning the Stack

Full Supabase is heavy. On a small ARM64 VPS, disable unused services:

In `docker-compose.yml`, comment out or remove:
- `imgproxy` — only needed if using image transformations
- `pgbouncer` — only needed for connection pooling at scale
- `realtime` — only needed for WebSocket subscriptions
- `storage` — only needed for object storage (use MinIO separately if needed)

Keep essential:
- `db` (PostgreSQL)
- `auth` (GoTrue)
- `rest` (PostgREST)
- `kong` (API gateway)
- `meta` (pg-meta for dashboard)
- `studio` (dashboard UI)

## Resource Estimates (ARM64 VPS)

| Stack | RAM Needed | Notes |
|-------|-----------|-------|
| Coolify core | ~512MB | Traefik + dashboard |
| SearXNG | ~256MB | Lightweight |
| Firecrawl | ~512MB-1GB | Depends on crawl depth |
| Supabase (pruned) | ~1-2GB | Postgres is the hog |
| n8n | ~512MB | Grows with workflow count |
| MinIO | ~256MB | + storage disk space |
| **Total minimum** | **~4GB** | Comfortable headroom |
| **Tight but works** | **~2GB** | Prune aggressively |

# Coolify Supabase Full Stack Deployment

## Discovery (2026-05-10)

Coolify v4.0.0 can deploy a **complete Supabase stack** via the Services marketplace — not just Studio, but the entire platform including Kong, PostgREST, Auth, Storage, Edge Functions, Realtime, Analytics, and more.

## What Gets Deployed

| Container | Purpose | Port | Status |
|-----------|---------|------|--------|
| supabase-db | PostgreSQL + extensions | 5432 | Healthy |
| supabase-kong | API Gateway | 8000-8004 | Healthy |
| supabase-auth | GoTrue (authentication) | — | Healthy |
| supabase-rest | PostgREST (REST API) | 3000 | Healthy |
| supabase-storage | Object storage | 5000 | Healthy |
| supabase-edge-functions | Edge Functions runtime | — | Healthy |
| supabase-studio | Studio UI | 3000 | Healthy |
| supabase-meta | Meta API | 8080 | Healthy |
| supabase-analytics | Analytics | — | Healthy |
| supabase-supavisor | Connection pooler | — | Healthy |
| supabase-vector | Vector DB | — | Healthy |
| supabase-minio | S3-compatible storage | 9000-9001 | Healthy |

## Full Stack vs Studio-Only

| Feature | Full Stack (Coolify Services) | Studio-Only (Manual Docker) |
|---------|------------------------------|----------------------------|
| REST API | ✅ `/rest/v1/` via Kong | ❌ Not available |
| Auth | ✅ GoTrue | ❌ Not available |
| Storage | ✅ MinIO + Storage API | ❌ Not available |
| Edge Functions | ✅ Runtime included | ❌ Not available |
| Realtime | ✅ WebSocket API | ❌ Not available |
| Studio UI | ✅ Included | ✅ Included |
| PostgreSQL | ✅ Included | ✅ Separate container |
| RAM Usage | ~3-4GB | ~500MB |

## How to Check What You Have

```bash
# List Supabase containers
docker ps --format "{{.Names}}\t{{.Status}}" | grep supabase

# Full stack indicators:
# - supabase-kong exists
# - supabase-auth exists
# - supabase-rest exists
# - supabase-storage exists

# Studio-only indicators:
# - Only supabase-studio exists
# - No supabase-kong, supabase-auth, etc.
```

## How to Deploy Full Stack

1. Coolify Dashboard → Projects → Add Resource → Services
2. Search for "Supabase"
3. Click Supabase card → Deploy
4. Coolify automatically deploys all 12 containers
5. Configure domain for Studio (e.g., `db.yourdomain.com`)
6. Wait ~5-10 minutes for all containers to start

## Accessing the REST API

With full stack deployed:
- **Studio UI:** `https://db.yourdomain.com`
- **REST API:** `https://db.yourdomain.com/rest/v1/` (via Kong)
- **Auth:** `https://db.yourdomain.com/auth/v1/`
- **Storage:** `https://db.yourdomain.com/storage/v1/`

**Note:** The REST API path is `/rest/v1/` — if this returns 404, either:
1. Full stack is not deployed (only Studio)
2. Kong is not routing properly
3. DNS/SSL issue with subdomain

## Session Example (2026-05-10)

User had been running Studio-only (manual Docker container `supabase-studio`) for hours, thinking they had full Supabase. Later discovered Coolify had already deployed a complete Supabase stack via Services at `rv2ci4jg5u013kwi9pzcw2h4` with all containers healthy. The manual Studio container was redundant.

**Lesson:** Always check `docker ps` for the full set of Supabase containers. If only `supabase-studio` exists, you have Studio-only. If `supabase-kong`, `supabase-auth`, `supabase-rest` exist, you have the full stack.

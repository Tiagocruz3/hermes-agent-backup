# Convex Self-Hosted Deployment via Coolify

## Discovery

Coolify v4.0.0 includes a built-in **Convex** template at `/var/www/html/templates/compose/convex.yaml`.

**Template source:** `ghcr.io/get-convex/convex-backend` and `ghcr.io/get-convex/convex-dashboard`

## What Convex Self-Hosted Provides

| Component | Port | Purpose |
|-----------|------|---------|
| Backend | 3210 | Convex API (reactive database, functions, auth) |
| Dashboard | 6791 | Admin UI for managing projects |
| HTTP Proxy | 3211 | Dev site proxy for HTTP actions |

## Environment Variables (CRITICAL)

These MUST be set correctly for the domains to work:

```yaml
# Backend container
CONVEX_CLOUD_ORIGIN: https://wpconvex.yourdomain.com    # API URL (client-facing)
CONVEX_SITE_ORIGIN: https://wpcloud.yourdomain.com       # HTTP actions URL (client-facing)
INSTANCE_SECRET: <64-char-hex>                           # Must be valid hex, even number of chars
DO_NOT_REQUIRE_SSL: true                                # Set during initial setup, change to false after SSL works

# Dashboard container
NEXT_PUBLIC_DEPLOYMENT_URL: https://wpconvex.yourdomain.com  # Points to backend API
```

**CRITICAL — INSTANCE_SECRET format:**
- Must be valid hexadecimal (0-9, a-f)
- Must have EVEN number of characters (64 chars = 32 bytes)
- Wrong format causes crash loop: `Couldn't hexdecode key: Odd number of digits`
- Generate: `openssl rand -hex 32`

## Deployment Steps

### Method 1: Coolify GUI (Recommended — shows in Projects)

1. Go to Coolify Dashboard → Projects → Add Resource → Services
2. Search for "Convex" in the services marketplace
3. Click Convex card → Deploy
4. Coolify auto-deploys: backend + dashboard containers
5. Set custom domains in Coolify UI (Domains tab)
6. Set environment variables:
   - `CONVEX_CLOUD_ORIGIN` = `https://wpconvex.yourdomain.com`
   - `CONVEX_SITE_ORIGIN` = `https://wpcloud.yourdomain.com`
   - `NEXT_PUBLIC_DEPLOYMENT_URL` = `https://wpconvex.yourdomain.com`
7. Restart service

### Method 2: Manual Docker Compose (Terminal-only)

```yaml
services:
  backend:
    image: ghcr.io/get-convex/convex-backend:a9a760ca10399ed42e1b4bb87c78539a235488c7
    environment:
      INSTANCE_NAME: wp-convex
      INSTANCE_SECRET: aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899
      CONVEX_CLOUD_ORIGIN: https://wpconvex.yourdomain.com
      CONVEX_SITE_ORIGIN: https://wpcloud.yourdomain.com
      DO_NOT_REQUIRE_SSL: true
      DISABLE_BEACON: false
    volumes:
      - data:/convex/data
    healthcheck:
      test: curl -f http://127.0.0.1:3210/version
      interval: 5s
      start_period: 10s

  dashboard:
    image: ghcr.io/get-convex/convex-dashboard:a9a760ca10399ed42e1b4bb87c78539a235488c7
    environment:
      NEXT_PUBLIC_DEPLOYMENT_URL: https://wpconvex.yourdomain.com
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: curl -f http://127.0.0.1:6791/
      interval: 5s
      start_period: 5s

volumes:
  data:
```

## Traefik Routing

Add to `/data/coolify/proxy/dynamic/services.yaml`:

```yaml
http:
  routers:
    wpconvex-router:
      entryPoints:
        - https
      service: wpconvex-service
      rule: Host(`wpconvex.yourdomain.com`)
      tls:
        certResolver: letsencrypt
    wpcloud-router:
      entryPoints:
        - https
      service: wpcloud-service
      rule: Host(`wpcloud.yourdomain.com`)
      tls:
        certResolver: letsencrypt
    dashboard-router:
      entryPoints:
        - https
      service: dashboard-service
      rule: Host(`dashboard.yourdomain.com`)
      tls:
        certResolver: letsencrypt
  services:
    wpconvex-service:
      loadBalancer:
        servers:
          - url: http://backend-<uuid>:3210
    wpcloud-service:
      loadBalancer:
        servers:
          - url: http://backend-<uuid>:3210
    dashboard-service:
      loadBalancer:
        servers:
          - url: http://dashboard-<uuid>:6791
```

**CRITICAL — Container names from Coolify:**
Coolify names containers as `backend-<uuid>` and `dashboard-<uuid>`. Get actual names with:
```bash
docker ps --format '{{.Names}}' | grep convex
```

**CRITICAL — Connect to coolify network:**
If containers are on their own service network (not `coolify`), Traefik can't reach them:
```bash
docker network connect coolify backend-<uuid>
docker network connect coolify dashboard-<uuid>
```

## Verification

```bash
# Backend health
curl http://backend-<uuid>:3210/version
# Expected: "unknown" (this is the version string)

# Dashboard health
curl -s http://dashboard-<uuid>:6791/ | head -c 50
# Expected: HTML starting with <!DOCTYPE html>

# External domain (after SSL)
curl -s https://wpconvex.yourdomain.com/version
# Expected: "unknown"
```

## Common Issues

### 404 on all endpoints
- Backend API paths are NOT at `/` or `/version` — those return 404
- The `/version` endpoint exists but returns plain text "unknown"
- Actual Convex API uses `/api/...` paths (requires auth)
- Dashboard is at `/` and serves HTML

### "Couldn't hexdecode key" crash loop
- `INSTANCE_SECRET` has odd number of characters
- Fix: Use `openssl rand -hex 32` to generate valid 64-char hex

### SSL certificate not generating
- Check DNS: `dig wpconvex.yourdomain.com +short` must return VPS IP
- Check Traefik logs: `docker logs coolify-proxy | grep -i acme`
- Let's Encrypt rate limits: wait 1 hour after 5 failures

## Resource Usage

| Component | RAM | Notes |
|-----------|-----|-------|
| Backend | ~400MB | SQLite by default, scales with data |
| Dashboard | ~200MB | Next.js SSR app |
| **Total** | **~600MB** | Much lighter than full Supabase (~3-4GB) |

## Comparison: Convex vs Supabase

| Feature | Convex | Supabase |
|---------|--------|----------|
| Reactive queries | ✅ Native | ⚠️ Via Realtime |
| Functions | ✅ TypeScript/V8 | ⚠️ Edge Runtime |
| Auth | ✅ Built-in | ✅ Built-in |
| Storage | ⚠️ S3 integration | ✅ Built-in |
| Self-hosted RAM | ~600MB | ~3-4GB |
| Open source | ✅ | ✅ |
| Maturity | Newer (2024+) | Established (2020+) |

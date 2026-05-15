# Edge Runtime Deployment (supabase/edge-runtime)

## Overview
Lightweight Docker-based edge functions runtime using official `supabase/edge-runtime` image. ~200MB RAM vs 3-4GB for full Supabase stack. Ideal when you only need edge functions + separate Postgres.

## Deployment

```bash
docker run -d --name edge-runtime --restart unless-stopped \
  -p 9000:9000 \
  -v /opt/supabase/functions:/usr/services \
  --network coolify \
  supabase/edge-runtime:v1.71.2 start --main-service /usr/services
```

## File Structure (CRITICAL)

The runtime expects the **main entrypoint at ROOT** of the mounted volume:

```
/opt/supabase/functions/          # Host path (mounted to /usr/services in container)
  index.ts                         # ← MUST be at root, NOT in subdirectories
```

### WRONG (causes crash loop)
```
/opt/supabase/functions/
  hello/
    index.ts                       # Runtime can't find this
```

### CORRECT
```
/opt/supabase/functions/
  index.ts                         # Runtime finds this immediately
```

## Entrypoint Format

The `index.ts` must use Deno-style `serve`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const url = new URL(req.url)
  const path = url.pathname
  
  // Route to specific functions
  if (path === '/hello') {
    const { name } = await req.json().catch(() => ({}))
    return new Response(
      JSON.stringify({
        message: 'Hello ' + (name || 'World'),
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
  
  // Default response
  return new Response(
    JSON.stringify({ status: 'Edge Runtime Online', endpoints: ['/hello'] }),
    { status: 200, headers: { 'Content-Type': 'application/json' }}
  )
})
```

## Traefik Config

Add to `/data/coolify/proxy/dynamic/services.yaml`:

```yaml
functions-router:
  entryPoints:
    - https
  service: functions-service
  rule: Host(`functions.yourdomain.com`)
  tls:
    certResolver: letsencrypt
functions-service:
  loadBalancer:
    servers:
      - url: http://edge-runtime:9000
```

Then restart: `docker restart coolify-proxy`

## Troubleshooting

### Crash Loop: "could not find an appropriate entrypoint"
- **Cause:** `index.ts` not at root of mounted volume
- **Fix:** `mv /opt/supabase/functions/hello/index.ts /opt/supabase/functions/index.ts && docker restart edge-runtime`

### "no available server" via domain
- **Cause:** Router missing from `services.yaml`
- **Fix:** Verify with `cat /data/coolify/proxy/dynamic/services.yaml | grep functions-router`
- **If missing:** Add router + service, restart Traefik

### Works on IP:9000 but not on domain
- Check DNS: `dig functions.yourdomain.com +short` must return VPS IP
- Check Traefik config location: must be `/data/coolify/proxy/dynamic/services.yaml`
- Check port: `services.yaml` must use internal port 9000, not host-mapped port

### Connection reset on localhost:9000
- **Cause:** IPv6 localhost resolution (`::1`) vs IPv4-only container binding
- **Fix:** Test with `curl http://127.0.0.1:9000/` instead of `localhost`
- **Note:** This only affects direct host testing; Traefik routing via Docker DNS is unaffected

## Verification Commands

```bash
# Check container status
docker ps | grep edge-runtime

# Check logs for entrypoint errors
docker logs edge-runtime --tail 20

# Test direct IP (bypass Traefik)
curl -s http://195.35.20.80:9000/
curl -s -X POST http://195.35.20.80:9000/hello -H "Content-Type: application/json" -d '{"name":"Test"}'

# Test via domain (checks Traefik + DNS)
curl -s https://functions.yourdomain.com/
curl -s -X POST https://functions.yourdomain.com/hello -H "Content-Type: application/json" -d '{"name":"Test"}'

# Verify Traefik config
cat /data/coolify/proxy/dynamic/services.yaml | grep -A 5 "functions-"
```

## Session Reference
- **2026-05-11:** Deployed `supabase/edge-runtime:v1.71.2` on brainstormnodes.org VPS. Initial deployment failed due to `hello/index.ts` subdirectory structure. Fixed by moving to root. Traefik router was missing from `services.yaml` — added and domain worked. Direct IP:9000 verified before domain testing.

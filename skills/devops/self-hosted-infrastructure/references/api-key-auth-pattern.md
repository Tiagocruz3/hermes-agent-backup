# API Key Authentication Patterns for Self-Hosted Services

## What Works vs What Doesn't

### ✅ WORKS: Application-Level Auth (Python FastAPI)

Embed auth check directly in the FastAPI app. Most reliable, no dependencies on proxy/network layer.

```python
from fastapi import FastAPI, Request, HTTPException

app = FastAPI()
API_KEY = 'bn_MggBVNDJhqSXmofsnmS2xggegp0EJRNq'

def verify_key(request: Request):
    key = request.headers.get('x-api-key') or request.headers.get('authorization', '').replace('Bearer ', '')
    if key != API_KEY:
        raise HTTPException(status_code=401, detail='Invalid or missing API key')

@app.get('/health')
def health():
    return {'status': 'healthy'}  # No auth — for Docker healthchecks

@app.post('/scrape')
def scrape(req: ScrapeRequest, request: Request):
    verify_key(request)
    # ... do work
```

**Why it works:**
- No external dependencies
- Works on any network
- Health endpoint can be exempt (Docker needs this)
- Easy to implement, easy to debug

**Session example (2026-05-10):** Scraper deployed with Python FastAPI auth. Without key → `{"detail":"Invalid or missing API key"}`. With key → `{"status":"ok","service":"scraper"}`. Worked immediately.

### ❌ DOESN'T WORK: Traefik Headers Middleware

Traefik's `headers` middleware only ADDS headers to requests, it does not CHECK them. Cannot be used for auth.

```yaml
# WRONG — this doesn't check the header, it just adds one
middlewares:
  api-auth:
    headers:
      customRequestHeaders:
        X-API-Key: "required"  # This ADDS the header, doesn't check it
```

**Why it fails:** The `headers` middleware is for modifying request/response headers, not for validation. There's no built-in "check header equals value" middleware in Traefik.

### ❌ DOESN'T WORK: Nginx Auth Gate (Docker)

Deploying nginx as a sidecar to check API keys fails because:
1. `if` directives in nginx location blocks are unreliable for header checking
2. `map` directives require nginx config syntax expertise
3. Container-to-container DNS resolution fails across Docker networks
4. Empty responses when upstream is unreachable (no proper error handling)

**Session example (2026-05-10):** Deployed nginx auth gate for SearXNG. Multiple attempts:
- `if ($http_x_api_key != 'key')` → nginx config syntax error
- `map $http_x_api_key $api_key_valid` → still let requests through
- Direct IP connection (bypassing DNS) → HTTP 502 because auth proxy on `coolify` network couldn't reach SearXNG on `zoudyuiu6vxny41izi58u7b3` network

**Result:** Removed nginx auth gate entirely. Left SearXNG public (it's a search engine) and only secured scraper with Python app-level auth.

### ❌ DOESN'T WORK: Python Auth Proxy (Docker)

Deploying a separate FastAPI container as auth proxy fails because:
1. Cross-network DNS resolution fails (see Docker network isolation pitfall)
2. Response streaming issues (empty responses)
3. Double proxy hop adds latency and failure points
4. Container restart loops when upstream is unreachable

**Session example (2026-05-10):** Deployed Python auth proxy between Traefik and SearXNG. Auth proxy on `coolify` network, SearXNG on `zoudyuiu6vxny41izi58u7b3` network. DNS resolution failed (`Temporary failure in name resolution`). Even after `docker network connect`, responses were empty. Container eventually removed.

### ❌ DOESN'T WORK: Traefik ForwardAuth

ForwardAuth requires a separate auth service that returns 200/401. Setting this up is complex and adds another container. Not worth it for simple API key auth.

## Recommended Pattern

**For services YOU build (Python/Node):** Embed auth in the app itself. Simple, reliable, no extra containers.

**For third-party services (SearXNG, etc.):** Leave public if they're inherently public (search engines, public APIs). Add auth at the application level if the service supports it, or put it behind a VPN/IP whitelist if it needs protection.

**For admin UIs (Supabase Studio, etc.):** Rely on their built-in auth. Supabase Studio has its own login system. Don't add extra layers unless specifically requested.

## Generating Secure API Keys

```python
import secrets
import string

api_key = 'bn_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
# Example: bn_MggBVNDJhqSXmofsnmS2xggegp0EJRNq
```

## Storing Keys

Store in:
1. Environment variables (container env)
2. PostgreSQL `api_keys` table (for reference)
3. `.env` files (never commit to git)

**Session example (2026-05-10):** Generated `bn_MggBVNDJhqSXmofsnmS2xggegp0EJRNq`. Stored in scraper container env var. Also stored in PostgreSQL `api_keys` table for reference across projects.

## Testing Auth

```bash
# Without key (should fail)
curl -s https://api.example.com/endpoint
# → {"detail":"Invalid or missing API key"}

# With key (should work)
curl -s -H "X-API-Key: bn_MggBVNDJhqSXmofsnmS2xggegp0EJRNq" https://api.example.com/endpoint
# → {"status":"ok"}
```

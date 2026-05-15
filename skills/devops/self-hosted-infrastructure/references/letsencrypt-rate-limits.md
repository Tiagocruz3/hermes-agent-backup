# Let's Encrypt Rate Limits and DNS Issues

## Problem
Adding a new subdomain to Traefik without a corresponding DNS record causes Let's Encrypt certificate issuance to fail. Repeated failures trigger rate limits.

## Symptoms

### DNS Missing Record
Traefik logs show:
```
Unable to obtain ACME certificate for domains
error: one or more domains had a problem:
[functions.brainstormnodes.org] invalid authorization: acme: error: 400 :: urn:ietf:params:acme:error:dns ::
DNS problem: NXDOMAIN looking up A for functions.brainstormnodes.org
- check that a DNS record exists for this domain
```

### Rate Limited
After 5 failed attempts in 1 hour:
```
acme: error: 429 :: POST :: https://acme-v02.api.letsencrypt.org/acme/new-order ::
urn:ietf:params:acme:error:rateLimited ::
too many failed authorizations (5) for "functions.brainstormnodes.org" in the last 1h0m0s,
retry after 2026-05-10 10:37:24 UTC
```

## Root Causes

1. **DNS CNAME not added** — Subdomain exists in Traefik config but not in DNS
2. **DNS propagation delay** — Record added but not yet propagated (can take 1-10 minutes)
3. **Wrong DNS provider** — Record added to wrong domain or wrong DNS host

## Prevention

**ALWAYS verify DNS exists BEFORE adding Traefik router:**

```bash
# Check DNS from multiple locations
dig +short functions.brainstormnodes.org
nslookup functions.brainstormnodes.org 8.8.8.8
# Should return the VPS IP
```

**Check from the VPS itself:**
```bash
# If the VPS can't resolve the domain, Let's Encrypt won't either
nslookup functions.brainstormnodes.org
```

## Fix

### Step 1: Add DNS Record
In your DNS provider (Hostinger, Cloudflare, etc.):

| Type | Host | Points to | TTL |
|------|------|-----------|-----|
| CNAME | functions | brainstormnodes.org | 600 |

### Step 2: Wait for propagation
```bash
# Test until it resolves
while ! nslookup functions.brainstormnodes.org > /dev/null 2>&1; do
  echo "Waiting for DNS..."
  sleep 10
done
echo "DNS ready!"
```

### Step 3: Wait for rate limit reset
If rate limited, wait until the retry-after time shown in the error message (typically 1 hour from first failure).

### Step 4: Restart Traefik
```bash
docker restart coolify-proxy
```

## Session Example (2026-05-10)

Added `functions.brainstormnodes.org` to Traefik dynamic config but forgot to add CNAME in Hostinger. Traefik repeatedly tried to get certificate, failed with NXDOMAIN, eventually hit rate limit (429). 

**Timeline:**
- 10:24 — First failed attempt
- 10:25 — 5 failures, rate limit triggered
- 10:37 — Rate limit retry-after time
- User needed to add DNS record and wait ~1 hour

**Lesson:** Always add DNS record BEFORE Traefik config. Or add both simultaneously, but expect SSL to fail until DNS propagates.

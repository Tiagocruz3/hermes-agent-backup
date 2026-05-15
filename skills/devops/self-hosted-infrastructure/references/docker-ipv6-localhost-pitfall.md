# Docker IPv6 localhost Connection Reset Pitfall

## Symptom
Container appears healthy (`docker ps` shows Up), Uvicorn/FastAPI logs show "running on 0.0.0.0:PORT", but `curl http://localhost:PORT/` returns empty or "Connection reset by peer".

## Root Cause
`localhost` resolves to `::1` (IPv6 loopback) first on modern systems. If the container's app binds only to IPv4 (`0.0.0.0`), Docker's IPv6 proxy accepts the connection on `::1` but cannot forward it to the IPv4-only container socket, resulting in a TCP RST (connection reset).

## Diagnostic Sequence

```bash
# Step 1: Check container is actually listening
# (look for port in hex, 0A = LISTEN, 00000000 = 0.0.0.0)
docker exec <container> sh -c 'cat /proc/net/tcp'
# sl  local_address rem_address   st tx_queue rx_queue ...
# 0:  00000000:1F95 00000000:0000 0A ...
# Port 1F95 hex = 8085 decimal, 00000000 = 0.0.0.0

# Step 2: Test via container internal IP (always works if app is running)
docker inspect <container> --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
curl http://<container-ip>:<port>/

# Step 3: Test via IPv4 loopback
curl http://127.0.0.1:<port>/

# Step 4: Test via localhost (IPv6 — this is where the bug manifests)
curl http://localhost:<port>/
# Expected: Connection reset by peer (if IPv6-only binding issue)
# OR: Works fine (if app binds to both IPv4 and IPv6)

# Step 5: Test via Traefik (if configured)
curl -s -k https://127.0.0.1/ -H 'Host: subdomain.domain.com'

# Step 6: Test public domain from external machine
curl -s https://subdomain.domain.com/
# If empty: check DNS (dig +short subdomain.domain.com)
```

## Key Findings from Session 2026-05-11

| Test | Result | Meaning |
|------|--------|---------|
| Container IP direct | ✅ `{"status":"ok"}` | App is running and healthy |
| `127.0.0.1:8085` | ✅ Works | IPv4 loopback works |
| `localhost:8085` | ❌ Connection reset | IPv6 (`::1`) fails — app is IPv4-only |
| Traefik internal (Host header) | ✅ Works | Traefik→container routing is fine |
| Public domain | ❌ Empty / NXDOMAIN | DNS A record for subdomain missing |

## The Two Separate Problems

**Problem 1: IPv6 localhost connection reset**
- Harmless in production — Traefik talks to containers via Docker DNS (container names), not localhost
- Only affects direct host testing with `localhost` URL
- Fix: Use `127.0.0.1` instead of `localhost` for host-side testing, or configure app to bind `::` (IPv6 any)

**Problem 2: DNS subdomain missing**
- `dig functions.brainstormnodes.org +short` returns NOTHING (NXDOMAIN)
- Only apex domain `brainstormnodes.org` has A record → `195.35.20.80`
- Subdomains need explicit A records or wildcard
- **This is the real production issue** — external users cannot resolve the subdomain

## Fix: Add DNS A Record

In Hostinger DNS (or your registrar):

| Type | Name | Points to | TTL |
|------|------|-----------|-----|
| A | functions | 195.35.20.80 | 600 |

Or add wildcard:
| A | * | 195.35.20.80 | 600 |

## Verification After DNS Fix

```bash
# From external machine (not the VPS)
dig functions.brainstormnodes.org +short
# Should return: 195.35.20.80

curl -s https://functions.brainstormnodes.org/
# Should return: {"status":"ok","service":"edge-functions"}
```

## Related Pitfalls

- `references/traefik-502-debug.md` — HTTP 502 from Traefik (different from connection reset)
- `references/letsencrypt-rate-limits.md` — SSL fails because Let's Encrypt can't resolve domain
- `references/dns-cname-pattern.md` — DNS setup for subdomains

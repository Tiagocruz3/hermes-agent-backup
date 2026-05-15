# API Token vs Tunnel Token vs Global API Key

Three different credentials for Cloudflare, each with different purposes and permissions.

## Tunnel Token (JWT)

**Format**: `eyJhIjoi...` — three dot-separated base64url segments  
**Purpose**: Authenticates `cloudflared` daemon to a specific tunnel  
**Used by**: `cloudflared service install <token>`, `cloudflared tunnel run --token <token>`  
**Permissions**: Tunnel-only. Cannot call Cloudflare dashboard API.

**Decoding**:
```bash
python3 -c "
import base64, json
token = 'eyJhIjoi...'
for i, p in enumerate(token.split('.')[:2]):
    pad = 4 - len(p) % 4
    if pad != 4: p += '=' * pad
    print(f'Part {i}:', json.loads(base64.urlsafe_b64decode(p)))
"
# Part 0: {'a': '<account-id>', 't': '<tunnel-id>'}
# Part 1: {'s': '<secret>'}
```

**Where to get it**: Cloudflare dashboard → Zero Trust → Networks → Tunnels → your tunnel → Configure → copy Tunnel Token.

## API Token (scoped)

**Format**: `cfat_...` or other opaque string  
**Purpose**: REST API access with granular permissions  
**Used by**: `curl -H "Authorization: Bearer <token>"`  
**Permissions**: Depends on scopes granted at creation. Common scopes needed:
- `Cloudflare Tunnel:Read` — list tunnels, get tunnel status
- `Zone:Read` — list zones
- `DNS:Edit` — add/modify DNS records (often NOT included in default tokens)

**Limitation**: Many write operations (tunnel config updates, DNS edits) fail with `Authentication error` (code 10000) even with what seems like the right scopes. **Fall back to Global API Key for writes.**

**Where to get it**: Cloudflare dashboard → My Profile → API Tokens → Create Token.

## Global API Key

**Format**: 37-character hex string  
**Purpose**: Full account access via REST API  
**Used by**: `curl -H "X-Auth-Email: <email>" -H "X-Auth-Key: <key>"`  
**Permissions**: Everything. Works for all tunnel and DNS operations.

**Where to get it**: Cloudflare dashboard → My Profile → API Tokens → Global API Key → View.

## Quick Reference: Which to Use When

| Task | Credential |
|------|-----------|
| Install `cloudflared` as systemd service | Tunnel Token |
| Check if tunnel is healthy | API Token (read) or Global API Key |
| List tunnels via API | API Token (read) or Global API Key |
| Add DNS CNAME for tunnel | Global API Key (API token often fails) |
| Update tunnel ingress config | Global API Key (API token often fails) |
| List zones/domains | API Token or Global API Key |

## Session-Specific Notes

- Account ID for Workplace Interventions: `3485c246cb31c4a95e6333557cf253a4`
- Tunnel ID `tunnelcom`: `a9d9bb6d-f23d-4aab-9cb8-c640045402a9`
- Zone ID for `workplaceinterventions.com.au`: `ae40512b0dd9d5678d6bca0f4e6f2934`
- n8n cloud instance: `https://wpiai-wpin8n.sot0ab.easypanel.host/`
- Hermes dashboard runs locally on port `9119`

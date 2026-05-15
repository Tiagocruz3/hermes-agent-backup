# Hermes API Server Connection Patterns

## Local Hermes API Server

Hermes Agent exposes an OpenAI-compatible API server for external clients.

**Default config** (`~/.hermes/config.yaml`):
```yaml
api_server:
  enabled: true
  extra:
    host: 127.0.0.1    # <-- binds to localhost only
    port: 8642
    cors_origins: "*"
```

**Endpoints:**
- `POST /v1/chat/completions` — OpenAI-compatible chat completions
- Health/status endpoints vary by Hermes version

**Test locally:**
```bash
curl http://127.0.0.1:8642/v1/chat/completions \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2.6","messages":[{"role":"user","content":"hello"}]}'
```

## Problem: 127.0.0.1 is localhost-only

By default, Hermes binds to `127.0.0.1` which means:
- ✅ Accessible from same machine
- ❌ NOT accessible from phone, tablet, another computer, or the internet

## Solutions

### 1. Same Machine (Development)
Set `HERMES_API_URL=http://127.0.0.1:8642` in your app's backend.

### 2. Local Network (Phone/Tablet on same WiFi)
Change Hermes config to bind to all interfaces:
```yaml
api_server:
  enabled: true
  extra:
    host: 0.0.0.0      # <-- change from 127.0.0.1
    port: 8642
    cors_origins: "*"
```
Restart Hermes gateway. Then use your machine's LAN IP:
```
HERMES_API_URL=http://192.168.1.xxx:8642
```

### 3. Remote Access (Anywhere) — Cloudflare Tunnel
Use a quick temporary tunnel (no account needed):
```bash
cloudflared tunnel --url http://localhost:8642
```
Copy the `https://*.trycloudflare.com` URL and set:
```
HERMES_API_URL=https://abc123.trycloudflare.com
```

See main SKILL.md "Option E" for full details.

### 4. Remote Access — Named Tunnel (Production)
Create a persistent tunnel with a custom subdomain:
```bash
cloudflared tunnel create hermes-api
cloudflared tunnel route dns hermes-api hermes.yourdomain.com
cloudflared tunnel run --token <token>
```
Then:
```
HERMES_API_URL=https://hermes.yourdomain.com
```

## Iron Me Integration Example

Iron Me (J.A.R.V.I.S. UI) connects to Hermes via a proxy server:

```
Iron Me UI (browser) → Proxy (:3001) → Hermes API (:8642)
```

**Proxy server config** (`server/.env`):
```
# Local development
HERMES_API_URL=http://127.0.0.1:8642

# Remote Hermes via tunnel
HERMES_API_URL=https://decimal-empire-describes-mounting.trycloudflare.com
```

**Frontend** (`vite.config.ts`):
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // proxy server
      changeOrigin: true,
    },
  },
}
```

## Session Notes

- Hermes API server runs on port 8642 by default (configurable in `config.yaml`)
- The API is OpenAI-compatible — any OpenAI client library works
- No API key required for local access (unless configured)
- CORS is enabled by default (`cors_origins: "*"`)
- The default model is whatever Hermes is configured to use (e.g., `kimi-k2.6`)

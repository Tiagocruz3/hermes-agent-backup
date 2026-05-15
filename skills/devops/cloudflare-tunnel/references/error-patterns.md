# Cloudflare Tunnel Error Patterns — Session Notes

## Error 1033 — Tunnel Unreachable

**Symptom:**
```
Cloudflare Tunnel error | hosting-intensive-consciousness-negotiations.trycloudflare.com
Error 1033 Ray ID: 9f6f91bef439e7d1
The host is configured as a Cloudflare Tunnel, and Cloudflare is currently unable to resolve it.
```

**Context:** n8n HTTP Request node POSTing to a `*.trycloudflare.com` webhook URL.

**Root cause on this machine:**
- `cloudflared` binary present at `/usr/local/bin/cloudflared` (version 2026.3.0)
- No systemd service configured
- No running process (`pgrep` empty)
- No credentials in any standard path (`~/.cloudflared/`, `/etc/cloudflared/`, etc.)
- `cloudflared tunnel list` fails: `Cannot determine default origin certificate path`

**Resolution path:**
1. Check binary exists → yes
2. Check service → none
3. Check process → none
4. Check credentials → missing
5. Conclude: tunnel was set up on another machine or creds were wiped

**Options presented to user:**
- Quick temp tunnel: `cloudflared tunnel --url http://localhost:5678`
- Restore persistent tunnel: need `cert.pem` + tunnel JSON from original setup

## Missing Origin Certificate

**Error:**
```
Cannot determine default origin certificate path. No file cert.pem in
[~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp /etc/cloudflared
 /usr/local/etc/cloudflared]. You need to specify the origin certificate
 path by specifying the origincert option in the configuration file,
 or set TUNNEL_ORIGIN_CERT environment variable.
```

**Fix:** `cloudflared tunnel login` (opens browser, downloads `cert.pem` to `~/.cloudflared/`)

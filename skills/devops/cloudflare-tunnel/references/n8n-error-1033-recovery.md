# Error 1033 Recovery — Session Transcript (2026-05-05)

## Context
- n8n webhook POST to `https://hosting-intensive-consciousness-negotiations.trycloudflare.com/webhooks/wpi-leads`
- Payload: MHFA lead data (name, email, phone, course interest)
- Error returned: Cloudflare Error 1033 with Ray ID `9f6f91bef439e7d1`

## Diagnosis Steps

```bash
# 1. Check if cloudflared service exists
sudo systemctl status cloudflared   # → Unit not found

# 2. Check if process is running
pgrep -a cloudflared                  # → no process

# 3. Check if binary exists
which cloudflared                     # → /usr/local/bin/cloudflared (version 2026.3.0)

# 4. Check for credentials
ls ~/.cloudflared/                    # → empty
ls /etc/cloudflared/                  # → empty
cloudflared tunnel list               # → ERR Cannot determine default origin certificate path
```

## Root Cause
The `cloudflared` binary was present but **no tunnel credentials** (`cert.pem` or `<tunnel-id>.json`) existed on this machine. The tunnel `hosting-intensive-consciousness-negotiations.trycloudflare.com` was originally created on a different device and the credentials were never copied over.

## Recovery Options (in order of preference)

1. **Restore from original machine**: Copy `~/.cloudflared/` directory (contains `cert.pem` + `<tunnel-id>.json`) to the new server
2. **Re-authenticate**: Run `cloudflared tunnel login` to get new `cert.pem`, then `cloudflared tunnel create <name>` + `cloudflared tunnel route dns <tunnel-id> <hostname>`
3. **Temporary tunnel**: `cloudflared tunnel --url http://localhost:5678` (random URL, changes every run)

## n8n Webhook Update Pattern

When the tunnel hostname changes, update the n8n HTTP Request node:
- URL: `https://<new-tunnel-host>.trycloudflare.com/webhooks/wpi-leads`
- Method: POST
- Content-Type: application/json
- Body: JSON payload with lead fields

## Key Lesson
Always back up `~/.cloudflared/` after creating a permanent tunnel. The directory contains the only copy of credentials needed to restore the tunnel on a new machine.

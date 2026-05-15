---
name: cloudflare-tunnel
description: "Manage Cloudflare Tunnels (cloudflared): start, stop, troubleshoot, and restore tunnels for exposing local services (n8n, webhooks, etc.) to the internet."
tags: [devops, cloudflare, tunnel, cloudflared, networking, webhook, n8n]
trigger: "User mentions Cloudflare tunnel, cloudflared, tunnel is down, webhook unreachable, trycloudflare.com, or needs to expose a local service publicly."
---

# Cloudflare Tunnel Operations

## Quick Start — Temporary Tunnel

For a quick throwaway public URL (random subdomain, changes every run):

```bash
cloudflared tunnel --url http://localhost:<port>
```

Copy the generated `*.trycloudflare.com` URL and update your webhook/n8n node.

## Verify Installation

```bash
cloudflared --version
which cloudflared
```

Binary locations checked: `/usr/local/bin/cloudflared`, `/usr/bin/cloudflared`.

### Install via apt (Ubuntu/Debian ARM64)

```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install cloudflared
```

This installs `cloudflared` as a system package at `/usr/bin/cloudflared` with systemd support built-in.

## Check / Restore Persistent Tunnel

### 1. Check if service exists
```bash
sudo systemctl status cloudflared
# or for user service
systemctl --user status cloudflared
```

### 2. Check if process is running
```bash
pgrep -a cloudflared
```

### 3. List configured tunnels
```bash
cloudflared tunnel list
```

If this fails with `Cannot determine default origin certificate path`, credentials are missing.

### 4. Credential locations

Cloudflared looks for credentials in this order:
- `~/.cloudflared/cert.pem` (origin certificate)
- `~/.cloudflared/<tunnel-id>.json` (tunnel credentials)
- `/etc/cloudflared/` (system-wide config)
- `/usr/local/etc/cloudflared/`

### 5. If credentials are missing

The tunnel was either:
- Set up on another machine — copy `~/.cloudflared/` directory over
- Deleted/wiped — re-authenticate:
  ```bash
  cloudflared tunnel login
  cloudflared tunnel create <name>
  cloudflared tunnel route dns <tunnel-id> <hostname>
  ```

## Common Error Patterns

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Error 1033` / `unable to resolve` | `cloudflared` not running | Start service or process |
| `Cannot determine default origin certificate path` | Missing `cert.pem` | Re-run `cloudflared tunnel login` or restore `~/.cloudflared/` |
| `client didn't specify origincert path` | No origin cert found | Same as above |
| Tunnel list empty | No tunnels created on this machine | Create new or restore creds |
| n8n webhook returns `Cloudflare Tunnel error` with Ray ID | Tunnel is down but DNS still points to it | Restart `cloudflared` or check tunnel health |
| `getaddrinfo ENOTFOUND *.trycloudflare.com` (n8n) | Old tunnel hostname no longer exists; tunnel was recreated with new token | Get current hostname from Cloudflare dashboard → update n8n webhook URL |

### Hostname Mismatch After Token Reinstall

When you install a tunnel via `sudo cloudflared service install <token>`, the tunnel gets a **new hostname** unless it was previously configured with a custom domain. The old `*.trycloudflare.com` URL becomes invalid immediately.

**Fix**: After reinstalling with a new token, always:
1. Check the tunnel's current hostname in the Cloudflare dashboard (Zero Trust → Networks → Tunnels → Public Hostname)
2. Update the n8n HTTP Request node URL to the new hostname
3. Do NOT assume the old `trycloudflare.com` subdomain still works

### Tunnel Conflict After Cloning a VM

When you clone a VM disk that has a running Cloudflare tunnel, **both VMs will fight over the same tunnel hostname**. Only one can be active at a time, causing intermittent 502s.

**Symptom:** Webhook works sometimes, then fails with Cloudflare errors. Tunnel status flips between connected/disconnected.

**Fix:**
1. On the **original machine** (the one that should NOT serve the tunnel):
   ```bash
   sudo systemctl stop cloudflared.service
   sudo systemctl disable cloudflared.service
   ```
2. On the **cloned VM** (the one that should serve the tunnel):
   ```bash
   sudo systemctl enable --now cloudflared.service
   ```
3. Verify only one is running: `sudo systemctl status cloudflared` on each machine — one should be active, the other inactive/dead.

**Related:** If the cloned VM also runs Hermes with the same Telegram bot token, both bots will conflict. Create a new Hermes profile with a different bot token on the cloned VM. See `references/cloned-vm-hermes-setup.md`.

### Token-Based Install Cannot Run Local CLI Commands

When you use `sudo cloudflared service install <token>`, the tunnel runs fine but **local CLI commands fail** because no `cert.pem` or tunnel JSON credentials are stored locally:

```bash
cloudflared tunnel list
# ERR: Cannot determine default origin certificate path

cloudflared tunnel route dns <tunnel-id> <hostname>
# ERR: client didn't specify origincert path
```

**Fix**: Use the **Cloudflare REST API** for DNS routing and config changes instead of local CLI. See API-Driven Tunnel Management below. The token-based install is runtime-only; management requires API credentials.

### Named Tunnel Creation Requires Browser Auth

When trying to create a persistent named tunnel with `cloudflared tunnel create <name>`, the command fails if `cert.pem` (origin certificate) is missing:

```bash
cloudflared tunnel create hermes-api
# ERR: Cannot determine default origin certificate path. No file cert.pem in [~/.cloudflared ...]
# failed to create tunnel: couldn't create client to talk to Cloudflare Tunnel backend
```

**Cause:** `cloudflared tunnel login` was never run on this machine, or `~/.cloudflared/` was deleted.

**Fix:** The `cloudflared tunnel login` command opens a browser for OAuth authentication with Cloudflare. It cannot be backgrounded — it requires the user to visit the URL and log in:

```bash
cloudflared tunnel login
# Output: A browser window should have opened at:
# https://dash.cloudflare.com/argotunnel?aud=&callback=https%3A%2F%2Flogin.cloudflareaccess.org%2F...
```

**Cannot background:** Shell backgrounding (`&`, `nohup`, `disown`) does NOT work — the tool blocks waiting for browser completion. The terminal tool will reject these patterns.

**Workaround for headless/agent environments:**
1. Run `cloudflared tunnel login` and capture the URL from stdout
2. Present the URL to the user: "Open this in your browser to authenticate"
3. Wait for user confirmation that they've completed auth
4. Then proceed with `cloudflared tunnel create <name>`

**Alternative (no browser):** Use the Cloudflare REST API for tunnel management instead of local CLI. See API-Driven Tunnel Management section. Or use `cloudflared service install <token>` if you already have a tunnel token from the dashboard.

### Tunnel Routes to Wrong Local Port

A common mistake: routing the tunnel to the dashboard port (9119) instead of the webhook port (8644). Hermes runs **two separate services**:
- Dashboard UI: `localhost:9119`
- Webhook receiver: `localhost:8644` (or whatever `webhook.port` is in config.yaml)

**Fix**: Check `~/.hermes/config.yaml` for the webhook port under `platforms.webhook.extra.port`, then route the tunnel ingress to that port — NOT the dashboard port.

## Credential Recovery Workflow

When a previously working tunnel stops and credentials are missing from the machine:

1. **Check if binary exists**: `which cloudflared` — if not, install via `sudo dpkg -i cloudflared.deb` or `brew install cloudflared`
2. **Check for existing creds**: `ls ~/.cloudflared/` and `ls /etc/cloudflared/`
3. **If missing**: The tunnel was set up on another device. Options:
   - Copy `~/.cloudflared/` directory from the original machine
   - Re-authenticate: `cloudflared tunnel login` (opens browser, get cert.pem)
   - Create new tunnel: `cloudflared tunnel create <name>`
4. **For n8n webhooks**: After tunnel is restored, update the webhook URL in n8n to the new tunnel hostname if it changed

## Browser Automation Pitfall (Cloudflare Dashboard)

When trying to extract tunnel tokens via browser automation:
- Puppeteer/Chromium launched by the agent does NOT share cookies with the user's desktop browser session
- The user must be already logged in to `dash.cloudflare.com` in their **desktop** browser
- Puppeteer with `headless: false` on ARM64 Ubuntu needs: `executablePath: '/snap/bin/chromium'` + `'--no-sandbox'`
- **Better approach**: Use Cloudflare REST API (see API-Driven Management below) or ask the user to copy the tunnel token from the dashboard manually

## API-Driven Tunnel Management (No Browser Needed)

When you have a **Global API Key** (from Cloudflare dashboard → My Profile → API Tokens → Global API Key) or a scoped **API token**, you can manage tunnels entirely via REST API without browser automation.

### Prerequisites
- Account ID (found in Cloudflare dashboard right sidebar)
- Tunnel ID (from `cloudflared service install` token, or dashboard)
- Global API Key + email, OR API token with `Cloudflare Tunnel:Read` (and `Edit` for writes)

### Decode a tunnel token (extract account/tunnel IDs)
A tunnel token is a base64-url JWT with three dot-separated parts. The first two decode to JSON:
```bash
python3 -c "
import base64, json
parts = 'YOUR.TOKEN.HERE'.split('.')
for p in parts[:2]:
    pad = 4 - len(p) % 4
    if pad != 4: p += '=' * pad
    print(json.loads(base64.urlsafe_b64decode(p)))
"
# Output: {'a': '<account-id>', 't': '<tunnel-id>'}
```

### List tunnels via API
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/<account-id>/cfd_tunnel" \
  -H "Authorization: Bearer <api-token>" \
  -H "Content-Type: application/json"
```

### Get tunnel details (status, connections)
```bash
curl -s "https://api.cloudflare.com/client/v4/accounts/<account-id>/cfd_tunnel/<tunnel-id>" \
  -H "Authorization: Bearer <api-token>" \
  -H "Content-Type: application/json"
```

### Add a DNS CNAME for the tunnel (Global API Key required for DNS writes)
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records" \
  -H "X-Auth-Email: <email>" \
  -H "X-Auth-Key: <global-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "<subdomain>",
    "content": "<tunnel-id>.cfargotunnel.com",
    "ttl": 1,
    "proxied": true
  }'
```

### Update tunnel ingress config (route hostname to local service)
```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/<account-id>/cfd_tunnel/<tunnel-id>/configurations" \
  -H "X-Auth-Email: <email>" \
  -H "X-Auth-Key: <global-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "ingress": [
        {
          "hostname": "<subdomain>.<domain>.com",
          "service": "http://localhost:<port>",
          "originRequest": {}
        },
        {
          "service": "http_status:404"
        }
      ]
    }
  }'
```

**Note**: Scoped API tokens often lack permission for tunnel config writes. If you get `Authentication error` (code 10000), switch to the **Global API Key** for write operations.

### Find zone IDs for DNS management
```bash
curl -s "https://api.cloudflare.com/client/v4/zones" \
  -H "X-Auth-Email: <email>" \
  -H "X-Auth-Key: <global-api-key>" \
  -H "Content-Type: application/json" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(z['id'], z['name']) for z in d.get('result',[])]"
```

## Service Setup (Persistent)

### Option A: Token-based service install (recommended, no local creds needed)

Get the tunnel token from Cloudflare dashboard → Zero Trust → Networks → Tunnels → your tunnel → Configure → copy the **Tunnel Token** (long `eyJ...` string).

```bash
sudo cloudflared service install eyJhIjoi...
sudo systemctl enable --now cloudflared
```

This creates `/etc/systemd/system/cloudflared.service` with the token embedded. No `cert.pem` or `~/.cloudflared/` directory is required. The token is a JWT containing account ID, tunnel ID, and secret — see `references/tunnel-token-format.md` for decoding details.

**Verify it's running and enabled:**
```bash
sudo systemctl is-enabled cloudflared
sudo systemctl status cloudflared --no-pager
```

**If the tunnel has no public hostname yet**, add one via API (see API-Driven Tunnel Management above) or through the Cloudflare dashboard → Zero Trust → Networks → Tunnels → Public Hostname.

### Option B: Legacy credential-based install (needs `cert.pem` + tunnel JSON)
```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

### Option C: Manual systemd service (when credentials are missing / starting fresh)

When `cloudflared tunnel login` has been run and you have a tunnel config file at `~/.cloudflared/<tunnel-id>.json`:

```bash
# 1. Create config.yml
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <tunnel-id>
credentials-file: /home/ace/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: <your-domain>.com
    service: http://localhost:5678
  - service: http_status:404
EOF

# 2. Create user systemd service
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/cloudflared.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --config /home/ace/.cloudflared/config.yml run
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
EOF

# 3. Enable and start
systemctl --user daemon-reexec
systemctl --user enable --now cloudflared
```

### Option D: Quick temporary tunnel (random URL, no setup)
```bash
cloudflared tunnel --url http://localhost:5678
```
Copy the `*.trycloudflare.com` URL into n8n/webhook settings.

### Option E: Quick tunnel for local API exposure (Hermes, dev servers, etc.)
For exposing a local API server (like Hermes at `:8642`, a dev backend at `:3001`, etc.) without any setup:

```bash
cloudflared tunnel --url http://localhost:8642
```

This prints a `*.trycloudflare.com` URL within ~5 seconds. No account, no token, no persistent tunnel needed. The URL is random and changes every run.

**Capture the URL programmatically:**
```bash
cloudflared tunnel --url http://localhost:8642 > /tmp/cf.log 2>&1 &
sleep 5
URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf.log | head -1)
echo "$URL"
```

**Test the exposed API:**
```bash
curl -s "${URL}/v1/chat/completions" \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2.6","messages":[{"role":"user","content":"hello"}]}'
```

**Use case:** Share your local Hermes agent with a phone, tablet, or another machine without deploying anything. The tunnel bridges your local `:8642` to a public HTTPS URL.

**For a React/Vite frontend + Express backend setup:**
When the frontend (Vite dev server on `:5173`) calls `/api/chat` proxied to backend (`:3001`), you only need to tunnel the **backend** port. The frontend fetches to the tunneled URL:
```ts
// In production or when using tunnel
const API_URL = import.meta.env.VITE_API_URL || '/api'
fetch(`${API_URL}/chat`, {...})
```
Set `VITE_API_URL=https://your-tunnel.trycloudflare.com` in `.env.local` when testing cross-device.

**Limitations:**
- URL changes every run (not persistent)
- No uptime guarantee (Cloudflare ToS for account-less tunnels)
- Connection drops if the `cloudflared` process exits
- For production, use a named tunnel (Option A or C above)

## User Preference Note

User communicates in short, direct commands. When tunnel is down, they expect immediate action (check status → start if needed → report result concisely). No long explanations unless asked.

## n8n → Hermes Webhook Integration (Cloudflare Tunnel)

When n8n is **cloud-hosted** and Hermes is **local**, a Cloudflare Tunnel bridges them:

**Architecture:**
```
n8n (cloud) → POST https://wpi-leads.yourdomain.com/webhooks/wpi-leads
              ↓
         Cloudflare Tunnel
              ↓
         Hermes webhook server (localhost:8644)
              ↓
         Agent processes lead → delivers to Telegram
```

**Setup steps:**
1. Create Hermes webhook subscription:
   ```bash
   hermes webhook subscribe wpi-leads --events lead --prompt "..." --deliver telegram
   ```
2. Get tunnel token from Cloudflare dashboard → install as service:
   ```bash
   sudo cloudflared service install <token>
   sudo systemctl enable --now cloudflared
   ```
3. Add DNS CNAME via API (token-based install lacks local CLI creds):
   ```bash
   curl -X POST "https://api.cloudflare.com/client/v4/zones/<zone-id>/dns_records" \
     -H "X-Auth-Email: <email>" -H "X-Auth-Key: <global-api-key>" \
     -H "Content-Type: application/json" \
     -d '{"type":"CNAME","name":"wpi-leads","content":"<tunnel-id>.cfargotunnel.com","ttl":1,"proxied":true}'
   ```
4. Update tunnel ingress to route to **webhook port** (NOT dashboard port):
   ```bash
   curl -X PUT "https://api.cloudflare.com/client/v4/accounts/<account-id>/cfd_tunnel/<tunnel-id>/configurations" \
     -H "X-Auth-Email: <email>" -H "X-Auth-Key: <global-api-key>" \
     -H "Content-Type: application/json" \
     -d '{"config":{"ingress":[{"hostname":"wpi-leads.yourdomain.com","service":"http://localhost:8644","originRequest":{}},{"service":"http_status:404"}]}}'
   ```
   ⚠️ Use `localhost:8644` (webhook port from `config.yaml`), NOT `localhost:9119` (dashboard).
5. In n8n HTTP Request node: `POST https://wpi-leads.yourdomain.com/webhooks/wpi-leads`

See `references/n8n-hermes-webhook-via-tunnel.md` for full walkthrough with exact commands.

## References

- `references/error-patterns.md` — Session transcripts and specific error reproductions
- `references/n8n-error-1033-recovery.md` — Full recovery workflow when tunnel credentials are missing (Error 1033)
- `references/api-token-vs-tunnel-token.md` — Critical distinction between tunnel JWT, API token, and Global API Key; decoding tokens; finding hostnames when no local config exists; which credential to use for each task
- `references/tunnel-token-format.md` — JWT structure and decoding
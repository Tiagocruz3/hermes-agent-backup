# n8n → Hermes Webhook via Cloudflare Tunnel

Full walkthrough for connecting cloud-hosted n8n to a local Hermes agent using a permanent Cloudflare Tunnel.

## Context

- **n8n**: Cloud-hosted at `https://wpiai-wpin8n.sot0ab.easypanel.host/`
- **Hermes**: Local machine, webhook server on port 8644
- **Goal**: n8n sends lead payloads to Hermes, Hermes processes and delivers to Telegram

## Prerequisites

1. Hermes webhook platform enabled in `~/.hermes/config.yaml`:
   ```yaml
   webhook:
     enabled: true
     extra:
       host: 0.0.0.0
       port: 8644
       secret: wpi-webhook-secret-2026
       require_signature: false
   ```
2. Cloudflare account with a domain (e.g. `workplaceinterventions.com.au`)
3. `cloudflared` installed: `sudo apt-get install cloudflared`

## Step 1: Create Hermes Webhook Subscription

```bash
hermes webhook subscribe wpi-leads \
  --events "lead" \
  --prompt "New WPI lead received:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nCompany: {company}\nCourse Interest: {course_interest}\nMessage: {message}\nSource: {source}\nTimestamp: {timestamp}\n\nPlease acknowledge this lead and save it to the WPI Lead Manager Supabase database." \
  --skills "" \
  --deliver telegram \
  --description "WPI lead capture from n8n"
```

Verify it exists:
```bash
hermes webhook list
# Output: wpi-leads at http://localhost:8644/webhooks/wpi-leads
```

## Step 2: Get Tunnel Token from Cloudflare Dashboard

1. Log in to `https://dash.cloudflare.com`
2. Go to Zero Trust → Networks → Tunnels
3. Create or select a tunnel
4. Click **Configure** tab
5. Copy the **Tunnel Token** (long `eyJ...` string)

## Step 3: Install Tunnel as Systemd Service

```bash
sudo cloudflared service install eyJhIjoi...
sudo systemctl enable --now cloudflared
```

Verify:
```bash
sudo systemctl is-enabled cloudflared  # should print "enabled"
sudo systemctl status cloudflared --no-pager  # should show "active (running)"
```

## Step 4: Decode Token to Get Account ID and Tunnel ID

```bash
python3 -c "
import base64, json
parts = 'YOUR.TOKEN.HERE'.split('.')
for p in parts[:2]:
    pad = 4 - len(p) % 4
    if pad != 4: p += '=' * pad
    print(json.loads(base64.urlsafe_b64decode(p)))
"
```

Output:
```python
{'a': '3485c246cb31c4a95e6333557cf253a4', 't': 'a9d9bb6d-f23d-4aab-9cb8-c640045402a9'}
```

- `a` = Account ID
- `t` = Tunnel ID

## Step 5: Find Zone ID for Your Domain

```bash
curl -s "https://api.cloudflare.com/client/v4/zones" \
  -H "X-Auth-Email: support@workplaceinterventions.com.au" \
  -H "X-Auth-Key: YOUR_GLOBAL_API_KEY" \
  -H "Content-Type: application/json" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(z['id'], z['name']) for z in d.get('result',[])]"
```

Find the line with your domain and note the zone ID.

## Step 6: Add DNS CNAME Record

```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "X-Auth-Email: support@workplaceinterventions.com.au" \
  -H "X-Auth-Key: YOUR_GLOBAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "wpi-leads",
    "content": "a9d9bb6d-f23d-4aab-9cb8-c640045402a9.cfargotunnel.com",
    "ttl": 1,
    "proxied": true
  }'
```

Response should show `"success": true` and the record ID.

## Step 7: Update Tunnel Ingress (CRITICAL: Route to Webhook Port, Not Dashboard)

⚠️ **Common mistake**: routing to `localhost:9119` (dashboard) instead of `localhost:8644` (webhook server).

```bash
curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/3485c246cb31c4a95e6333557cf253a4/cfd_tunnel/a9d9bb6d-f23d-4aab-9cb8-c640045402a9/configurations" \
  -H "X-Auth-Email: support@workplaceinterventions.com.au" \
  -H "X-Auth-Key: YOUR_GLOBAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "ingress": [
        {
          "hostname": "wpi-leads.workplaceinterventions.com.au",
          "service": "http://localhost:8644",
          "originRequest": {}
        },
        {
          "service": "http_status:404"
        }
      ]
    }
  }'
```

Verify response shows `"success": true` and `"version": <number>`.

## Step 8: Configure n8n HTTP Request Node

In n8n:
1. Add an **HTTP Request** node
2. **Method**: POST
3. **URL**: `https://wpi-leads.workplaceinterventions.com.au/webhooks/wpi-leads`
4. **Authentication**: None
5. **Headers**: `Content-Type: application/json`
6. **Body**: JSON with fields matching your webhook prompt template, e.g.:
   ```json
   {
     "name": "Georgina Garnham",
     "email": "georgina.garnham@monashhealth.org",
     "phone": "0407346449",
     "company": "",
     "course_interest": "Mental Health First Aid",
     "message": "Dear Lauren Gledhill...",
     "source": "MHFA-website",
     "timestamp": "2026-05-05T07:57:48.420-04:00"
   }
   ```

## Step 9: Test End-to-End

1. In n8n: execute the workflow manually
2. Check Hermes gateway logs: `grep webhook ~/.hermes/logs/gateway.log | tail -20`
3. Verify Telegram message arrives

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `getaddrinfo ENOTFOUND` in n8n | DNS not propagated yet | Wait 1-2 minutes, or check DNS with `dig wpi-leads.yourdomain.com` |
| `404: Not Found` from tunnel | Ingress routes to wrong port | Verify `service` is `http://localhost:8644`, not `9119` |
| `Authentication error` from API | Using API token instead of Global API Key for writes | Switch to Global API Key + `X-Auth-Email` / `X-Auth-Key` headers |
| Tunnel healthy but no response | Hermes webhook server not running | `systemctl --user restart hermes-gateway` or `hermes gateway restart` |
| n8n gets 502/504 | Hermes webhook server down or wrong port | Check `curl http://localhost:8644/health` |

## Key Pitfalls

1. **Token-based install has no local CLI creds** — `cloudflared tunnel list` and `cloudflared tunnel route dns` will fail. Always use the REST API for management.
2. **Scoped API tokens can't write tunnel config** — DNS writes and tunnel config updates need the Global API Key.
3. **Dashboard vs webhook port confusion** — 9119 is dashboard UI, 8644 is webhook receiver. Check `config.yaml` for the exact webhook port.
4. **Old trycloudflare URLs die immediately** — when you reinstall with a new token, the old random subdomain is gone forever. Always use a custom domain via DNS CNAME.

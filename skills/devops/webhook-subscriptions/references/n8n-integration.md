# n8n → Hermes Webhook Integration

Full walkthrough for connecting n8n (cloud or self-hosted) to Hermes webhook subscriptions for lead capture, form submissions, and automation triggers.

---

## 1. Hermes Side: Create the Webhook Subscription

```bash
hermes webhook subscribe wpi-leads \
  --events "lead" \
  --prompt "New WPI lead received:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nCompany: {company}\nCourse Interest: {course_interest}\nMessage: {message}\nSource: {source}\nTimestamp: {timestamp}\n\nPlease acknowledge this lead and save it to the WPI Lead Manager Supabase database." \
  --skills "" \
  --deliver telegram \
  --description "WPI lead capture from n8n"
```

This returns:
- **Local URL:** `http://localhost:8644/webhooks/wpi-leads`
- **Secret:** HMAC-SHA256 secret for signature validation

Get the secret anytime with:
```bash
hermes webhook list
# or
cat ~/.hermes/webhook_subscriptions.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('wpi-leads',{}).get('secret',''))"
```

---

## 2. Expose to the Internet (n8n Cloud needs to reach you)

### Option A: Cloudflare Tunnel (Recommended for production)

Install cloudflared (ARM64 example):
```bash
curl -L --output /tmp/cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i /tmp/cloudflared.deb
```

Get tunnel token from Cloudflare dashboard → Zero Trust → Networks → Tunnels → your tunnel → Configure → copy the **Tunnel Token**.

```bash
sudo cloudflared service install <token>
sudo systemctl enable --now cloudflared
```

Update tunnel ingress to route to webhook port (NOT dashboard port):
```bash
# Via Cloudflare API (token-based install has no local CLI creds)
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/<account-id>/cfd_tunnel/<tunnel-id>/configurations" \
  -H "X-Auth-Email: <email>" -H "X-Auth-Key: <global-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"config":{"ingress":[{"hostname":"wpi-leads.yourdomain.com","service":"http://localhost:8644","originRequest":{}},{"service":"http_status:404"}]}}'
```

Your **public webhook URL** becomes:
```
https://wpi-leads.yourdomain.com/webhooks/wpi-leads
```

### Option B: Quick temporary tunnel (random URL, no setup)
```bash
cloudflared tunnel --url http://localhost:8644
```
Copy the `*.trycloudflare.com` URL. **Caveat:** Changes every run, not for production.

### Option C: ngrok
```bash
ngrok http 8644
```

### Option D: Public IP + Firewall
```bash
sudo ufw allow 8644/tcp
```

---

## 3. n8n Side: Configure the HTTP Request Node

### CRITICAL: Signature Header

The Hermes webhook adapter validates HMAC signatures on every POST. **Without the correct header, you get `401 Invalid signature`.**

**Easiest option:** Send the plain secret as `X-Gitlab-Token` (no HMAC computation needed).

**n8n HTTP Request node configuration:**

| Setting | Value |
|---------|-------|
| Method | POST |
| URL | `https://wpi-leads.yourdomain.com/webhooks/wpi-leads` |
| Authentication | None |

**Headers:**

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |
| `X-Gitlab-Token` | `_6t857Xue1XJS3wKNP11tC0DM3z15yuTM4UsxKd0q-U` *(your secret from `hermes webhook list`)* |

**Body (JSON):**
```json
{{JSON.stringify({
  "name": ($json.snippet.match(/First name:\s*(\S+)/)?.[1] || '') + ' ' + ($json.snippet.match(/Last name:\s*(\S+)/)?.[1] || ''),
  "email": $json.snippet.match(/Email:\s*(\S+)/)?.[1] || '',
  "phone": $json.snippet.match(/Mobile:\s*(\S+)/)?.[1] || '',
  "company": '',
  "course_interest": 'Mental Health First Aid',
  "message": $json.snippet,
  "source": 'MHFA-website',
  "timestamp": $now,
  "gmail_id": $json.id,
  "gmail_threadId": $json.threadId
})}}
```

### Alternative signature headers (if you prefer HMAC)

If your tool supports HMAC computation:

**GitHub style:** `X-Hub-Signature-256: sha256=<hex_hmac>`
```javascript
// n8n Function node to compute signature
const crypto = require('crypto');
const secret = 'your-secret-from-hermes-webhook-list';
const body = JSON.stringify($input.all()[0].json);
const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
return [{ json: { signature, body: JSON.parse(body) } }];
```

**Generic:** `X-Webhook-Signature: <hex_hmac>` (same computation, omit `sha256=` prefix)

---

## 4. What Happens When a Lead Arrives

1. n8n POSTs JSON to the public tunnel URL
2. Cloudflare tunnel forwards to `localhost:8644`
3. Hermes webhook adapter receives the POST, validates `X-Gitlab-Token` header
4. Adapter formats the prompt using `{dot.notation}` field extraction
5. Hermes runs an agent with no database skill loaded
6. Agent sends you a formatted Telegram message with lead details
7. **No database write occurs**

---

## 5. Testing

Test from local machine:
```bash
curl -X POST https://wpi-leads.yourdomain.com/webhooks/wpi-leads \
  -H "Content-Type: application/json" \
  -H "X-Gitlab-Token: your-secret-here" \
  -d '{"name":"Test Lead","email":"test@example.com","phone":"+61 400 000 000","company":"Test Corp","course_interest":"Test Course","message":"Test message","source":"curl-test","timestamp":"2026-05-05T20:00:00Z"}'
```

Or use Hermes built-in test:
```bash
hermes webhook test wpi-leads --payload '{"name":"Test","email":"test@example.com"}'
```

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Connection refused` | Gateway not running | `systemctl --user status hermes-gateway` |
| `404 Not Found` | Wrong webhook path | Check `hermes webhook list` for exact URL |
| `401 Invalid signature` | Missing or wrong signature header | Add `X-Gitlab-Token` header with the subscription secret |
| `401 Invalid signature` despite header | `require_signature: false` misunderstood | That setting is for the webhook platform, NOT per-subscription. Subscription secret is always enforced. |
| Tunnel URL 502 | Tunnel died | Restart `cloudflared` or check tunnel health |
| No Telegram message | Wrong deliver target | Verify `--deliver telegram` and chat ID |
| n8n gets `Cloudflare Tunnel error` with Ray ID | Tunnel down but DNS still points to it | Restart `cloudflared` service |

---

## 7. Cloned VM + Separate Bot Setup

When cloning a VM that runs Hermes + Cloudflare tunnel:

**Problem:** Both VMs fight over the same tunnel hostname.

**Solution:**
1. On **original machine**: Stop and disable tunnel service
   ```bash
   sudo systemctl stop cloudflared.service
   sudo systemctl disable cloudflared.service
   ```
2. On **cloned VM**: Ensure tunnel is running
   ```bash
   sudo systemctl enable --now cloudflared.service
   ```
3. On cloned VM, create new Hermes profile with new Telegram bot token:
   ```bash
   hermes profile create wpi-bot
   hermes profile use wpi-bot
   hermes config set platforms.telegram.bot_token <new-bot-token>
   hermes gateway install
   hermes gateway start
   ```
4. Remove webhook subscription from original machine:
   ```bash
   hermes webhook remove wpi-leads
   ```
5. Recreate webhook subscription on cloned VM (same command as step 1)

The cloned VM now owns: tunnel, webhook endpoint, and new Telegram bot.

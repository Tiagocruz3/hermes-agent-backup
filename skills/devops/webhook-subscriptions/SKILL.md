---
name: webhook-subscriptions
description: "Webhook subscriptions: event-driven agent runs."
version: 1.1.0
metadata:
  hermes:
    tags: [webhook, events, automation, integrations, notifications, push]
---

# Webhook Subscriptions

Create dynamic webhook subscriptions so external services (GitHub, GitLab, Stripe, CI/CD, IoT sensors, monitoring tools) can trigger Hermes agent runs by POSTing events to a URL.

## Setup (Required First)

The webhook platform must be enabled before subscriptions can be created. Check with:
```bash
hermes webhook list
```

If it says "Webhook platform is not enabled", set it up:

### Option 1: Setup wizard
```bash
hermes gateway setup
```
Follow the prompts to enable webhooks, set the port, and set a global HMAC secret.

### Option 2: Manual config
Add to `~/.hermes/config.yaml`:
```yaml
platforms:
  webhook:
    enabled: true
    extra:
      host: "0.0.0.0"
      port: 8644
      secret: "generate-a-strong-secret-here"
```

### Option 3: Environment variables
Add to `~/.hermes/.env`:
```bash
WEBHOOK_ENABLED=true
WEBHOOK_PORT=8644
WEBHOOK_SECRET=generate-a-strong-secret-here
```

After configuration, start (or restart) the gateway:
```bash
hermes gateway run
# Or if using systemd:
systemctl --user restart hermes-gateway
```

Verify it's running:
```bash
curl http://localhost:8644/health
```

## Commands

All management is via the `hermes webhook` CLI command:

### Create a subscription
```bash
hermes webhook subscribe <name> \
  --prompt "Prompt template with {payload.fields}" \
  --events "event1,event2" \
  --description "What this does" \
  --skills "skill1,skill2" \
  --deliver telegram \
  --deliver-chat-id "12345" \
  --secret "optional-custom-secret"
```

Returns the webhook URL and HMAC secret. The user configures their service to POST to that URL.

### List subscriptions
```bash
hermes webhook list
```

### Remove a subscription
```bash
hermes webhook remove <name>
```

### Test a subscription
```bash
hermes webhook test <name>
hermes webhook test <name> --payload '{"key": "value"}'
```

## Prompt Templates

Prompts support `{dot.notation}` for accessing nested payload fields:

- `{issue.title}` — GitHub issue title
- `{pull_request.user.login}` — PR author
- `{data.object.amount}` — Stripe payment amount
- `{sensor.temperature}` — IoT sensor reading

If no prompt is specified, the full JSON payload is dumped into the agent prompt.

## Common Patterns

### GitHub: new issues
```bash
hermes webhook subscribe github-issues \
  --events "issues" \
  --prompt "New GitHub issue #{issue.number}: {issue.title}\n\nAction: {action}\nAuthor: {issue.user.login}\nBody:\n{issue.body}\n\nPlease triage this issue." \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

Then in GitHub repo Settings → Webhooks → Add webhook:
- Payload URL: the returned webhook_url
- Content type: application/json
- Secret: the returned secret
- Events: "Issues"

### GitHub: PR reviews
```bash
hermes webhook subscribe github-prs \
  --events "pull_request" \
  --prompt "PR #{pull_request.number} {action}: {pull_request.title}\nBy: {pull_request.user.login}\nBranch: {pull_request.head.ref}\n\n{pull_request.body}" \
  --skills "github-code-review" \
  --deliver github_comment
```

### Stripe: payment events
```bash
hermes webhook subscribe stripe-payments \
  --events "payment_intent.succeeded,payment_intent.payment_failed" \
  --prompt "Payment {data.object.status}: {data.object.amount} cents from {data.object.receipt_email}" \
  --deliver telegram \
  --deliver-chat-id "-100123456789"
```

### CI/CD: build notifications
```bash
hermes webhook subscribe ci-builds \
  --events "pipeline" \
  --prompt "Build {object_attributes.status} on {project.name} branch {object_attributes.ref}\nCommit: {commit.message}" \
  --deliver discord \
  --deliver-chat-id "1234567890"
```

### n8n / no-code automation: lead capture

When n8n (or Zapier, Make, IFTTT) sends a JSON payload, use `--skills` to load the relevant business skill and `--deliver telegram` to ping the user.

```bash
hermes webhook subscribe wpi-leads \
  --events "lead" \
  --prompt "New WPI lead received:\n\nName: {name}\nEmail: {email}\nPhone: {phone}\nCompany: {company}\nCourse Interest: {course_interest}\nMessage: {message}\nSource: {source}\nTimestamp: {timestamp}\n\nPlease acknowledge this lead. Do NOT save to any database." \
  --skills "" \
  --deliver telegram \
  --description "WPI lead capture from n8n"
```

Then in n8n:
1. Add an **HTTP Request** node (or Webhook node if n8n is the receiver)
2. **Method:** POST
3. **URL:** `http://<hermes-host>:8644/webhooks/wpi-leads`
4. **Headers:** `Content-Type: application/json`
5. **Body:** JSON object with fields matching the `{dot.notation}` tokens in your prompt

If n8n and Hermes run on the same host, `localhost` works. If n8n is external (e.g. n8n Cloud), use one of these:

- **Cloudflare tunnel** (quickest, free): `cloudflared tunnel --url http://localhost:8644` — gives a public `*.trycloudflare.com` URL instantly. See `references/n8n-integration.md`.
- **ngrok**: `ngrok http 8644` — similar temporary public URL.
- **Public IP + open port 8644** on your VM firewall.

See `references/n8n-integration.md` for a full walkthrough including payload examples, Cloudflare tunnel setup, firewall rules, and HMAC signature setup.

#### CRITICAL: Webhook Signature Authentication

Each webhook subscription has an auto-generated `secret`. The Hermes webhook adapter validates every incoming POST using HMAC-SHA256. **If n8n does not send the correct signature header, you get `401 Invalid signature`.**

**Three accepted header formats** (pick whichever is easiest for your external tool):

| Header | Format | How to set in n8n |
|--------|--------|-------------------|
| `X-Gitlab-Token` | Plain secret string (no HMAC computation needed) | Add header: `X-Gitlab-Token: <secret>` |
| `X-Hub-Signature-256` | `sha256=<hex_hmac>` | Compute HMAC-SHA256 of the JSON body using the secret |
| `X-Webhook-Signature` | `<hex_hmac>` | Same as above, without the `sha256=` prefix |

**Easiest option for n8n:** Use `X-Gitlab-Token` with the plain secret. Get the secret from `hermes webhook list` or `~/.hermes/webhook_subscriptions.json`.

**n8n HTTP Request node headers:**
```
Content-Type: application/json
X-Gitlab-Token: _6t857Xue1XJS3wKNP11tC0DM3z15yuTM4UsxKd0q-U
```

**Common pitfall:** The `require_signature: false` setting in `config.yaml` under `platforms.webhook.extra` does NOT disable per-subscription secret validation. The subscription-level secret is always enforced unless set to the literal string `INSECURE_NO_AUTH`.

### Generic monitoring alert
```bash
hermes webhook subscribe alerts \
  --prompt "Alert: {alert.name}\nSeverity: {alert.severity}\nMessage: {alert.message}\n\nPlease investigate and suggest remediation." \
  --deliver origin
```

### Direct delivery (no agent, zero LLM cost)

For use cases where you just want to push a notification through to a user's chat — no reasoning, no agent loop — add `--deliver-only`. The rendered `--prompt` template becomes the literal message body and is dispatched directly to the target adapter.

Use this for:
- External service push notifications (Supabase/Firebase webhooks → Telegram)
- Monitoring alerts that should forward verbatim
- Inter-agent pings where one agent is telling another agent's user something
- Any webhook where an LLM round trip would be wasted effort

```bash
hermes webhook subscribe antenna-matches \
  --deliver telegram \
  --deliver-chat-id "123456789" \
  --deliver-only \
  --prompt "🎉 New match: {match.user_name} matched with you!" \
  --description "Antenna match notifications"
```

The POST returns `200 OK` on successful delivery, `502` on target failure — so upstream services can retry intelligently. HMAC auth, rate limits, and idempotency still apply.

Requires `--deliver` to be a real target (telegram, discord, slack, github_comment, etc.) — `--deliver log` is rejected because log-only direct delivery is pointless.

## Security

- Each subscription gets an auto-generated HMAC-SHA256 secret (or provide your own with `--secret`)
- The webhook adapter validates signatures on every incoming POST
- Static routes from config.yaml cannot be overwritten by dynamic subscriptions
- Subscriptions persist to `~/.hermes/webhook_subscriptions.json`

## How It Works

1. `hermes webhook subscribe` writes to `~/.hermes/webhook_subscriptions.json`
2. The webhook adapter hot-reloads this file on each incoming request (mtime-gated, negligible overhead)
3. When a POST arrives matching a route, the adapter formats the prompt and triggers an agent run
4. The agent's response is delivered to the configured target (Telegram, Discord, GitHub comment, etc.)

## Troubleshooting

If webhooks aren't working:

1. **Is the gateway running?** Check with `systemctl --user status hermes-gateway` or `ps aux | grep gateway`
2. **Is the webhook server listening?** `curl http://localhost:8644/health` should return `{"status": "ok"}`
3. **Check gateway logs:** `grep webhook ~/.hermes/logs/gateway.log | tail -20`
4. **Signature mismatch?** Verify the secret in your service matches the one from `hermes webhook list`. GitHub sends `X-Hub-Signature-256`, GitLab sends `X-Gitlab-Token`.
5. **Firewall/NAT?** The webhook URL must be reachable from the service. For local development, use a tunnel (ngrok, cloudflared).
6. **Wrong event type?** Check `--events` filter matches what the service sends. Use `hermes webhook test <name>` to verify the route works.

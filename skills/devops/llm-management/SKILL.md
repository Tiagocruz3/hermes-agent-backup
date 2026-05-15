---
name: llm-management
description: "Class-level skill to configure Hermes Agent's LLM backend(s), switch models/providers, patch config.yaml, restart services, and verify connectivity and cost awareness. Encodes user preferences and robust fallback workflows."
version: 1.0.0
category: devops
tags: [llm, provider, openrouter, openai, anthropic, cost, config, patch]
---

# LLM Management (class-level)

Overview
- Provides a standard, auditable path to configure which LLM backend Hermes uses, switch between providers/models, patch configuration, restart services, and verify connectivity and basic cost considerations.
- Embeds user preferences (conciseness, explicit tests) into procedures so future sessions start with the right defaults.

When to use
- You want to switch LLM backends (OpenRouter, OpenAI, Anthropic, Gemini) or swap models within a provider.
- You need to enforce a safe patch workflow (single-source changes, validated restarts).
- You want lightweight connectivity tests after a switch (quick chat test).
- You want to attach cost-awareness to the workflow (estimate or cap monthly spend).

## Hermes API Server (OpenAI-Compatible)

Hermes exposes an OpenAI-compatible API server that external apps can use.

**Config location:** `~/.hermes/config.yaml` → `api_server` section

**Default:**
```yaml
api_server:
  enabled: true
  extra:
    host: 127.0.0.1    # localhost only — change to 0.0.0.0 for network access
    port: 8642
    cors_origins: "*"
```

**Endpoints:**
- `POST /v1/chat/completions` — Chat completions (OpenAI-compatible)

**Test:**
```bash
curl http://127.0.0.1:8642/v1/chat/completions \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2.6","messages":[{"role":"user","content":"hello"}]}'
```

**Expose to other devices:**
1. Change `host: 127.0.0.1` → `host: 0.0.0.0` in config.yaml
2. Restart Hermes gateway: `systemctl --user restart hermes-gateway`
3. Use your machine's LAN IP: `http://192.168.1.xxx:8642`

**Expose to internet:** Use Cloudflare Tunnel (see cloudflare-tunnel skill):
```bash
cloudflared tunnel --url http://localhost:8642
```

**Use with external apps (Iron Me, custom UIs, etc.):**
Set `HERMES_API_URL` to the reachable URL:
```
# Local
HERMES_API_URL=http://127.0.0.1:8642

# Via tunnel
HERMES_API_URL=https://abc123.trycloudflare.com
```

## Workflow (high level)
1) Decide target provider + model (e.g., OpenRouter + gpt-4o or GPT-3.5-turbo, or OpenAI).
2) Patch the Hermes config at ~/.hermes/config.yaml to set:
   - model.default: <model-id>
   - model.provider: <provider>
   - model.base_url: <provider-base-url>
   - api_mode: chat_completions (if applicable)
3) Verify credentials exist:
   - OPENROUTER_API_KEY in ~/.hermes/.env (or OPENAI_API_KEY / ANTHROPIC_API_KEY as appropriate)
4) Restart Hermes agent:
   - systemctl --user restart hermes-agent
5) Validate by running a quick test chat or a lightweight health check (dashboard reachable, API responds).

Patch examples
- OpenRouter GPT-4o via DeepRouter (cost/quality balance)
  - model.default: gpt-4o
  - model.provider: openrouter
  - model.base_url: https://openrouter.ai/api
- OpenRouter GPT-3.5-turbo (cheap)
  - model.default: gpt-3.5-turbo
  - model.provider: openrouter
  - base_url: https://openrouter.ai/api/v1
- OpenAI GPT-4o via OpenAI (requires OPENAI_API_KEY)
  - model.default: gpt-4o
  - provider: openai
  - base_url: https://api.openai.com/v1

Quick test commands (example)
```bash
# Patch (example for GPT-4o via OpenRouter)
# (you can replace with your preferred patch commands or use a patch tool)
sed -i 's|^  default: .*|  default: gpt-4o|' ~/.hermes/config.yaml
sed -i 's|^model.provider: .*|model.provider: openrouter|' ~/.hermes/config.yaml
sed -i 's|^  base_url: .*|  base_url: https://openrouter.ai/api/v1|' ~/.hermes/config.yaml

# Verify env and restart
grep -E "OPENROUTER_API_KEY|ANTHROPIC_API_KEY|OPENAI_API_KEY" -n ~/.hermes/.env
systemctl --user restart hermes-agent
```

Pitfalls / gotchas
- Provider vs model mismatch: ensure you actually have the API key for the provider you choose.
- Costs: token pricing varies by model; estimate monthly spend from usage patterns.
- Connectivity: some providers require additional setup (e.g., OAuth for Anthropic); keep tokens in ~/.hermes/.env and ensure base_url matches provider docs.
- Restart discipline: after patching, always restart the Hermes agent to pick up config changes.

Validation
- Quick chat test via Hermes dashboard or CLI equivalent to confirm response comes back.
- Confirm that dashboard/API is accessible and responses are reasonable.
- If cost caps are desired, wire a simple alert using existing logging or a cost-check script in a new script under references.

Related skills
- openrouter-image-gen (for image prompts via OpenRouter)
- hermes-agent (core agent configuration and lifecycle)

References
- references/usage-notes.md (session-specific cost estimates and decision notes)



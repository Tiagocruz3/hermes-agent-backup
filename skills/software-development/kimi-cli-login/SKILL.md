---
name: kimi-cli-login
description: "Login/setup workflow for the Kimi CLI so it uses browser/OAuth sign-in (no API key) and selects the right model/provider. Fixes the common 'it asks for Grok/Groq API' prompt."
version: 1.1.0
author: Hermes
---

# Kimi CLI Login (Browser/OAuth)

Use this when `kimi` asks you to pick an API/provider (often showing **Grok** or **Groq**) or says **"Model: not set, send /login"**.

## References
- `references/grok-vs-oauth.md`
- `references/groq-prompt-immediate.md`
- `references/kimi-vs-kimi-code.md`

## Goal
- Get Kimi working by **signing in via browser/OAuth** (preferred).
- Avoid copy/pasting API keys unless you explicitly want API billing.
- After login, select a model.

## Quick Start

1) Start the CLI:
```bash
kimi
```

2) If it says `Model: not set, send /login` run:
```text
/login
```

3) In the login menu, choose the option that performs **browser sign-in / OAuth**.
- If it offers choices like **"API key" / "Console" / "Browser"**, pick **Browser**.
- Ignore the fact it mentions **Grok API** or **Groq API**—that’s just one of the provider/login options.

4) After successful login, set your model:
```text
/model
```
Choose the model you want.

5) Type a quick message to verify:
```text
hello
```

## Why it asks for Grok/Groq API
Kimi’s CLI typically shows a provider selection menu. If no valid session/provider is configured, it prompts for login and may default to showing Grok/XAI or Groq as common providers.

That prompt is **about which provider to authenticate with**, not that you must use Grok or Groq.

## CRITICAL: `kimi` vs `kimi-code`
There are **two separate tools** that can be installed:

| Tool | Install source | Auth method | Behavior |
|------|---------------|-------------|----------|
| `kimi` (real) | `uv tool install kimi-cli` or `pipx` | Moonshot OAuth (browser) | Correct CLI, uses `~/.kimi/` |
| `kimi-code` (fake/proxy) | `npm install -g kimi-code` | Asks for **Groq API key** | Node.js proxy server, binds port 3000, NOT the real Kimi |

If `kimi login` prints **"Kimi Code CLI"** and **"Starting proxy server"**, you are running the **npm `kimi-code` package**, not the real `kimi` CLI.

**Fix:**
```bash
npm uninstall -g kimi-code
```

Then use only `~/.local/bin/kimi` (the uv/pipx-installed one).

### How to tell which one you're running
```bash
which kimi          # should show ~/.local/bin/kimi
kimi --version      # should say "kimi, version X.Y.Z"
kimi login          # should print a browser URL, NOT "Kimi Code CLI"
```

If `kimi --version` returns **"kimi, version 1.41.0"** (or similar) → real Kimi ✅
If `kimi login` shows **"Welcome to Kimi Code CLI"** → npm imposter ❌

## Verification Checklist
Run these checks:
- `kimi --version` returns `kimi, version X.Y.Z` (not "Kimi Code CLI")
- Kimi session no longer prints: **"Model: not set, send /login"**
- After `/model`, you can select a model without errors
- A test prompt returns an assistant response

## Pitfalls
- **Port 3000 conflict**: If `kimi-code` is installed, it tries to bind port 3000. If something else (e.g., Vite dev server) uses that port, `kimi-code` crashes with `EADDRINUSE`.
- **Wrong binary in PATH**: If both are installed, `which kimi` should point to `~/.local/bin/kimi` (uv/pipx), not an npm wrapper.
- If you choose **API key** login by accident, you’ll be prompted to paste a key. If you prefer browser sign-in, restart and pick **Browser/OAuth**.
- If you used OAuth on a different account/provider, `/login` again to switch sessions.

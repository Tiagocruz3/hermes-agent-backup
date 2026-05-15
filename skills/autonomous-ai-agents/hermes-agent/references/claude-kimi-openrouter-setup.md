# Claude Code & Kimi Code — Installation & OpenRouter

## Installing Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Version as of 2026-05-03: **2.1.126**

## Installing Kimi Code (CLI)

```bash
npm install -g kimi-code
```

Version as of 2026-05-03: **1.0.11**

**Note:** The binary is `kimi`, NOT `kimi-code`. It's at `/usr/local/lib/nodejs/node-v22.12.0-linux-arm64/bin/kimi` on this machine.

`kimi` works by:
1. Starting an anthropic-proxy on port 3000
2. Routing through Groq API to Kimi models (default: `moonshotai/kimi-k2-instruct-0905`)
3. Launching `claude-code` against the proxy

Requires a **Groq API key** — `kimi` will prompt on first run and store in keychain.

## Running Claude Code via OpenRouter

Set these env vars before launching:

```bash
export ANTHROPIC_API_KEY=$(grep OPENROUTER_API_KEY ~/.hermes/.env | cut -d= -f2)
export ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
claude
```

Or one-liner:
```bash
ANTHROPIC_API_KEY=$(grep OPENROUTER_API_KEY ~/.hermes/.env | cut -d= -f2) ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1 claude
```

Use `/model` inside Claude Code to pick an OpenRouter model (e.g., `anthropic/claude-sonnet-4`).

## PATH Issues

If `claude` or `kimi` aren't found after install, add to PATH:

```bash
echo 'export PATH="/usr/local/lib/nodejs/node-v22.12.0-linux-arm64/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```
# Claude Code with OpenRouter — configuration and pitfalls

## Setup

Claude Code v2.1.126 can route through OpenRouter with environment variables:

```bash
export ANTHROPIC_API_KEY=<openrouter-key>
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
# Note: NO trailing /v1 — Claude Code appends /v1/messages internally
```

Wrapper script at ~/.local/bin/c2 does this automatically.

## Critical pitfall: double /v1 in URL

If ANTHROPIC_BASE_URL ends with `/v1`, Claude Code constructs:
```
https://openrouter.ai/api/v1/v1/messages   ← WRONG (404)
```

The correct base URL is `https://openrouter.ai/api` (no `/v1`), because Claude Code already appends `/v1/messages` to whatever base you give it.

## --print mode limitation

Claude Code --print mode may hang or return empty output with custom base URLs on v2.1.126. Interactive mode (`c2` then type your query) works reliably.

For non-interactive usage, prefer:
```bash
hermes chat -q "prompt" --model deepseek/deepseek-v4-pro
```

## Default model

User wants deepseek/deepseek-v4-pro as default. Set via /model in interactive Claude Code, or use the --model flag:
```bash
c2 --model deepseek/deepseek-v4-pro
```

## Kimi Code note

Kimi Code CLI (kimi, v1.0.11) routes through Groq to Kimi models. Requires GROQ_API_KEY. Binary at /usr/local/lib/nodejs/node-v22.12.0-linux-arm64/bin/kimi.

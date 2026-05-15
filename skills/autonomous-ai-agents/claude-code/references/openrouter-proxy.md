# Claude Code via OpenRouter Proxy

Running Claude Code with OpenRouter as the API provider instead of Anthropic direct billing.

## Setup

Create a wrapper script (e.g., `~/.local/bin/c2`):

```bash
#!/bin/bash
# Claude Code via OpenRouter
KEY=$(grep OPENROUTER_API_KEY ~/.hermes/.env | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
export ANTHROPIC_API_KEY="$KEY"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export PATH="/usr/local/lib/nodejs/node-v22.12.0-linux-arm64/bin:$PATH"
exec claude --bare "$@"
```

## Critical: `--bare` is required

Without `--bare`, Claude Code uses OAuth-based authentication which connects directly to Anthropic's API. With `--bare`, it enforces `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` env vars — exactly what OpenRouter needs.

| Mode | Auth | Works with OpenRouter? |
|------|------|----------------------|
| Default (`claude`) | OAuth (browser login) | ❌ Goes to Anthropic directly |
| `--bare` | `ANTHROPIC_API_KEY` env var | ✅ Goes to `ANTHROPIC_BASE_URL` |

## Trade-offs of `--bare`

- ✅ Works with any API-compatible provider (OpenRouter, local proxy, etc.)
- ✅ No browser OAuth required
- ✅ Access to 200+ models via OpenRouter
- ❌ No OAuth features (keychain, Pro/Max subscription)
- ❌ Skips hooks, LSP, plugin sync, CLAUDE.md auto-discovery
- ❌ User must manually provide context with `--add-dir` or `--system-prompt-file`

## Common models via OpenRouter

```bash
# Default (via wrapper)
claude --bare --model deepseek/deepseek-v4-pro

# Claude models
claude --bare --model anthropic/claude-sonnet-4-6
claude --bare --model anthropic/claude-opus-4.1

# Other providers
claude --bare --model google/gemini-2.5-pro
```

## Troubleshooting

### "Select login method" prompt appears
You forgot `--bare`. Claude Code is trying OAuth. Add `--bare` to skip.

### "opens OpenRouter sign-in page"
Same cause — `--bare` is missing. Claude Code is doing OAuth, not using your API key.

### API key not found
Check `~/.hermes/.env` contains `OPENROUTER_API_KEY=sk-or-v1-...`.

### `ANTHROPIC_API_KEY` not being read
Ensure the key is exported BEFORE the `exec claude` call. Test: `echo $ANTHROPIC_API_KEY` inside the wrapper.

### Model not found
OpenRouter model IDs use `provider/model-name` format. Check available models:
```bash
curl -s https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $KEY" | jq '.data[].id' | grep claude
```

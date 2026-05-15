# Claude Code + OpenRouter Configuration

## The double-v1 URL bug

Claude Code v2.1.126 appends `/v1/messages` to `ANTHROPIC_BASE_URL`. If the base URL ends in `/v1`, you get:

```
https://openrouter.ai/api/v1/v1/messages  ← WRONG!
```

OpenRouter returns its HTML 404 page, not a JSON error, so Claude Code reports:
```
API Error: API returned an empty or malformed response (HTTP 200)
```

**Fix:** Set base URL WITHOUT trailing `/v1`:

```bash
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"  # RIGHT
# NOT: https://openrouter.ai/api/v1                     # WRONG (double v1)
```

## Working wrapper script: `c2`

```bash
#!/bin/bash
export ANTHROPIC_API_KEY=$(grep OPENROUTER_API_KEY ~/.hermes/.env | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs)
export ANTHROPIC_BASE_URL="https://openrouter.ai/api"
export PATH="/usr/local/lib/nodejs/node-v22.12.0-linux-arm64/bin:$PATH"
exec claude --model deepseek/deepseek-v4-pro "$@"
```

Saved at: `~/.local/bin/c2`

## Known Issues

- `--print` mode hangs with custom base URLs in v2.1.126. Interactive mode works.
- DeepSeek models return `thinking` blocks before text — Claude Code handles this but `--print` may show empty output
- For non-interactive one-shots, use `hermes chat -q "..." --model deepseek/deepseek-v4-pro` instead

## Model Names

OpenRouter prefixes required:
- `deepseek/deepseek-v4-pro`
- `anthropic/claude-sonnet-4`
- `google/gemini-3.1-flash-image-preview` (Nano Banana 2)
- `google/gemini-3-pro-image-preview` (Nano Banana Pro)
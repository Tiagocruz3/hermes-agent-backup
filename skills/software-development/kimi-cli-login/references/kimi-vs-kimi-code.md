# `kimi` vs `kimi-code` — Two Different Tools

## The Confusion
Users often install both and can't tell which is which. One asks for a **Groq API key**, the other uses **Moonshot browser OAuth**.

## How to Tell Which One You're Running

| Check | Real `kimi` | Fake `kimi-code` |
|-------|-------------|------------------|
| `kimi --version` | `kimi, version 1.41.0` | Does not have `--version` |
| `kimi login` | Prints browser URL | Prints **"Kimi Code CLI"** + **"Starting proxy server"** |
| Process type | Python (uv/pipx) | Node.js (`node .../vite.js`) |
| Config dir | `~/.kimi/` | None (stores API key in OS keychain) |
| Port usage | None | Tries to bind **:3000** |

## Diagnose Your Install

```bash
which kimi
ls -la $(which kimi)
kimi --version 2>&1 | head -1
npm list -g kimi-code 2>/dev/null
```

## If `kimi-code` is installed

Remove it:
```bash
npm uninstall -g kimi-code
```

Then verify only the real `kimi` remains:
```bash
which kimi
kimi --version
```

## Real Kimi Install (if missing)

```bash
# Via uv (recommended)
uv tool install kimi-cli

# Or via pipx
pipx install kimi-cli
```

## Session-Specific Notes
- On this machine: real `kimi` is at `~/.local/share/uv/tools/kimi-cli/bin/kimi`, symlinked from `~/.local/bin/kimi`
- `kimi-code` was installed at `/usr/local/lib/nodejs/node-v22.12.0-linux-arm64/lib/kimi-code@1.0.11`
- Port 3000 was occupied by a Vite dev server from `hermes-workspace`, causing `kimi-code` to crash with `EADDRINUSE`

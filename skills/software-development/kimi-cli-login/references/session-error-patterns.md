# Kimi CLI Error Patterns (Session Log)

## Pattern 1: "unknown option '-m'"
**Cause**: Running the real `kimi` CLI but using `kimi-code` syntax.
- `kimi-code` supports `-m` flag for model selection
- Real `kimi` uses `/model` interactive command or `--model` long flag

**Fix**: Use `kimi -p "prompt"` for one-shot, or enter interactive mode and type `/model`.

## Pattern 2: "listen EADDRINUSE: address already in use 127.0.0.1:3000"
**Cause**: `kimi-code` (npm) is installed and tries to start a proxy server on port 3000.
- Port 3000 is commonly used by Vite, React dev servers, etc.
- `kimi-code` is NOT the real Kimi CLI — it's a separate npm package

**Fix**: `npm uninstall -g kimi-code`, then use `~/.local/bin/kimi` only.

## Pattern 3: "Using stored API key from keychain" + "Starting proxy server"
**Cause**: Definitely running `kimi-code` npm package, not real `kimi`.
- This tool asks for Groq API key, not Moonshot OAuth
- It stores keys in macOS keychain or similar

**Fix**: Same as Pattern 2 — remove `kimi-code`, install real `kimi` via `uv tool install kimi-cli`.

## Verification Commands
```bash
# Check which binary you're actually running
which kimi
ls -la $(which kimi)

# Check version (real kimi returns "kimi, version X.Y.Z")
kimi --version

# Check for npm imposter
npm list -g kimi-code

# Check for port 3000 conflict
lsof -i :3000 || ss -tlnp | grep 3000
```

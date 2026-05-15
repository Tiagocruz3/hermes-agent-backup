When `kimi` / `/login` immediately asks for a Groq API key

**First check: are you running the REAL `kimi` or the npm `kimi-code` wrapper?**
- If `kimi login` prints **"Kimi Code CLI"** and **"Starting proxy server"**, you have the npm package `kimi-code` installed, NOT the real `kimi` CLI.
- See `references/kimi-vs-kimi-code.md` for full diagnosis.
- Fix: `npm uninstall -g kimi-code`, then use `~/.local/bin/kimi` (uv/pipx install).

If you ARE running the real `kimi` and it still asks for Groq:
This usually means Kimi couldn’t find an existing browser/OAuth session and is falling back to an API-key provider.

Checklist
1) Clear any broken/stale login state
   - Quit Kimi
   - Run:
     rm -rf ~/.config/kimi ~/.kimi ~/.local/share/kimi 2>/dev/null || true

2) Start Kimi in the interactive mode so the login menu can appear
   - Run:
     kimi
   - Then type:
     /login

3) In the login menu, pick the option that says **Browser** / **OAuth**.
   - If you only see **API key** options, it means your build/config may not have the OAuth flow enabled.

4) If OAuth is still unavailable
   - You can either:
     - set an API key intentionally (Groq/XAI/etc.), or
     - reinstall/upgrade kimi-cli.

Verification
- After a successful browser login, Kimi should stop printing: "Model: not set, send /login".

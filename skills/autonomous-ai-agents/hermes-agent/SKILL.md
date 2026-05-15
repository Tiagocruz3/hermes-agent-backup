---
name: hermes-agent
description: "Configure, extend, or contribute to Hermes Agent."
version: 2.0.0
author: Hermes Agent + Teknium
license: MIT
metadata:
  hermes:
    tags: [hermes, setup, configuration, multi-agent, spawning, cli, gateway, development]
    homepage: https://github.com/NousResearch/hermes-agent
    related_skills: [claude-code, codex, opencode]
---

# Hermes Agent

Hermes Agent is an open-source AI agent framework by Nous Research that runs in your terminal, messaging platforms, and IDEs. It belongs to the same category as Claude Code (Anthropic), Codex (OpenAI), and OpenClaw — autonomous coding and task-execution agents that use tool calling to interact with your system. Hermes works with any LLM provider (OpenRouter, Anthropic, OpenAI, DeepSeek, local models, and 15+ others) and runs on Linux, macOS, and WSL.

What makes Hermes different:

- **Self-improving through skills** — Hermes learns from experience by saving reusable procedures as skills. When it solves a complex problem, discovers a workflow, or gets corrected, it can persist that knowledge as a skill document that loads into future sessions. Skills accumulate over time, making the agent better at your specific tasks and environment.
- **Persistent memory across sessions** — remembers who you are, your preferences, environment details, and lessons learned. Pluggable memory backends (built-in, Honcho, Mem0, and more) let you choose how memory works.
- **Multi-platform gateway** — the same agent runs on Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, and 10+ other platforms with full tool access, not just chat.
- **Provider-agnostic** — swap models and providers mid-workflow without changing anything else. Credential pools rotate across multiple API keys automatically.
- **Profiles** — run multiple independent Hermes instances with isolated configs, sessions, skills, and memory.
- **Extensible** — plugins, MCP servers, custom tools, webhook triggers, cron scheduling, and the full Python ecosystem.

People use Hermes for software development, research, system administration, data analysis, content creation, home automation, and anything else that benefits from an AI agent with persistent context and full system access.

**This skill helps you work with Hermes Agent effectively** — setting it up, configuring features, spawning additional agent instances, troubleshooting issues, finding the right commands and settings, and understanding how the system works when you need to extend or contribute to it.

**Docs:** https://hermes-agent.nousresearch.com/docs/

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# Interactive chat (default)
hermes

# Single query
hermes chat -q "What is the capital of France?"

# Setup wizard
hermes setup

# Change model/provider
hermes model

# Check health
hermes doctor
```

### Updating

**Pip install** (most users):
```bash
hermes update
```

**Git/source install** (dev, or if `hermes update` reports "commits behind" even after running):
```bash
cd ~/.hermes/hermes-agent
git pull origin main
pip install -e . --break-system-packages   # PEP 668 systems (Ubuntu 24.04+)
```

> **Pitfall:** On PEP 668 systems (Ubuntu 24.04+), `pip install -e .` fails with an externally-managed-environment error. Use `--break-system-packages` or install into a venv. The `hermes update` command only works cleanly for pip-installed Hermes; for git checkouts it may falsely report "N commits behind" because it doesn't rebuild the package.

---

## CLI Reference

### Global Flags

```
hermes [flags] [command]

  --version, -V             Show version
  --resume, -r SESSION      Resume session by ID or title
  --continue, -c [NAME]     Resume by name, or most recent session
  --worktree, -w            Isolated git worktree mode (parallel agents)
  --skills, -s SKILL        Preload skills (comma-separate or repeat)
  --profile, -p NAME        Use a named profile
  --yolo                    Skip dangerous command approval
  --pass-session-id         Include session ID in system prompt
```

No subcommand defaults to `chat`.

### Chat

```
hermes chat [flags]
  -q, --query TEXT          Single query, non-interactive
  -m, --model MODEL         Model (e.g. anthropic/claude-sonnet-4)
  -t, --toolsets LIST       Comma-separated toolsets
  --provider PROVIDER       Force provider (openrouter, anthropic, nous, etc.)
  -v, --verbose             Verbose output
  -Q, --quiet               Suppress banner, spinner, tool previews
  --checkpoints             Enable filesystem checkpoints (/rollback)
  --source TAG              Session source tag (default: cli)
```

### Configuration

```
hermes setup [section]      Interactive wizard (model|terminal|gateway|tools|agent)
hermes model                Interactive model/provider picker
hermes config               View current config
hermes config edit          Open config.yaml in $EDITOR
hermes config set KEY VAL   Set a config value
hermes config path          Print config.yaml path
hermes config env-path      Print .env path
hermes config check         Check for missing/outdated config
hermes config migrate       Update config with new options
hermes login [--provider P] OAuth login (nous, openai-codex)
hermes logout               Clear stored auth
hermes doctor [--fix]       Check dependencies and config
hermes status [--all]       Show component status
```

### Tools & Skills

```
hermes tools                Interactive tool enable/disable (curses UI)
hermes tools list           Show all tools and status
hermes tools enable NAME    Enable a toolset
hermes tools disable NAME   Disable a toolset

hermes skills list          List installed skills
hermes skills search QUERY  Search the skills hub
hermes skills install ID    Install a skill (ID can be a hub identifier OR a direct https://…/SKILL.md URL; pass --name to override when frontmatter has no name)
hermes skills inspect ID    Preview without installing
hermes skills config        Enable/disable skills per platform
hermes skills check         Check for updates
hermes skills update        Update outdated skills
hermes skills uninstall N   Remove a hub skill
hermes skills publish PATH  Publish to registry
hermes skills browse        Browse all available skills
hermes skills tap add REPO  Add a GitHub repo as skill source
```

### MCP Servers

```
hermes mcp serve            Run Hermes as an MCP server
hermes mcp add NAME         Add an MCP server (--url or --command)
hermes mcp remove NAME      Remove an MCP server
hermes mcp list             List configured servers
hermes mcp test NAME        Test connection
hermes mcp configure NAME   Toggle tool selection
```

### Gateway (Messaging Platforms)

```
hermes gateway run          Start gateway foreground
hermes gateway install      Install as background service
hermes gateway start/stop   Control the service
hermes gateway restart      Restart the service
hermes gateway status       Check status
hermes gateway setup        Configure platforms
```

Supported platforms: Telegram, Discord, Slack, WhatsApp, Signal, Email, SMS, Matrix, Mattermost, Home Assistant, DingTalk, Feishu, WeCom, BlueBubbles (iMessage), Weixin (WeChat), API Server, Webhooks. Open WebUI connects via the API Server adapter.

Platform docs: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/

### Sessions

```
hermes sessions list        List recent sessions
hermes sessions browse      Interactive picker
hermes sessions export OUT  Export to JSONL
hermes sessions rename ID T Rename a session
hermes sessions delete ID   Delete a session
hermes sessions prune       Clean up old sessions (--older-than N days)
hermes sessions stats       Session store statistics
```

### Cron Jobs

```
hermes cron list            List jobs (--all for disabled)
hermes cron create SCHED    Create: '30m', 'every 2h', '0 9 * * *'
hermes cron edit ID         Edit schedule, prompt, delivery
hermes cron pause/resume ID Control job state
hermes cron run ID          Trigger on next tick
hermes cron remove ID       Delete a job
hermes cron status          Scheduler status
```

**Autonomy note:** Cron jobs only fire reliably when the scheduler/runtime is always-on (e.g. gateway installed as a service, linger enabled). If jobs arent triggering when youre logged out, re-check user services + linger.

### Webhooks

```
hermes webhook subscribe N  Create route at /webhooks/<name>
hermes webhook list         List subscriptions
hermes webhook remove NAME  Remove a subscription
hermes webhook test NAME    Send a test POST
```

### Profiles

```
hermes profile list         List all profiles
hermes profile create NAME  Create (--clone, --clone-all, --clone-from)
hermes profile use NAME     Set sticky default
hermes profile delete NAME  Delete a profile
hermes profile show NAME    Show details
hermes profile alias NAME   Manage wrapper scripts
hermes profile rename A B   Rename a profile
hermes profile export NAME  Export to tar.gz
hermes profile import FILE  Import from archive
```

### Credential Pools

```
hermes auth add             Interactive credential wizard
hermes auth list [PROVIDER] List pooled credentials
hermes auth remove P INDEX  Remove by provider + index
hermes auth reset PROVIDER  Clear exhaustion status
```

### Other

```
hermes insights [--days N]  Usage analytics
hermes update               Update to latest version
hermes pairing list/approve/revoke  DM authorization
hermes plugins list/install/remove  Plugin management
hermes honcho setup/status  Honcho memory integration (requires honcho plugin)
hermes memory setup/status/off  Memory provider config
hermes completion bash|zsh  Shell completions
hermes acp                  ACP server (IDE integration)
hermes claw migrate         Migrate from OpenClaw
hermes uninstall            Uninstall Hermes
```

---

## Slash Commands (In-Session)

Type these during an interactive chat session.

### Session Control
```
/new (/reset)        Fresh session
/clear               Clear screen + new session (CLI)
/retry               Resend last message
/undo                Remove last exchange
/title [name]        Name the session
/compress            Manually compress context
/stop                Kill background processes
/rollback [N]        Restore filesystem checkpoint
/background <prompt> Run prompt in background
/queue <prompt>      Queue for next turn
/resume [name]       Resume a named session
```

### Configuration
```
/config              Show config (CLI)
/model [name]        Show or change model
/personality [name]  Set personality
/reasoning [level]   Set reasoning (none|minimal|low|medium|high|xhigh|show|hide)
/verbose             Cycle: off → new → all → verbose
/voice [on|off|tts]  Voice mode
/yolo                Toggle approval bypass
/skin [name]         Change theme (CLI)
/statusbar           Toggle status bar (CLI)
```

### Tools & Skills
```
/tools               Manage tools (CLI)
/toolsets            List toolsets (CLI)
/skills              Search/install skills (CLI)
/skill <name>        Load a skill into session
/cron                Manage cron jobs (CLI)
/reload-mcp          Reload MCP servers
/plugins             List plugins (CLI)
```

### Gateway
```
/approve             Approve a pending command (gateway)
/deny                Deny a pending command (gateway)
/restart             Restart gateway (gateway)
/sethome             Set current chat as home channel (gateway)
/update              Update Hermes to latest (gateway)
/platforms (/gateway) Show platform connection status (gateway)
```

### Utility
```
/branch (/fork)      Branch the current session
/fast                Toggle priority/fast processing
/browser             Open CDP browser connection
/history             Show conversation history (CLI)
/save                Save conversation to file (CLI)
/paste               Attach clipboard image (CLI)
/image               Attach local image file (CLI)
```

### Info
```
/help                Show commands
/commands [page]     Browse all commands (gateway)
/usage               Token usage
/insights [days]     Usage analytics
/status              Session info (gateway)
/profile             Active profile info
```

### Exit
```
/quit (/exit, /q)    Exit CLI
```

---

## Key Paths & Config

```
~/.hermes/config.yaml       Main configuration
~/.hermes/.env              API keys and secrets
$HERMES_HOME/skills/        Installed skills
~/.hermes/sessions/         Session transcripts
~/.hermes/logs/             Gateway and error logs
~/.hermes/auth.json         OAuth tokens and credential pools
~/.hermes/hermes-agent/     Source code (if git-installed)
```

Profiles use `~/.hermes/profiles/<name>/` with the same layout.

### Config Sections

Edit with `hermes config edit` or `hermes config set section.key value`.

| Section | Key options |
|---------|-------------|
| `model` | `default`, `provider`, `base_url`, `api_key`, `context_length` |
| `agent` | `max_turns` (90), `tool_use_enforcement` |
| `terminal` | `backend` (local/docker/ssh/modal), `cwd`, `timeout` (180) |
| `compression` | `enabled`, `threshold` (0.50), `target_ratio` (0.20) |
| `display` | `skin`, `tool_progress`, `show_reasoning`, `show_cost` |
| `stt` | `enabled`, `provider` (local/groq/openai/mistral) |
| `tts` | `provider` (edge/elevenlabs/openai/minimax/mistral/neutts) |
| `memory` | `memory_enabled`, `user_profile_enabled`, `provider` |
| `security` | `tirith_enabled`, `website_blocklist` |
| `delegation` | `model`, `provider`, `base_url`, `api_key`, `max_iterations` (50), `reasoning_effort` |
| `checkpoints` | `enabled`, `max_snapshots` (50) |

Full config reference: https://hermes-agent.nousresearch.com/docs/user-guide/configuration

### Providers

20+ providers supported. Set via `hermes model` or `hermes setup`.

| Provider | Auth | Key env var |
|----------|------|-------------|
| OpenRouter | API key | `OPENROUTER_API_KEY` |
| Anthropic | API key | `ANTHROPIC_API_KEY` |
| Nous Portal | OAuth | `hermes auth` |
| OpenAI Codex | OAuth | `hermes auth` |
| GitHub Copilot | Token | `COPILOT_GITHUB_TOKEN` |
| Google Gemini | API key | `GOOGLE_API_KEY` or `GEMINI_API_KEY` |
| DeepSeek | API key | `DEEPSEEK_API_KEY` |
| xAI / Grok | API key | `XAI_API_KEY` |
| Hugging Face | Token | `HF_TOKEN` |
| Z.AI / GLM | API key | `GLM_API_KEY` |
| MiniMax | API key | `MINIMAX_API_KEY` |
| MiniMax CN | API key | `MINIMAX_CN_API_KEY` |
| Kimi / Moonshot | API key | `KIMI_API_KEY` |
| Alibaba / DashScope | API key | `DASHSCOPE_API_KEY` |
| Xiaomi MiMo | API key | `XIAOMI_API_KEY` |
| Kilo Code | API key | `KILOCODE_API_KEY` |
| AI Gateway (Vercel) | API key | `AI_GATEWAY_API_KEY` |
| OpenCode Zen | API key | `OPENCODE_ZEN_API_KEY` |
| OpenCode Go | API key | `OPENCODE_GO_API_KEY` |
| Qwen OAuth | OAuth | `hermes login --provider qwen-oauth` |
| Custom endpoint | Config | `model.base_url` + `model.api_key` in config.yaml |
| GitHub Copilot ACP | External | `COPILOT_CLI_PATH` or Copilot CLI |

Full provider docs: https://hermes-agent.nousresearch.com/docs/integrations/providers

### Toolsets

Enable/disable via `hermes tools` (interactive) or `hermes tools enable/disable NAME`.

| Toolset | What it provides |
|---------|-----------------|
| `web` | Web search and content extraction |
| `browser` | Browser automation (Browserbase, Camofox, or local Chromium) |
| `terminal` | Shell commands and process management |
| `file` | File read/write/search/patch |
| `code_execution` | Sandboxed Python execution |
| `vision` | Image analysis |
| `image_gen` | AI image generation |
| `tts` | Text-to-speech |
| `skills` | Skill browsing and management |
| `memory` | Persistent cross-session memory |
| `session_search` | Search past conversations |
| `delegation` | Subagent task delegation |
| `cronjob` | Scheduled task management |
| `clarify` | Ask user clarifying questions |
| `messaging` | Cross-platform message sending |
| `search` | Web search only (subset of `web`) |
| `todo` | In-session task planning and tracking |
| `rl` | Reinforcement learning tools (off by default) |
| `moa` | Mixture of Agents (off by default) |
| `homeassistant` | Smart home control (off by default) |

Tool changes take effect on `/reset` (new session). They do NOT apply mid-conversation to preserve prompt caching.

### Platform Toolsets (Critically Important)

**Each platform has its own tool list!** The `platform_toolsets` section in `config.yaml` controls which tools are available on which platform. CLI sessions get the full suite by default, but messaging platforms (Telegram, Discord, etc.) are **barebones by default** — often just the platform adapter + Spotify.

```yaml
platform_toolsets:
  cli:                           # Full tool access (default)
    - browser, clarify, code_execution, cronjob, delegation
    - file, image_gen, kanban, memory, messaging
    - session_search, skills, spotify, terminal, todo, tts, vision, web
  telegram:                      # Default: only 2 tools (!)
    - hermes-telegram
    - spotify
  discord:
    - hermes-discord
    - spotify
```

**Common pitfall:** You're talking to Hermes on Telegram and it can't run shell commands, read files, or search the web. The agent says "I don't have a terminal tool." This is because `terminal` isn't in the Telegram platform_toolsets list. Fix it by editing `config.yaml`:

```bash
hermes config edit
# Find platform_toolsets -> telegram, add the tools you want
```

**Full tools list for messaging platforms** (copy this to give the agent everything):

```yaml
telegram:
  - hermes-telegram
  - browser
  - clarify
  - code_execution
  - cronjob
  - delegation
  - file
  - image_gen
  - kanban
  - memory
  - messaging
  - session_search
  - skills
  - spotify
  - terminal
  - todo
  - tts
  - vision
  - web
```

After editing, restart the gateway: `systemctl --user restart hermes-gateway` (or `hermes gateway restart`). Then start a **new session** (`/reset` in chat) for tools to take effect.

---

## Security & Privacy Toggles

Common "why is Hermes doing X to my output / tool calls / commands?" toggles — and the exact commands to change them. Most of these need a fresh session (`/reset` in chat, or start a new `hermes` invocation) because they're read once at startup.

### Secret redaction in tool output

Secret redaction is **off by default** — tool output (terminal stdout, `read_file`, web content, subagent summaries, etc.) passes through unmodified.

Enable it to reduce accidental leakage of API keys/tokens into Hermes session logs:

### Secret redaction in tool output

Secret redaction is **off by default** — tool output (terminal stdout, `read_file`, web content, subagent summaries, etc.) passes through unmodified.

If you expect to paste credentials into interactive CLIs (e.g. `gh auth login --with-token`) or you run Hermes in chat platforms where messages are logged, you should enable redaction:

```bash
hermes config set security.redact_secrets true       # enable globally
```

**Important:** Redaction reduces *accidental* leakage in tool output/logs, but it is not perfect. The safest practice is still: **never paste tokens into chat messages**.

**Restart required.** `security.redact_secrets` is snapshotted at import time — toggling it mid-session (e.g. via `export HERMES_REDACT_SECRETS=true` from a tool call) will NOT take effect for the running process. Tell the user to run `hermes config set security.redact_secrets true` in a terminal, then start a new session.

Disable again with:
```bash
hermes config set security.redact_secrets false
```

Related references:
- `references/security-unattended-sudo-and-tokens.md`
- `references/image-generation-provider-notes.md`

See: `references/security-unattended-sudo-and-tokens.md`.

See also: `references/github-cli-auth-and-safety.md`.

### PII redaction in gateway messages

Separate from secret redaction. When enabled, the gateway hashes user IDs and strips phone numbers from the session context before it reaches the model:

```bash
hermes config set privacy.redact_pii true    # enable
hermes config set privacy.redact_pii false   # disable (default)
```

### Command approval prompts

By default (`approvals.mode: manual`), Hermes prompts the user before running shell commands flagged as destructive (`rm -rf`, `git reset --hard`, etc.). The modes are:

- `manual` — always prompt (default)
- `smart` — use an auxiliary LLM to auto-approve low-risk commands, prompt on high-risk
- `off` — skip all approval prompts (equivalent to `--yolo`)

```bash
hermes config set approvals.mode smart       # recommended middle ground
hermes config set approvals.mode off         # bypass everything (not recommended)
```

Per-invocation bypass without changing config:
- `hermes --yolo …`
- `export HERMES_YOLO_MODE=1`

Note: YOLO / `approvals.mode: off` does NOT turn off secret redaction. They are independent.

### Shell hooks allowlist

Some shell-hook integrations require explicit allowlisting before they fire. Managed via `~/.hermes/shell-hooks-allowlist.json` — prompted interactively the first time a hook wants to run.

### Disabling the web/browser/image-gen tools

To keep the model away from network or media tools entirely, open `hermes tools` and toggle per-platform. Takes effect on next session (`/reset`). See the Tools & Skills section above.

---

## Voice & Transcription

### STT (Voice → Text)

Voice messages from messaging platforms are auto-transcribed.

Provider priority (auto-detected):
1. **Local faster-whisper** — free, no API key: `pip install faster-whisper`
2. **Groq Whisper** — free tier: set `GROQ_API_KEY`
3. **OpenAI Whisper** — paid: set `VOICE_TOOLS_OPENAI_KEY`
4. **Mistral Voxtral** — set `MISTRAL_API_KEY`

Config:
```yaml
stt:
  enabled: true
  provider: local        # local, groq, openai, mistral
  local:
    model: base          # tiny, base, small, medium, large-v3
```

### TTS (Text → Voice)

| Provider | Env var | Free? |
|----------|---------|-------|
| Edge TTS | None | Yes (default) |
| ElevenLabs | `ELEVENLABS_API_KEY` | Free tier |
| OpenAI | `VOICE_TOOLS_OPENAI_KEY` | Paid |
| MiniMax | `MINIMAX_API_KEY` | Paid |
| Mistral (Voxtral) | `MISTRAL_API_KEY` | Paid |
| NeuTTS (local) | None (`pip install neutts[all]` + `espeak-ng`) | Free |

Voice commands: `/voice on` (voice-to-voice), `/voice tts` (always voice), `/voice off`.

---

## Spawning Additional Hermes Instances

Run additional Hermes processes as fully independent subprocesses — separate sessions, tools, and environments.

### When to Use This vs delegate_task

| | `delegate_task` | Spawning `hermes` process |
|-|-----------------|--------------------------|
| Isolation | Separate conversation, shared process | Fully independent process |
| Duration | Minutes (bounded by parent loop) | Hours/days |
| Tool access | Subset of parent's tools | Full tool access |
| Interactive | No | Yes (PTY mode) |
| Use case | Quick parallel subtasks | Long autonomous missions |

### One-Shot Mode

```
terminal(command="hermes chat -q 'Research GRPO papers and write summary to ~/research/grpo.md'", timeout=300)

# Background for long tasks:
terminal(command="hermes chat -q 'Set up CI/CD for ~/myapp'", background=true)
```

### Interactive PTY Mode (via tmux)

Hermes uses prompt_toolkit, which requires a real terminal. Use tmux for interactive spawning:

```
# Start
terminal(command="tmux new-session -d -s agent1 -x 120 -y 40 'hermes'", timeout=10)

# Wait for startup, then send a message
terminal(command="sleep 8 && tmux send-keys -t agent1 'Build a FastAPI auth service' Enter", timeout=15)

# Read output
terminal(command="sleep 20 && tmux capture-pane -t agent1 -p", timeout=5)

# Send follow-up
terminal(command="tmux send-keys -t agent1 'Add rate limiting middleware' Enter", timeout=5)

# Exit
terminal(command="tmux send-keys -t agent1 '/exit' Enter && sleep 2 && tmux kill-session -t agent1", timeout=10)
```

### Multi-Agent Coordination

```
# Agent A: backend
terminal(command="tmux new-session -d -s backend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t backend 'Build REST API for user management' Enter", timeout=15)

# Agent B: frontend
terminal(command="tmux new-session -d -s frontend -x 120 -y 40 'hermes -w'", timeout=10)
terminal(command="sleep 8 && tmux send-keys -t frontend 'Build React dashboard for user management' Enter", timeout=15)

# Check progress, relay context between them
terminal(command="tmux capture-pane -t backend -p | tail -30", timeout=5)
terminal(command="tmux send-keys -t frontend 'Here is the API schema from the backend agent: ...' Enter", timeout=5)
```

### Session Resume

```
# Resume most recent session
terminal(command="tmux new-session -d -s resumed 'hermes --continue'", timeout=10)

# Resume specific session
terminal(command="tmux new-session -d -s resumed 'hermes --resume 20260225_143052_a1b2c3'", timeout=10)
```

### Tips

- **Prefer `delegate_task` for quick subtasks** — less overhead than spawning a full process
- **Use `-w` (worktree mode)** when spawning agents that edit code — prevents git conflicts
- **Set timeouts** for one-shot mode — complex tasks can take 5-10 minutes
- **Use `hermes chat -q` for fire-and-forget** — no PTY needed
- **Use tmux for interactive sessions** — raw PTY mode has `\r` vs `\n` issues with prompt_toolkit
- **For scheduled tasks**, use the `cronjob` tool instead of spawning — handles delivery and retry

---

See `references/claude-code-openrouter.md` for configuring Claude Code v2.1.126 with OpenRouter (the double-v1 URL bug + `c2` wrapper script) and using DeepSeek V4 Pro as the default model.

See `references/live-voice-call-setup.md` for local voice call with ElevenLabs TTS, tgcalls ARM64 blocker, and the working voice-message flow via Telegram.

See `references/gmail-email-setup-troubleshooting.md` for Gmail App Password format, IMAP prerequisites, direct credential testing, and troubleshooting when Google rejects valid credentials.

See `references/elevenlabs-voice-troubleshooting.md` for querying available ElevenLabs voices via API when a voice_id is not found and fixing TTS failures.

See `references/claude-kimi-openrouter-setup.md` for installing Claude Code + Kimi Code CLI (`kimi`), running Claude Code through OpenRouter, the Groq API key requirement for Kimi Code, and bin path configuration on this machine.

**CRITICAL UPDATE**: There are TWO separate `kimi` tools. The npm package `kimi-code` (v1.0.11) is NOT the real Kimi CLI — it's a proxy server that asks for Groq API key and binds port 3000. The real `kimi` is installed via `uv tool install kimi-cli` (v1.41.0+) and uses Moonshot OAuth browser login. If `kimi login` prints "Kimi Code CLI" or crashes with `EADDRINUSE:3000`, you have the npm imposter. Remove it: `npm uninstall -g kimi-code`. See `references/kimi-vs-kimi-code.md` for full details.

See `references/claude-code-openrouter-gotchas.md` for the double-/v1 URL pitfall (ANTHROPIC_BASE_URL must NOT end with /v1), --print mode limitation, and Kimi Code routing notes.

See `references/puppeteer-arm64-local-browser.md` for ARM64 Chrome binary issues (use snap Chromium with --no-sandbox), foreground/background X display access, Wayland vs X11 screen capture, and CDP session drop mitigation.

See `references/voice-call-setup.md` for ElevenLabs voice call integration, local voice call script, audio hardware limitation from agent terminal, and tgcalls ARM64 build failure.

### Troubleshooting

### Voice not working
1. Check `stt.enabled: true` in config.yaml
2. Verify provider: `pip install faster-whisper` or set API key
3. In gateway: `/restart`. In CLI: exit and relaunch.
4. **ElevenLabs 404 "voice_not_found"**: the default voice ID (`GranGvyNCM9ZWe9OddHC`) often doesn't exist. List available voices with `curl -s "https://api.elevenlabs.io/v1/voices" -H "xi-api-key: $ELEVENLABS_API_KEY" | python3 -c "import json,sys;[print(f'{v[\"voice_id\"]} | {v[\"name\"]}') for v in json.load(sys.stdin)['voices']]"` and set a valid one: `hermes config set tts.elevenlabs.voice_id <id>`

### Tool not available
1. `hermes tools` — check if toolset is enabled for your platform
2. Some tools need env vars (check `.env`)
3. `/reset` after enabling tools

### Model/provider issues
1. `hermes doctor` — check config and dependencies
2. `hermes login` — re-authenticate OAuth providers
3. Check `.env` has the right API key
4. **Copilot 403**: `gh auth login` tokens do NOT work for Copilot API. You must use the Copilot-specific OAuth device code flow via `hermes model` → GitHub Copilot.

### Dashboard not starting / not opening in browser (dashboard server not listening)

Common symptom patterns:
- Browser shows: "Firefox can’t connect to the server at 127.0.0.1:9119"
- `ss -ltnp | grep :9119` shows **nothing** listening
- `hermes dashboard` exits immediately with one of:
  - "Web UI frontend not built and npm is not available"
  - "Web UI requires fastapi and uvicorn"

Quick verification (proves whether youre debugging the right layer):
```bash
ss -ltnp | grep :9119 || true
curl -sS -I http://127.0.0.1:9119 | head -n 5 || true
```
If the `curl -I` returns `405 Method Not Allowed` and `allow: GET`, the server is up; open the URL in a browser (GET) or run `curl http://127.0.0.1:9119/`.

If you suspect stale processes, stop them first:
```bash
hermes dashboard --stop
```

Root causes (most common):
1) **Frontend not built** (Node/npm missing)
2) **Backend deps missing** (`fastapi`, `uvicorn`)
3) **pip missing** (some minimal Python installs dont ship `pip`/`ensurepip`)

### Pitfall: non-interactive sudo prompts (tool-run commands)

When Hermes (or any non-interactive runner) executes `sudo ...` and sudo needs a password, it will fail with `sudo: a password is required`.

Options:
- Run the required `sudo` commands yourself in a real terminal.
- Or (advanced) add a *limited* NOPASSWD sudoers rule for the specific commands needed during setup (e.g. `apt-get`, `systemctl`). Don’t use broad `NOPASSWD: ALL` unless you understand the risk.

**Quick check:**
```bash
sudo -n true && echo OK || echo "sudo needs password"
```

**Recommended pattern (unattended installs without giving away everything):**
Create a dedicated sudoers file and allowlist only the commands Hermes actually needs.

```bash
sudo visudo -f /etc/sudoers.d/hermes-agent
```
Example (adjust username + paths to your distro):
```sudoers
ace ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/systemctl, /usr/bin/loginctl, /usr/bin/journalctl
Defaults:ace !authenticate
```
See: `references/security-unattended-sudo-and-tokens.md`.

Fix (source checkout / dev install):

Example sudoers snippet (adjust username):
```sudoers
# /etc/sudoers.d/hermes-agent
ace ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/systemctl, /usr/bin/loginctl, /usr/bin/journalctl
Defaults:ace !authenticate
```
Edit safely with:
```bash
sudo visudo -f /etc/sudoers.d/hermes-agent
```

See also: `references/github-cli-auth-and-safety.md`.

**Quick check:**
```bash
sudo -n true && echo "sudo nopasswd OK" || echo "sudo needs password"
```

See: `references/unattended-terminal-access-sudoers.md` and `templates/sudoers-hermes-agent`.

Fix (source checkout / dev install):

Step 0 — sanity checks (run on the same machine you’re opening the browser on):
```bash
node -v || true
npm -v || true
python3 -m pip --version || true
ss -ltnp | grep :9119 || true
```

Step 1 — install prerequisites (Debian/Ubuntu):
```bash
sudo apt-get update
sudo apt-get install -y nodejs npm python3-pip
```

Step 2 — build the frontend:
```bash
cd web
npm install
npm run build
```

Step 3 — install backend deps (if Hermes reports they're missing):
```bash
python3 -m pip install 'fastapi' 'uvicorn[standard]'
```
**Pitfall:** The `terminal` tool may falsely flag `pip install` commands as "long-lived server processes" and block them with "This foreground command appears to start a long-lived server/watch process." If this happens, use `execute_code` with `subprocess.run()` directly instead.

Step 4 — start the dashboard and verify it's listening:
```bash
hermes dashboard --host 127.0.0.1 --port 9119 --no-open
ss -ltnp | grep :9119
```

Notes / pitfalls:
- **127.0.0.1 is always local-only.** If you start the dashboard on machine A but open the browser on machine B, `127.0.0.1:9119` won’t work. Use the server’s LAN IP instead and start with `--insecure` only if you understand the risk.
- `--insecure` is dangerous: it can expose API keys/config on your network.

See `references/dashboard-frontend-build.md`, `references/dashboard-local-troubleshooting.md`, and (for Node/Vite version constraints, ARM64 tarball selection, and the npm optional-deps native-binding failure) `references/dashboard-node-vite-arm64.md`.

### Changes not taking effect
- **Tools/skills:** `/reset` starts a new session with updated toolset
- **Config changes:** In gateway: `/restart`. In CLI: exit and relaunch.
- **Code changes:** Restart the CLI or gateway process

### Skills not showing
1. `hermes skills list` — verify installed
2. `hermes skills config` — check platform enablement
3. Load explicitly: `/skill name` or `hermes -s name`
### Run the Dashboard as an always-on service (start on boot, survive logout)

If you want the dashboard to behave like a server (always accessible, starts on boot, keeps running after logout), run it as a **systemd user service** and enable **linger**.

- Guide + example unit file: `references/dashboard-systemd-always-on.md`

Key pieces:
- Create `~/.config/systemd/user/hermes-dashboard.service`
- `systemctl --user enable --now hermes-dashboard.service`
- Enable linger (one-time): `sudo loginctl enable-linger $USER`
- Optional: prevent suspend: `sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target`

### Gateway issues

**Gmail email setup**: see `references/gmail-email-setup.md` — Gmail IMAP/SMTP requires 2FA, App Passwords (no spaces!), IMAP enabled, and a warm account. Multiple prerequisites, easy to miss one.

Check logs first:
```bash
grep -i "failed to send\\|error" ~/.hermes/logs/gateway.log | tail -20
```

Also see: `references/systemd-dashboard-gateway-always-on.md` for running the gateway/dashboard as systemd user services, enabling linger (boot + survive logout), disabling sleep, and verifying EnvironmentFile env vars via `/proc/<pid>/environ`.

Common gateway problems:
- **Gateway dies on SSH logout**: Enable linger: `sudo loginctl enable-linger $USER`
- **Gateway dies on WSL2 close**: WSL2 requires `systemd=true` in `/etc/wsl.conf` for systemd services to work. Without it, gateway falls back to `nohup` (dies when session closes).
- **Gateway crash loop**: Reset the failed state: `systemctl --user reset-failed hermes-gateway`

#### Telegram-specific gateway problems

See `references/terminal-background-process-pitfalls.md` for why `terminal` rejects `&` backgrounding and the `execute_code` + `subprocess.Popen` escape hatch for starting tunnels, dev servers, and other long-lived processes.

See `references/wayland-screen-capture.md` for Wayland screen capture limitations (scrot/x11grab/gdbus failures, PipeWire portal options, X11 migration).

- **"No messaging platforms enabled" after restart**: Environment variables (especially `TELEGRAM_BOT_TOKEN`) aren't reaching the gateway process. Check `~/.hermes/.env` for formatting issues — inline `#` comments on the same line as `KEY=value` can break parsing. Keep comments on their own line. Verify with `grep TELEGRAM_BOT_TOKEN ~/.hermes/.env`. Restart the gateway after fixing.
- **Gateway says "Connected to Telegram" but messages aren't received**: The polling loop is stuck. This often happens after a gateway crash-restart cycle where the previous shutdown wasn't clean. Restart: `systemctl --user restart hermes-gateway.service`. Verify inbound works by checking for "inbound message" in logs after you send a test message.
- **send_message fails with "No home channel set"**: You need `TELEGRAM_HOME_CHANNEL` in config.yaml. Set it: `hermes config set TELEGRAM_HOME_CHANNEL <chat_id>` (find the chat ID from gateway.log — look for "chat=XXXXXXXXXX" in inbound message lines). Gateway restart not required — takes effect immediately.
- **Telegram DNS / connectivity**: Hermes uses DoH fallback IPs (149.154.167.220) when system DNS for api.telegram.org fails. This is normal on some networks/ISPs. If you see "DoH discovery yielded no new IPs" followed by "Using seed fallback IPs", connectivity is working via the fallback.

### Platform-specific issues
- **Discord bot silent**: Must enable **Message Content Intent** in Bot → Privileged Gateway Intents.
- **Slack bot only works in DMs**: Must subscribe to `message.channels` event. Without it, the bot ignores public channels.
- **Windows HTTP 400 "No models provided"**: Config file encoding issue (BOM). Ensure `config.yaml` is saved as UTF-8 without BOM.

### Auxiliary models not working
If `auxiliary` tasks (vision, compression, session_search) fail silently, the `auto` provider can't find a backend. Either set `OPENROUTER_API_KEY` or `GOOGLE_API_KEY`, or explicitly configure each auxiliary task's provider:
```bash
hermes config set auxiliary.vision.provider <your_provider>
hermes config set auxiliary.vision.model <model_name>
```

---

## Where to Find Things

| Looking for... | Location |
|----------------|----------|
| Config options | `hermes config edit` or [Configuration docs](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) |
| Available tools | `hermes tools list` or [Tools reference](https://hermes-agent.nousresearch.com/docs/reference/tools-reference) |
| Slash commands | `/help` in session or [Slash commands reference](https://hermes-agent.nousresearch.com/docs/reference/slash-commands) |
| Skills catalog | `hermes skills browse` or [Skills catalog](https://hermes-agent.nousresearch.com/docs/reference/skills-catalog) |
| Provider setup | `hermes model` or [Providers guide](https://hermes-agent.nousresearch.com/docs/integrations/providers) |
| Platform setup | `hermes gateway setup` or [Messaging docs](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/) |
| MCP servers | `hermes mcp list` or [MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) |
| Profiles | `hermes profile list` or [Profiles docs](https://hermes-agent.nousresearch.com/docs/user-guide/profiles) |
| Cron jobs | `hermes cron list` or [Cron docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/cron) |
| Memory | `hermes memory status` or [Memory docs](https://hermes-agent.nousresearch.com/docs/user-guide/features/memory) |
| Env variables | `hermes config env-path` or [Env vars reference](https://hermes-agent.nousresearch.com/docs/reference/environment-variables) |
| CLI commands | `hermes --help` or [CLI reference](https://hermes-agent.nousresearch.com/docs/reference/cli-commands) |
| Gateway logs | `~/.hermes/logs/gateway.log` |
| Session files | `~/.hermes/sessions/` or `hermes sessions browse` |
| Source code | `~/.hermes/hermes-agent/` |

---

## Contributor Quick Reference

For occasional contributors and PR authors. Full developer docs: https://hermes-agent.nousresearch.com/docs/developer-guide/

### Project Layout

```
hermes-agent/
├── run_agent.py          # AIAgent — core conversation loop
├── model_tools.py        # Tool discovery and dispatch
├── toolsets.py           # Toolset definitions
├── cli.py                # Interactive CLI (HermesCLI)
├── hermes_state.py       # SQLite session store
├── agent/                # Prompt builder, context compression, memory, model routing, credential pooling, skill dispatch
├── hermes_cli/           # CLI subcommands, config, setup, commands
│   ├── commands.py       # Slash command registry (CommandDef)
│   ├── config.py         # DEFAULT_CONFIG, env var definitions
│   └── main.py           # CLI entry point and argparse
├── tools/                # One file per tool
│   └── registry.py       # Central tool registry
├── gateway/              # Messaging gateway
│   └── platforms/        # Platform adapters (telegram, discord, etc.)
├── cron/                 # Job scheduler
├── tests/                # ~3000 pytest tests
└── website/              # Docusaurus docs site
```

Config: `~/.hermes/config.yaml` (settings), `~/.hermes/.env` (API keys).

### Adding a Tool (3 files)

**1. Create `tools/your_tool.py`:**
```python
import json, os
from tools.registry import registry

def check_requirements() -> bool:
    return bool(os.getenv("EXAMPLE_API_KEY"))

def example_tool(param: str, task_id: str = None) -> str:
    return json.dumps({"success": True, "data": "..."})

registry.register(
    name="example_tool",
    toolset="example",
    schema={"name": "example_tool", "description": "...", "parameters": {...}},
    handler=lambda args, **kw: example_tool(
        param=args.get("param", ""), task_id=kw.get("task_id")),
    check_fn=check_requirements,
    requires_env=["EXAMPLE_API_KEY"],
)
```

**2. Add to `toolsets.py`** → `_HERMES_CORE_TOOLS` list.

Auto-discovery: any `tools/*.py` file with a top-level `registry.register()` call is imported automatically — no manual list needed.

All handlers must return JSON strings. Use `get_hermes_home()` for paths, never hardcode `~/.hermes`.

### Adding a Slash Command

1. Add `CommandDef` to `COMMAND_REGISTRY` in `hermes_cli/commands.py`
2. Add handler in `cli.py` → `process_command()`
3. (Optional) Add gateway handler in `gateway/run.py`

All consumers (help text, autocomplete, Telegram menu, Slack mapping) derive from the central registry automatically.

### Agent Loop (High Level)

```
run_conversation():
  1. Build system prompt
  2. Loop while iterations < max:
     a. Call LLM (OpenAI-format messages + tool schemas)
     b. If tool_calls → dispatch each via handle_function_call() → append results → continue
     c. If text response → return
  3. Context compression triggers automatically near token limit
```

### Testing

If you are working inside the hermes-agent repo, prefer the repo wrapper script (CI-parity):

```bash
scripts/run_tests.sh                                  # full suite
scripts/run_tests.sh tests/tools/                     # directory
scripts/run_tests.sh tests/tools/test_example.py::test_x  # single test
```

Notes:
- The wrapper enforces hermetic env parity (HOME/temp, TZ/locale, API key unsets, stable xdist worker count)
- Avoid invoking `pytest` directly unless you have a specific reason

### Commit Conventions

```
type: concise subject line

Optional body.
```

Types: `fix:`, `feat:`, `refactor:`, `docs:`, `chore:`

### Key Rules

- **Never break prompt caching** — don't change context, tools, or system prompt mid-conversation
- **Message role alternation** — never two assistant or two user messages in a row
- Use `get_hermes_home()` from `hermes_constants` for all paths (profile-safe)
- Config values go in `config.yaml`, secrets go in `.env`
- New tools need a `check_fn` so they only appear when requirements are met

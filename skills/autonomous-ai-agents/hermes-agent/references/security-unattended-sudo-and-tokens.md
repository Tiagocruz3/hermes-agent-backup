# Unattended sudo + token handling (ops notes)

This reference captures two recurring pitfalls when running Hermes as an always-on assistant (gateway + cron) that can install packages, manage services, and authenticate to third-party CLIs.

## 1) Unattended sudo: make it work without giving away the whole machine

**Symptom:** tool-run commands fail with:
- `sudo: a password is required`

**Quick probe:**
```bash
sudo -n true && echo OK || echo "sudo needs password"
```

### Recommended: limited NOPASSWD allowlist

Create a dedicated sudoers drop-in (name it for the agent, not for the user):
```bash
sudo visudo -f /etc/sudoers.d/hermes-agent
```

Example allowlist for Ubuntu/Debian style administration (adjust username + paths):
```sudoers
ace ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/systemctl, /usr/bin/loginctl, /usr/bin/journalctl
Defaults:ace !authenticate
```

Notes:
- Avoid `NOPASSWD: ALL` unless you explicitly want full root escalation.
- Prefer listing **full absolute paths** (as above).
- If you need additional admin actions, add them deliberately (e.g. `/usr/bin/ufw`).

## 2) Token leakage: never paste tokens into chat

**Failure mode:** user pastes PAT/API key into a chat platform (Telegram/Slack/etc.) and it is now in:
- platform history
- Hermes session transcripts
- logs / backups

### Minimum mitigation
Enable Hermes secret redaction:
```bash
hermes config set security.redact_secrets true
```
Restart Hermes (gateway/CLI) to apply.

### Best practice
- Never paste tokens into chat messages.
- If a token is pasted by mistake: **revoke it immediately** and rotate.

### Safer CLI auth patterns
- Prefer device/OAuth flows when available (e.g. `gh auth login` device flow).
- If you must use a token with `gh`, prefer stdin-prompt mode:
  - `gh auth login --with-token` (paste into terminal prompt, not command line, not chat)

## 3) Clarification tool availability

Some Hermes deployments do not expose a dedicated `clarify` tool call in toolspace.
If a `clarify` tool call errors, fall back to asking the question in normal assistant text.

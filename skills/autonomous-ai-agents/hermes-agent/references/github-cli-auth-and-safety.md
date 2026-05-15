# GitHub CLI (gh) auth + safety notes (Hermes unattended ops)

This reference captures a common pattern in Hermes Telegram/remote sessions:

- Hermes can run `sudo` commands only if sudo is non-interactive (NOPASSWD) OR the user is present to type a password.
- Users sometimes paste Personal Access Tokens (PATs) into chat. This leaks secrets into chat logs and Hermes session logs.

## Golden rules

- **Never paste tokens into chat** (Telegram/Slack/etc.). Treat chats as logged.
- Prefer **device flow** or **SSH keys** over PATs.
- If a token is pasted into chat, **revoke it immediately** and rotate.

## Recommended auth (best for unattended)

### 1) Install gh (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y gh
```

### 2) Authenticate `gh` using device flow (no token in chat)

Run on the machine (interactive):

```bash
gh auth login
```

Verify:

```bash
gh auth status -h github.com
```

### 3) Git transport preference

For simplicity when using `gh` credentials:

```bash
gh config set -h github.com git_protocol https
```

For strongest security / fewer credential prompts, use SSH:

```bash
ssh-keygen -t ed25519 -C "$USER@$(hostname)" -f ~/.ssh/id_ed25519 -N ""
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

Add the public key at: https://github.com/settings/ssh/new

Verify:
```bash
ssh -T git@github.com
```

## PAT login (only if you must)

Run on the machine:

```bash
gh auth login --with-token
```

Paste the PAT **into the terminal prompt**, never in chat, and never on the command line.

## If a PAT was leaked

1) Revoke: https://github.com/settings/tokens
2) Create a new token with minimum scopes required.
3) Re-authenticate `gh`.

## Hermes hardening

Enable secret redaction (helps reduce accidental echo of secrets into logs):

```bash
hermes config set security.redact_secrets true
```

Restart Hermes sessions/gateway after changing config.

## Unattended sudo prerequisite

If Hermes must install packages while the user is away, sudo must not prompt for a password.

Prefer *limited* NOPASSWD rules for only needed binaries (example):

```sudoers
# /etc/sudoers.d/hermes-agent
ace ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/systemctl, /usr/bin/loginctl, /usr/bin/journalctl
Defaults:ace !authenticate
```

Use `visudo -f /etc/sudoers.d/hermes-agent` to edit and validate.

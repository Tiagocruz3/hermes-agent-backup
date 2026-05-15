# Hermes: keep dashboard + gateway always-on (systemd user services)

This note captures a proven workflow for running Hermes components like a server on Linux (Ubuntu), with automatic restart, start-on-boot, and survival across logout.

## Goal
- Dashboard always available locally: http://127.0.0.1:9119
- Gateway always running (Telegram, etc.) as a background service
- Machine does not suspend

## Key techniques

### 1) Systemd --user services + linger
User services normally stop when the user logs out. Enable *linger* once:

  sudo loginctl enable-linger <user>

After this, `systemctl --user ...` services start at boot and keep running without an interactive login.

Verify:

  loginctl show-user <user> -p Linger
  # expect: Linger=yes

### 2) Disable sleep/suspend/hibernate
To make the machine never sleep:

  sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

### 3) Dashboard as a systemd user service
Create `~/.config/systemd/user/hermes-dashboard.service`:

[Unit]
Description=Hermes Dashboard (local-only)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=<PATH_TO_HERMES> dashboard --host 127.0.0.1 --port 9119 --no-open --tui
Restart=always
RestartSec=2
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=default.target

Then:

  systemctl --user daemon-reload
  systemctl --user enable --now hermes-dashboard.service

Verify listening:

  ss -ltnp | grep ':9119'
  curl -I http://127.0.0.1:9119 | head

### 4) Gateway as a systemd user service
Hermes can install a user unit:

  hermes gateway install
  hermes gateway start

Logs:

  journalctl --user -u hermes-gateway.service -n 200 --no-pager

### 5) EnvironmentFile pitfall: template .env vs active env vars
In practice, a large template `~/.hermes/.env` may contain commented placeholders and formatting that prevents the expected keys from being set.

When you need a bot token to reliably reach the service process, prefer a minimal env file with strict `KEY=value` lines and `chmod 600`.

Example (Telegram):

  cat > ~/.hermes/telegram.env <<'EOF'
  TELEGRAM_BOT_TOKEN=123:abc
  GATEWAY_ALLOW_ALL_USERS=true
  EOF
  chmod 600 ~/.hermes/telegram.env

Then in the systemd unit:

  EnvironmentFile=/home/<user>/.hermes/telegram.env

Reload + restart:

  systemctl --user daemon-reload
  systemctl --user restart hermes-gateway.service

### 6) Verify the running service actually has the env vars
Systemd status output can look fine even if env vars aren’t present. Prove it via `/proc/<pid>/environ`:

  pid=$(systemctl --user show -p MainPID --value hermes-gateway.service)
  tr '\0' '\n' < /proc/$pid/environ | grep -E '^(TELEGRAM_BOT_TOKEN|GATEWAY_ALLOW_ALL_USERS)='

If missing, the EnvironmentFile is not being read (wrong path/permissions/format), or the unit wasn’t reloaded.

## Security notes
- `--host 127.0.0.1` keeps the dashboard local-only.
- Prefer allowlists (`TELEGRAM_ALLOWED_USERS=...`) over `GATEWAY_ALLOW_ALL_USERS=true` once initial pairing works.

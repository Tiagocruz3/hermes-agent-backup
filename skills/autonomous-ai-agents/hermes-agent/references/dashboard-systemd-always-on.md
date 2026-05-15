# Dashboard: always-on server mode (systemd)

Goal: keep `hermes dashboard` running continuously, start on boot, survive logout, and avoid system suspend.

Assumptions
- Linux systemd host (Ubuntu/Debian/Fedora/Arch)
- You want local-only access (recommended): bind `127.0.0.1`
- Port example: `9119`

## 1) Create a systemd user service

Create:
- `~/.config/systemd/user/hermes-dashboard.service`

Example unit (local-only):

```ini
[Unit]
Description=Hermes Dashboard (local-only)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%h/.local/bin/hermes dashboard --host 127.0.0.1 --port 9119 --no-open --tui
Restart=always
RestartSec=2
Environment=PYTHONUNBUFFERED=1

# Basic hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=false

[Install]
WantedBy=default.target
```

Then:

```bash
systemctl --user daemon-reload
systemctl --user enable --now hermes-dashboard.service
systemctl --user status hermes-dashboard.service --no-pager -l
```

Verify listener:

```bash
ss -ltnp | grep ':9119'
curl -I http://127.0.0.1:9119 | head -n 5
```

## 2) Start on boot even when not logged in (linger)

User services normally stop when you log out. Enable linger once:

```bash
sudo loginctl enable-linger $USER
```

Verify:

```bash
loginctl show-user $USER -p Linger
# expect: Linger=yes
```

## 3) Prevent sleep/suspend (optional)

If you want the machine to never suspend:

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

## Notes / pitfalls

- If you bind `127.0.0.1`, the dashboard is only reachable from the same machine.
- For LAN access you must bind `0.0.0.0` (higher risk; consider firewall/auth).
- Non-interactive runners (agent tools, CI, etc.) often fail on `sudo` with: `sudo: a password is required`. Either run sudo commands in a real terminal or add a *narrow* NOPASSWD sudoers entry for just the commands you need.

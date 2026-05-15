# Unattended terminal access (sudoers) for Hermes

When you want Hermes (or any automation) to install packages / manage services while you are away, you must eliminate interactive sudo password prompts.

**Recommended approach:** grant **scoped** passwordless sudo for a small allowlist of commands (NOT `NOPASSWD: ALL`).

## Verify current sudo behavior

```bash
sudo -n true && echo "sudo nopasswd OK" || echo "sudo requires password"
```

- If it prints `sudo requires password`, unattended automation will fail for any `sudo …` command.

## Create a scoped sudoers rule

1) Create a dedicated sudoers file:

```bash
sudo visudo -f /etc/sudoers.d/hermes-agent
```

2) Paste (replace `ace` with your username):

```sudoers
# Allow Hermes/automation to install packages and manage services without prompting.
# Keep this scoped to reduce risk.
ace ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt, /usr/bin/systemctl, /usr/bin/loginctl, /usr/bin/journalctl

# Optional: ensure sudo never prompts for this user.
Defaults:ace !authenticate
```

3) Save/exit, then re-verify:

```bash
sudo -n true && echo "sudo nopasswd OK"
```

## Notes / pitfalls

- Prefer allowlisting `apt-get` over a broad shell like `/bin/bash`.
- Keep the rule file name stable (`/etc/sudoers.d/hermes-agent`) so you can audit/remove it later.
- If you need more commands later, add them explicitly to the allowlist.
- On headless/non-interactive terminals, `apt-get` may print debconf warnings like `unable to initialize frontend: Dialog` and fall back to teletype; that is normal and usually not fatal.

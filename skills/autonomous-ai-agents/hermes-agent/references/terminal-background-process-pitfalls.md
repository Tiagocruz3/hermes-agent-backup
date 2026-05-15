# Terminal Background Process Pitfalls

The Hermes `terminal` tool has strict rules about background processes. Violating them causes immediate rejection with no output.

---

## Rule 1: Never use `&` in foreground terminal commands

**Wrong:**
```bash
cloudflared tunnel --url http://localhost:8644 &
sleep 5
cat /tmp/log
```

The terminal tool detects `&` backgrounding in the command string and rejects it entirely — even if the `&` is inside a subshell or quoted.

**Right — use `terminal(background=true)`:**
```json
{
  "command": "cloudflared tunnel --url http://localhost:8644 > /tmp/cf.log 2>&1",
  "background": true
}
```

Then poll the background process with `process(action="poll", session_id=...)` or read the log file in a follow-up `terminal` call.

---

## Rule 2: `terminal(background=true)` starts the process but gives no output

The background terminal call returns immediately with a session ID. You must poll or read log files separately.

**Pattern:**
```json
// Step 1: Start background process
{ "command": "cloudflared tunnel --url http://localhost:8644 > /tmp/cf.log 2>&1", "background": true }
// Returns: { "session_id": "proc_abc123", "pid": 12345 }

// Step 2: Wait, then read log
{ "command": "sleep 6 && cat /tmp/cf.log" }
```

---

## Rule 3: `execute_code` with `subprocess.Popen` is the escape hatch

When you need to start a background process AND capture its output programmatically, use `execute_code` instead of `terminal`.

**Example — start cloudflared and extract the tunnel URL:**
```python
import subprocess, time, re

proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", "http://localhost:8644"],
    stdout=open("/tmp/cf.log", "w"),
    stderr=subprocess.STDOUT,
    start_new_session=True
)

time.sleep(10)

with open("/tmp/cf.log", "r") as f:
    content = f.read()

urls = re.findall(r'https://[a-z0-9-]+\.trycloudflare\.com', content)
if urls:
    print(f"TUNNEL URL: {urls[0]}")
else:
    print("No URL found. Log:")
    print(content)
```

This avoids the `terminal` tool's `&` detection while still giving you the tunnel URL.

---

## Common Scenarios

| Scenario | Right Tool | Pattern |
|----------|-----------|---------|
| Start a daemon/service | `terminal` | `systemctl --user start foo` (no `&`) |
| Start a dev server / tunnel | `execute_code` | `subprocess.Popen` + log parsing |
| Start a long build | `terminal(background=true)` | Poll with `process(action="poll")` |
| Run something and read output | `terminal` | Single foreground command |

---

## Related

- `references/systemd-dashboard-gateway-always-on.md` — for actually daemonizing services properly
- `references/puppeteer-arm64-local-browser.md` — another case where background process handling matters (Chromium headless)

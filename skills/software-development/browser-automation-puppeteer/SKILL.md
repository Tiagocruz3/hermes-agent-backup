---
name: browser-automation-puppeteer
description: "Local Puppeteer browser automation visible on the user's desktop — setup and troubleshooting for Ubuntu ARM64."
version: 1.0.0
metadata:
  hermes:
    tags: [puppeteer, browser, chromium, arm64, ubuntu, snap, automation]
---

# Browser Automation with Puppeteer (ARM64 Ubuntu)

Run Puppeteer scripts that open a **visible browser window on the user's desktop** so they can watch the automation live. Covers the ARM64-specific pitfalls (wrong Chrome binary, snap Chromium) and ESM/module resolution issues.

## Quick Start

```bash
# 1. Create a local project (do NOT install globally)
mkdir /tmp/browser-demo && cd /tmp/browser-demo
npm init -y
npm install puppeteer

# 2. Use this script template (CommonJS — not ESM)
node demo.js
```

## Script Template

```js
const puppeteer = require('puppeteer');  // CommonJS — ESM imports fail with global installs

(async () => {
  const browser = await puppeteer.launch({
    headless: false,                        // VISIBLE on desktop
    executablePath: '/snap/bin/chromium',   // ARM64 snap Chromium
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']  // --no-sandbox needed for snap
  });

  const page = await browser.newPage();
  await page.goto('https://google.com', { waitUntil: 'networkidle2' });

  // Do stuff...

  await browser.close();
})();
```

## Pitfalls

### 1. Puppeteer's bundled Chrome is x86_64 only — crashes on ARM64

```
Error: Failed to launch the browser process: Code: 2
stderr: ...chrome: 1: Syntax error: redirection unexpected
```

**Fix:** Point Puppeteer to the system's ARM64 Chromium:
```js
executablePath: '/snap/bin/chromium'
```

### 2. Snap Chromium needs `--no-sandbox`

Without it, Chromium may fail to launch or run with restricted permissions. Always include `'--no-sandbox'` in args.

### 3. Global npm installs fail with ESM imports

```bash
npm install -g puppeteer   # installs OK
node demo.js               # ERR_MODULE_NOT_FOUND: Cannot find package 'puppeteer'
```

**Fix:** Use a local project (`npm init -y && npm install puppeteer`) and CommonJS `require()` instead of `import`.

### 4. Check if Chromium is installed

```bash
which chromium-browser || which chromium || snap list | grep chromium
```

If missing: `sudo snap install chromium`

### 5. X server not available from Hermes terminal backend (CRITICAL)

When Puppeteer scripts are invoked from Hermes' terminal tool (not from the user's desktop terminal), `puppeteer.launch({ headless: false })` often fails with:

```
Error: Missing X server to start the headful browser.
```

**Root cause:** Hermes terminal backend runs outside the user's desktop session. Even with `DISPLAY=:0`, Puppeteer's `launch()` checks for X at a lower level.

**Key discovery — foreground vs background:**
- **Foreground terminal commands** (`background=false`) DO have display access and can launch headful Chromium
- **Background terminal commands** (`background=true`) LOSE display access on both X11 and Wayland
- Always use foreground mode with high timeout for Puppeteer scripts

**Wayland-specific (Ubuntu 24.04 default):**
On Wayland, `scrot`, `import -window root`, `ffmpeg x11grab` ALL fail — they cannot capture the screen from any process. However, `page.screenshot()` in Puppeteer captures from Chromium's internal rendering buffer and works on Wayland.

**Desktop screenshot on Wayland: install `gnome-screenshot`:**
```bash
XDG_RUNTIME_DIR=/run/user/$(id -u ace) gnome-screenshot --file=/home/ace/desktop-shot.png
```
See `references/desktop-screenshot-wayland.md` for full details — this is the ONLY working method for full desktop capture on GNOME Wayland from agent context.

To enable full desktop streaming/screen capture: switch to X11:
```bash
sudo nano /etc/gdm3/custom.conf
# Uncomment: WaylandEnable=false
sudo reboot
# Verify: echo $XDG_SESSION_TYPE → x11
```

**Workaround — Direct Chromium launch (works on both Wayland and X11):**
```bash
bash -c 'DISPLAY=:0 /snap/bin/chromium --start-maximized https://x.com &'
# Output: "Opening in existing browser session." — reuses existing window
```

This requires an existing Chromium session (from a prior headful launch or the user). Subsequent invocations open new tabs, not new windows.

### 5a. Session Cookies Are NOT Shared Between Browser Instances (CRITICAL)

When the user says "I'm logged into [site]", they mean their **desktop browser** (Chrome/Chromium they use daily). Puppeteer launched by the agent opens a **fresh browser profile** with NO cookies, NO login session, NO extensions.

**Symptom**: You navigate to a site the user is "logged into" and hit a login page instead.

**Why it happens**: Each `puppeteer.launch()` creates an isolated temporary profile in `/tmp/`. It does not read the user's `~/.config/chromium/` profile where their real cookies live.

**Solutions** (in order of preference):
1. **Ask the user to copy the data manually** (token, URL, etc.) — fastest, most reliable
2. **Use `--user-data-dir` pointing to the user's actual profile** (may fail if Chromium is already running, due to profile lock):
   ```js
   args: ['--user-data-dir=/home/ace/.config/chromium']
   ```
3. **Extract cookies from the user's profile** via `sqlite3 ~/.config/chromium/Default/Cookies` — complex, fragile
4. **Use a dedicated automation profile** that the user logs into once, then reuse: create `/home/ace/.config/chromium-automation/`, have user log in there manually, then point Puppeteer to it

**Better approach for Cloudflare dashboard**: Ask the user to copy the tunnel token from the dashboard manually, then set up the service locally. Do NOT try to automate Cloudflare login extraction — the auth system (SSO, passkeys, security keys) makes this extremely fragile.

### 6. Puppeteer screenshot streaming to Telegram (partially working)

`page.screenshot()` works on Wayland but CDP sessions drop after ~6 seconds when streaming to x.com (heavy JS sites). Simpler sites like Google work longer. On X11, `ffmpeg x11grab` + video to Telegram is the reliable approach.

### 7. User preference: Puppeteer over Browserbase

The user prefers local Chromium via Puppeteer for all browsing — especially local sites and social media. Do NOT use Browserbase remote browser. Always use `/snap/bin/chromium` with `--no-sandbox` + `--start-maximized`.

### 8. Snap Chromium sandboxes `/tmp` (ERR_FILE_NOT_FOUND)

Snap Chromium is sandboxed and cannot access `/tmp` for both reading AND writing. When loading local HTML files or saving screenshots, use home directory paths:
```js
// WRONG:
await page.goto('file:///tmp/my-page.html');        // ERR_FILE_NOT_FOUND
await page.screenshot({path: '/tmp/ss.png'});       // disappears into Snap sandbox

// RIGHT:
await page.goto('file:///home/ace/my-page.html');
await page.screenshot({path: '/home/ace/ss.png'});
```

**For headless screenshots (bypass CDP crashes):** skip Puppeteer entirely and use Snap Chromium directly:
```bash
# Desktop viewport
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/output.png --window-size=1280,800 \
  --virtual-time-budget=3000 file:///home/ace/page.html

# Mobile viewport (e.g. phone UI preview)
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/mobile.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```
See `html-screenshot-telegram` skill for the full workflow.

### 9. Shell eats `$$` in inline `node -e` scripts

When running Puppeteer inline via `node -e`, the shell expands `$$` to the current PID. `page.$$('.cell')` becomes `page.44209('.cell')` — a SyntaxError. **Always write Puppeteer scripts as `.js` files** when using `page.$$`, or escape as `\$\$`.

```bash
# WRONG (shell eats $$):
node -e "const cells = await page.$$('.cell');"
# RIGHT:
node myscript.js  # with $$ inside the file
```

### 10. Chromium headless screenshot for live UI previews

When the user asks to see a screenshot of a running web app (e.g. "send me a screenshot", "show me what it looks like"), use Snap Chromium in headless mode directly — no Puppeteer needed:

```bash
# Serve the app first
npx serve dist -l 3456 &

# Screenshot the running server (mobile viewport for phone UI)
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/ironme-preview.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```

**Key points:**
- Output path MUST be under `/home/ace/` — Snap sandboxes `/tmp/`
- `--window-size=390,844` for phone, `1280,800` for desktop, `1440,900` for wide desktop
- `--virtual-time-budget=3000` lets JS/CSS load before capture
- Works on Wayland (headless renders off-screen)
- Deliver via `MEDIA:/home/ace/ironme-preview.png`

### 10a. Screenshot when browser_navigate fails
When `browser_navigate` fails with "Chrome exited early" or "DevToolsActivePort", fall back to headless Chromium screenshot immediately:
```bash
# Ensure server is running first
curl -s http://localhost:3456 | head -1  # verify

# Screenshot via headless Chromium
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/preview.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```
This is the reliable fallback on Ubuntu ARM64 when Puppeteer/CDP sessions crash.

### 11. Multi-viewport screenshot workflow (desktop + mobile)

When showing responsive UI previews, capture both viewports:
```bash
# Desktop
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/preview-desktop.png --window-size=1440,900 \
  --virtual-time-budget=3000 http://localhost:3456

# Mobile
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/preview-mobile.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```

### 12. browser_navigate failures — switch to curl/headless immediately

The `browser_navigate` tool can fail with "Chrome exited early" or "DevToolsActivePort" errors. When this happens:

1. **DO NOT retry browser_navigate** — it will fail identically
2. **Switch to headless Chromium screenshot** (see section 10a above)
3. **Or use curl for API testing:** `curl -s http://localhost:PORT | head -20`

**Session lesson (2026-05-15):** `browser_navigate` to `http://localhost:3456` failed with "Chrome exited early (exit code: 2)". Instead of retrying, immediately switched to:
```bash
curl -s http://localhost:3456 | head -20  # verify server is up
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/preview.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```
Both worked perfectly. The browser_navigate tool has environmental limitations on this setup — headless Chromium and curl are the reliable fallbacks.

## References

- `templates/puppeteer-demo.js` — ready-to-run demo script that opens Google and searches
- `scripts/stream-telegram.js` — Puppeteer script that streams page screenshots to Telegram
- `scripts/livestream-video-x11.sh` — X11-only: ffmpeg desktop video clips to Telegram
- `scripts/launch-chromium.sh` — launch Chromium directly from shell
- `references/wayland-vs-x11.md` — Wayland vs X11 capabilities, switching guide
- `references/desktop-screenshot-wayland.md` — desktop screenshot on GNOME Wayland via gnome-screenshot
- `references/headless-screenshot-ui-preview.md` — headless Chromium screenshots for UI previews (mobile + desktop viewports)

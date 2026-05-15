---
name: html-screenshot-telegram
description: Render an HTML file to an image using headless Chromium and send it via Telegram. Use when the user asks to screenshot a local HTML page or web app and deliver it remotely.
---

## Trigger
User says: "screenshot this page", "send me what it looks like", "show me the game/app", or similar — and an HTML file exists locally.

## Steps

1. **Identify the HTML file path** — confirm it exists with `stat` or `ls`.

2. **Kill any stale Chromium processes** (snap Chromium often crashes):
   ```bash
   pkill -f chromium 2>/dev/null; sleep 1
   ```

3. **Screenshot with native Chromium headless** (Snap Chromium works — do NOT search for `chromium-browser`):
   ```bash
   /snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
     --screenshot=/home/ace/screenshot-output.png --window-size=1280,800 \
     --virtual-time-budget=3000 \
     file:///absolute/path/to/file.html
   ```

   **For mobile viewport screenshots** (e.g. phone UI previews):
   ```bash
   /snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
     --screenshot=/home/ace/screenshot-mobile.png --window-size=390,844 \
     --virtual-time-budget=3000 \
     http://localhost:PORT
   ```

   **Pitfall — output path must be Snap-safe:** The `--screenshot=` path MUST be under `/home/ace/` (or another non-sandboxed path). Snap Chromium sandboxes `/tmp/` and files written there are invisible to the host. The command may report "14338 bytes written to file /tmp/..." but the file will not exist when checked. Always write screenshots to `/home/ace/` or a subdirectory.

   Key flags:
   - `/snap/bin/chromium` — Ubuntu ARM64 ships only Snap Chromium; this works fine in headless mode
   - `--headless=new` — modern headless mode (much more reliable than old `--headless`)
   - `--no-sandbox` — required in agent/shell contexts; Snap Chromium needs this even headless
   - `--virtual-time-budget=3000` — waits for JS/CSS to load before capturing
   - `file://` — absolute path required
   - **CRITICAL**: screenshot path MUST be under `/home/ace/` — Snap Chromium sandboxes `/tmp/` and files written to `/tmp/` are invisible

4. **Deliver directly** — the file is already at `~/screenshot-output.png` (Snap-safe path):

5. **Send via Telegram** — respond with:
   ```
   MEDIA:/home/ace/screenshot-output.png
   ```
   along with a brief description.

## Pitfalls
- **Snap Chromium is the ONLY browser** — Ubuntu ARM64 ships only Snap Chromium. It crashes with Puppeteer/CDP for screenshots but works perfectly with `--headless=new` direct mode. Use `/snap/bin/chromium`, not `chromium-browser` (doesn't exist).
- **Snap sandboxes `/tmp/`** — screenshot output MUST go under `/home/ace/` or another non-sandboxed path. Files "written" to `/tmp/` vanish into the Snap sandbox.
- **Wayland blocks desktop capture** — headless mode (`--headless=new`) bypasses this since it renders off-screen. No need for X11.
- **Virtual time budget** — pages with heavy JS/CSS animations may need longer. Default 3000ms works for most static HTML.
- **Relative paths fail** — always use absolute `file:///` paths.
- **Mobile viewport sizing** — use `--window-size=390,844` for phone previews, `--window-size=1280,800` for desktop. The viewport determines the screenshot dimensions.
- **Screenshots of running dev servers** — screenshot `http://localhost:PORT` directly (no `file://` needed). Ensure the server is running before capturing.

## Verification
- Check that `~/screenshot-output.png` exists and is > 0 bytes:
  ```bash
  ls -lh ~/screenshot-output.png
  ```

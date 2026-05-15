# Puppeteer on ARM64 — local browser automation

## Why not Browserbase

The user prefers **local Puppeteer with visible Chromium windows** over the Browserbase remote browser. This gives them a live view of what the agent is doing on their desktop — essential for social media, localhost browsing, and watching automation in real-time.

## ARM64 architecture issues

Puppeteer's bundled Chrome is **x86 only**. On ARM64 (Ubuntu 24.04 arm64, Raspberry Pi 5, Apple Silicon Linux VMs, etc.), the downloaded binary at `~/.cache/puppeteer/chrome/` will fail with:

```
/home/ace/.cache/puppeteer/chrome/linux_arm-147.0.7727.57/chrome-linux64/chrome: 1: Syntax error: redirection unexpected
```

### Fix: Use system Chromium via snap

```bash
# Chromium is installed via snap on Ubuntu:
which chromium-browser  # → /snap/bin/chromium

# In your Puppeteer script, point to it:
const browser = await puppeteer.launch({
  headless: false,
  executablePath: '/snap/bin/chromium',
  defaultViewport: null,
  args: ['--start-maximized', '--no-sandbox']
});
```

Note: `--no-sandbox` is required when running Chromium from snap with Puppeteer's process model.

## X display access: foreground vs background

The Hermes `terminal` tool runs in two modes that affect display access:

| Mode | X/Wayland access | Use for |
|------|-----------------|---------|
| **Foreground** (`background=false`) | ✅ Has display | Browser launch, screenshots |
| **Background** (`background=true`) | ❌ No display | Long-running services, API calls |

**Diagnostic**: If you get `Error: Missing X server to start the headful browser`, switch the terminal command to foreground mode.

## Wayland vs X11 for screen capture

Ubuntu 24.04 defaults to **Wayland** (GDM wayland session). External screen capture tools (`scrot`, `ffmpeg x11grab`, ImageMagick `import`) all fail on Wayland:

```
import: unable to read X window image 'root': Resource temporarily unavailable
ffmpeg: Cannot open display :0.0, error 1.
scrot: (blank images)
```

### Switch to X11 for full desktop capture support

```bash
sudo nano /etc/gdm3/custom.conf
# Uncomment: WaylandEnable=false
sudo reboot
```

After reboot, verify:
```bash
echo $XDG_SESSION_TYPE  # should say: x11
```

On X11, `scrot`, `ffmpeg x11grab`, and `import` all work for desktop streaming to Telegram.

## CDP session drops on live streaming

Puppeteer browser sessions can disconnect after ~6 seconds of continuous screenshot streaming (`Page.captureScreenshot: Target closed` / `Session closed`). This happens more on JS-heavy sites (x.com) than simple ones (google.com).

Mitigation: add page liveness checks before each screenshot:
```js
try { await page.evaluate(() => 1); } catch {
  page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}
```

## Project location

All Puppeteer demo scripts live at `/tmp/browser-demo/` with local `node_modules`. The streaming Telegram script is at `/tmp/browser-demo/stream-v2.js`.

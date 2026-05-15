# Headless Chromium Screenshots for UI Previews

When the user asks to see a screenshot of a running web app, use Snap Chromium directly in headless mode — no Puppeteer needed. This works on both Wayland and X11.

## Single Screenshot

```bash
# Serve the app first (background)
npx serve dist -l 3456 &

# Capture
/snap/bin/chromium --headless=new --disable-gpu --no-sandbox \
  --screenshot=/home/ace/preview.png --window-size=390,844 \
  --virtual-time-budget=3000 http://localhost:3456
```

**Critical constraints:**
- Output path MUST be under `/home/ace/` — Snap sandboxes `/tmp/`
- `--virtual-time-budget=3000` lets JS/CSS load before capture (3 seconds)
- `--window-size` sets viewport: `390,844` phone, `1280,800` desktop, `1440,900` wide desktop
- Works on Wayland (headless renders off-screen, no display needed)
- Deliver via `MEDIA:/home/ace/preview.png`

## Multi-Viewport Workflow (Desktop + Mobile)

For responsive UIs, capture both viewports and show both:

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

Deliver both:
```
MEDIA:/home/ace/preview-desktop.png
MEDIA:/home/ace/preview-mobile.png
```

## Troubleshooting

**Blank screenshot:** Increase `--virtual-time-budget` to 5000 or 10000 for heavy JS apps.

**CORS errors on local assets:** Use `npx serve` instead of `file://` protocol.

**Fonts look wrong:** Headless Chromium may not have system fonts. Use web fonts (Google Fonts) or embed WOFF files.

**Snap sandbox blocks output:** If screenshot file is 0 bytes or missing, check path is under `/home/ace/` not `/tmp/`.

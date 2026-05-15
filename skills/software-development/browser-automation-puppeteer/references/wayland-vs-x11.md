# Wayland vs X11 — Screen Capture & Browser Automation

## Ubuntu 24.04 Default: Wayland

```bash
echo $XDG_SESSION_TYPE  # wayland
```

## What breaks on Wayland

| Tool | Status | Why |
|------|--------|-----|
| `scrot` | ❌ | Requires X11 |
| `import -window root` | ❌ | Cannot read X root window |
| `ffmpeg x11grab` | ❌ | No X11 display |
| `gnome-screenshot` (D-Bus) | ❌ | Access denied without user prompt |
| `org.gnome.Shell.Screenshot` | ❌ | Security policy blocks background access |
| Puppeteer `page.screenshot()` | ✅ | Captures from Chromium internal buffer |
| Puppeteer headful launch (foreground) | ✅ | Works on both Wayland and X11 |
| Direct Chromium launch | ✅ | `DISPLAY=:0 /snap/bin/chromium` |

## Switching to X11

```bash
sudo nano /etc/gdm3/custom.conf
# Uncomment: WaylandEnable=false
sudo reboot
# Verify: echo $XDG_SESSION_TYPE → x11
```

After switching, all screen capture tools work: scrot, ffmpeg x11grab, import.

## Why X11 is better for automation

- Full desktop streaming/screenshot capture from any process
- `ffmpeg -f x11grab` for video streaming
- `scrot` / `import` for screenshots
- No D-Bus security restrictions
- Background processes can capture display
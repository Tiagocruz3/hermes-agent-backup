# Wayland Screen Capture from Hermes

On Ubuntu 24.04 with GNOME (Wayland, default), unattended screen capture from background processes is blocked by Wayland's security model.

## What DOESN'T work from Hermes terminal background

| Tool | Error | Reason |
|------|-------|--------|
| `scrot` | Blank image or no output | Wayland doesn't expose framebuffer to X11 tools |
| `import -window root` | "Resource temporarily unavailable" | XWayland root window not accessible |
| `ffmpeg x11grab` | "Cannot open display :0" | X11 screen grabbing blocked |
| `gdbus org.gnome.Shell.Screenshot` | "AccessDenied" | Requires user interaction consent |

## What DOES work

### App launching (XWayland)
```bash
# Apps launched through XWayland work from background
DISPLAY=:0 /snap/bin/chromium https://x.com &
# Chromium opens in existing session via XWayland
```

### Interactive tools (user must click)
```bash
gnome-screenshot -f /tmp/screen.png  # Shows save dialog
gnome-screenshot -w -f /tmp/window.png  # Click-to-select window
```

### Puppeteer (when launched from user's desktop terminal)
```js
// Works from user's terminal, NOT from Hermes background
puppeteer.launch({ headless: false, executablePath: '/snap/bin/chromium' })
```

## Permanent fix: Switch to X11

Edit `/etc/gdm3/custom.conf`:
```ini
# Uncomment this line:
WaylandEnable=false
```
Then reboot. All screen capture tools (scrot, ffmpeg x11grab, import) work from any context.

## Alternative: PipeWire portal (needs user consent)

Install and use `xdg-desktop-portal-gnome` with PipeWire screencast. Still requires a one-time user approval popup on each session.

## Current machine status

- Display server: Wayland (GNOME on GDM)
- XWayland: Available (apps can launch but can't be screen-grabbed)
- User: ace, UID 1001
- Session: gdm-wayland-session → gnome-session (ubuntu)
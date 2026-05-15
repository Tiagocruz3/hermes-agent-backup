# Desktop Screenshot on Wayland GNOME (Ubuntu 24.04 ARM64)

Taking a screenshot of the user's full desktop from Hermes' terminal context when running on Wayland + GNOME.

## The Problem

- `scrot`, `ffmpeg x11grab`, `import -window root` all fail on Wayland (X11-only tools)
- `grim` fails with `compositor doesn't support wlr-screencopy-unstable-v1` on GNOME (GNOME uses its own protocol, not wlr)
- DBus screenshot API returns `org.freedesktop.DBus.Error.AccessDenied: Screenshot is not allowed` from agent context
- UID may not be 1000 — check with `id -u ace` (this machine: 1001)

## Solution: gnome-screenshot

```bash
# Install if missing
sudo apt-get install -y gnome-screenshot

# Take screenshot (figure out correct UID first)
XDG_RUNTIME_DIR=/run/user/$(id -u ace) gnome-screenshot --file=/home/ace/desktop-shot.png

# Verify
ls -lh /home/ace/desktop-shot.png

# Deliver to Telegram
# Response: MEDIA:/home/ace/desktop-shot.png
```

## Key details

- `gnome-screenshot` is a GTK app that uses GNOME's native screenshot protocol — works where `grim` (wlr-only) doesn't
- `XDG_RUNTIME_DIR` must point to the correct user's runtime dir (`/run/user/<UID>`)
- No `DISPLAY` variable needed — it communicates via Wayland
- Output sizes typically 100-300KB for 1920x1080 desktop
- Works from agent terminal context (no desktop session required beyond the running compositor)

## What doesn't work (Wayland GNOME)

| Tool | Error |
|------|-------|
| `scrot` | X11-only, no Wayland support |
| `ffmpeg x11grab` | X11-only |
| `grim` | `compositor doesn't support wlr-screencopy-unstable-v1` (GNOME uses its own protocol) |
| DBus `org.gnome.Shell.Screenshot` | `AccessDenied` from non-session processes |
| `spectacle` | KDE-only |

## Cleanup

```bash
rm -f /home/ace/desktop-shot.png  # after user confirms receipt
```

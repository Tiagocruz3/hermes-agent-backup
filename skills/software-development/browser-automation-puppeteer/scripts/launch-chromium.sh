#!/bin/bash
# Launch Chromium visible on user's desktop from Hermes terminal backend
# (bypasses Puppeteer's X server requirement)
# Usage: scripts/launch-chromium.sh https://x.com

URL="${1:-https://google.com}"
DISPLAY=:0 /snap/bin/chromium --start-maximized "$URL" &
echo "Launched Chromium with: $URL"

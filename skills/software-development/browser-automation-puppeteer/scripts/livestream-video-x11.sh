#!/bin/bash
# Desktop Video Stream → Telegram (X11 only)
# Records 5s MP4 clips and sends to Telegram.

PIDFILE=/tmp/livestream-video.pid
CACHEDIR="$HOME/.hermes/image_cache/livestream"
CHAT_ID=7847610860
CLIP_DURATION=5

get_token() {
    grep TELEGRAM_BOT_TOKEN ~/.hermes/.env | head -1 | cut -d= -f2 | tr -d '"' | tr -d "'" | xargs
}

if [ "$1" = "stop" ]; then
    [ -f "$PIDFILE" ] && kill "$(cat "$PIDFILE")" 2>/dev/null && rm "$PIDFILE"
    exit 0
fi

TOKEN=$(get_token)
mkdir -p "$CACHEDIR"
echo $$ > "$PIDFILE"

i=0
while true; do
    CLIP="$CACHEDIR/clip-$(printf '%04d' $i).mp4"
    ffmpeg -y -f x11grab -framerate 10 -video_size 1024x640 -i :0.0+0,0 \
        -t "$CLIP_DURATION" -c:v libx264 -preset ultrafast -crf 32 -pix_fmt yuv420p \
        -movflags +faststart -loglevel error "$CLIP" 2>/dev/null
    
    [ -f "$CLIP" ] && curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendVideo" \
        -F chat_id="$CHAT_ID" -F video="@$CLIP" -F caption="🖥️ Live" \
        -F supports_streaming=true --max-time 20 > /dev/null 2>&1
    
    [ $i -gt 3 ] && rm -f "$CACHEDIR/clip-$(printf '%04d' $((i-3))).mp4"
    i=$((i+1))
done
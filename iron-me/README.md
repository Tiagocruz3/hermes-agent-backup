# Iron Me - J.A.R.V.I.S. Voice Assistant UI

A Jarvis-style HUD voice assistant interface that connects to your Hermes Agent.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Iron Me UI    │────▶│  Proxy Server   │────▶│  Hermes Agent   │
│  (React + Vite) │     │  (Node/Express) │     │  (Your AI)      │
│   localhost:5173│     │  localhost:3001 │     │  localhost:8642 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               │
        ▼                                               ▼
   ElevenLabs TTS                               Kimi / OpenAI / etc
```

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/Tiagocruz3/iron-me.git
cd iron-me
npm install
cd server && npm install
```

### 2. Configure

**Frontend** - create `.env.local` in project root:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here
VITE_ELEVENLABS_VOICE_ID=Q7IOSFX7VG3cnK4eU8Z4
```

**Backend** - create `.env` in `server/` folder:
```bash
cd server
cp ../.env.example .env
```
Edit `server/.env`:
```
# For LOCAL Hermes (same machine):
HERMES_API_URL=http://127.0.0.1:8642

# For REMOTE Hermes (VPS, another machine):
# HERMES_API_URL=https://your-vps-ip:8642
# or via Cloudflare tunnel:
# HERMES_API_URL=https://hermes-your-subdomain.trycloudflare.com

PORT=3001
```

### 3. Run

**Terminal 1 - Backend:**
```bash
cd iron-me/server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd iron-me
npm run dev
```

**Open:** http://localhost:5173

## Connecting to Remote Hermes

If your Hermes agent runs on a different machine/VPS:

### Option A: Direct IP (if port is open)
```
HERMES_API_URL=http://195.35.20.80:8642
```

### Option B: Cloudflare Tunnel (recommended)
On your Hermes machine:
```bash
cloudflared tunnel --url http://localhost:8642
```
Copy the HTTPS URL and set it:
```
HERMES_API_URL=https://hermes-abc123.trycloudflare.com
```

### Option C: Expose Hermes API publicly
Edit `~/.hermes/config.yaml`:
```yaml
api_server:
  enabled: true
  extra:
    host: 0.0.0.0   # <-- change from 127.0.0.1
    port: 8642
    cors_origins: "*"
```
Restart Hermes gateway.

## Features

- **Voice Mode**: Tap "Start Listening" → speak → J.A.R.V.I.S. responds via voice
- **Chat Mode**: Toggle to text interface for typing
- **ElevenLabs TTS**: High-quality voice synthesis (falls back to browser if no key)
- **Approval System**: Dangerous commands trigger Approve/Deny cards
- **Desktop Widgets**: System status, weather, battery, Earth globe, radar (desktop only)
- **Responsive**: Works on phone, tablet, desktop, car touchscreen

## Voice Flow

1. You tap "Start Listening" (or say "Hey Jarvis" if wake word is added)
2. Browser SpeechRecognition converts your voice to text
3. Text sent to proxy server at `/api/chat`
4. Proxy forwards to Hermes `/v1/chat/completions`
5. Hermes (kimi-k2.6) responds as J.A.R.V.I.S.
6. Response displayed + spoken via ElevenLabs TTS
7. Core orb glows cyan (listening) → green (speaking)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/chat` | POST | Send message, get J.A.R.V.I.S. response |
| `/api/notify` | POST | Create notification |

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **AI**: Hermes Agent (OpenAI-compatible API)
- **TTS**: ElevenLabs WebSocket streaming
- **STT**: Browser Web Speech API

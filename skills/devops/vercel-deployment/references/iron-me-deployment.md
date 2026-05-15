# Iron Me Deployment Session Notes

Session: 2026-05-15
Project: Iron Me — JARVIS voice AI UI
Stack: Vite + React + TypeScript + Tailwind v4 + Framer Motion
Deployed to: https://iron-me.vercel.app

## Architecture

```
iron-me.vercel.app (Vercel)
├── Frontend: React app (JARVIS HUD)
├── /api/chat    → Hermes API proxy (serverless)
├── /api/health  → Status check
├── /api/tts     → ElevenLabs TTS proxy (server-side, key hidden)
└── /api/stt     → Deepgram STT (Safari fallback)
```

## Env Vars Set on Vercel

```
HERMES_API_URL=https://decimal-empire-describes-mounting.trycloudflare.com
HERMES_API_KEY=sk-hermes-api-key-placeholder
ELEVENLABS_API_KEY=918b1145a51a79e2a8c06b9c80d24b8fb27f335c30c204dbb59870da204c8a93
```

## API Routes

### /api/chat
Proxies to Hermes API. Returns `{ reply, notification }`.
Dangerous command detection: delete|remove|exec|run sudo|rm -rf|format

### /api/tts
ElevenLabs streaming TTS. Returns audio/mpeg.
Key stays server-side — client never sees it.

### /api/stt
Deepgram speech-to-text for Safari fallback.
Receives base64 audio blob, returns transcript.

### /api/health
Returns `{ status: "online", service: "J.A.R.V.I.S. Proxy", version: "2.0" }`

## Key Implementation Details

**Voice recognition hook (`useVoice.ts`):**
- Chrome/Edge: Native `webkitSpeechRecognition`
- Safari: `MediaRecorder` → `/api/stt` → Deepgram
- Manual text input fallback for all browsers
- Ref-based state tracking prevents race conditions

**TTS flow:**
- Client calls `/api/tts` with text
- Server calls ElevenLabs with hidden API key
- Streams audio back as `audio/mpeg`
- Client plays with `new Audio(url)`

**Chat stale closure fix:**
Removed `messages` from `useCallback` dependency array.
Was causing `handleUserMessage` to be stale in child components.

## Browser Compatibility

| Browser | STT | TTS | Notes |
|---------|-----|-----|-------|
| Chrome | Native | ElevenLabs | Full support |
| Edge | Native | ElevenLabs | Full support |
| Safari | Deepgram (server) | ElevenLabs | No native STT |
| Firefox | Deepgram (server) | ElevenLabs | No native STT |

## Vercel CLI Commands Used

```bash
# Deploy
vercel --token fBqPJ1YF1WTq7xS5qO3LCTb4 --yes

# Production deploy
vercel --token fBqPJ1YF1WTq7xS5qO3LCTb4 --prod

# Add env var
echo "value" | vercel --token fBqPJ1YF1WTq7xS5qO3LCTb4 env add NAME production
```

## GitHub Repo
https://github.com/Tiagocruz3/iron-me

## Issues Fixed
1. Speech recognition race condition (ref-based tracking)
2. Chat stale closure (removed messages from deps)
3. Safari support (server-side STT + manual input)
4. ElevenLabs key exposure (moved to server-side TTS proxy)

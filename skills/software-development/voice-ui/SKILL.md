---
name: voice-ui
description: "Build voice-enabled web UIs: browser Speech Recognition (STT) + ElevenLabs WebSocket TTS + HUD/TUI interfaces. Real-time voice interaction in the browser like a phone call."
version: 1.0.0
metadata:
  hermes:
    tags: [voice, ui, stt, tts, elevenlabs, websocket, react, browser, hud, touchscreen]
    related_skills: [hermes-voice-call, claude-design, popular-web-designs]
triggers:
  - "build a voice UI"
  - "Jarvis style interface"
  - "Iron Man HUD"
  - "voice call in browser"
  - "ElevenLabs TTS web"
  - "speech recognition web app"
  - "touchscreen voice assistant"
---

# Voice UI — Browser-Based Voice Interaction

Build real-time voice UIs that run in the browser: tap to speak, agent responds with synthesized voice. Like Jarvis/Aisha — a HUD-style interface for AI agents.

**Related skills:**
- `hermes-voice-call` — Python CLI voice bridge (PyAudio + faster-whisper + ffplay). Use for desktop-native voice calls.
- `claude-design` — Design process and taste for UI artifacts.
- `popular-web-designs` — Ready-to-paste design systems (Stripe, Linear, etc.) for visual vocabulary.

## When To Use This Skill

Use when the user wants:
- A **browser-based** voice interface (not Python CLI)
- **Touchscreen-friendly** UI (car, phone, kiosk, wall-mounted display)
- **HUD/TUI style** — animated rings, glow effects, dark theme, status indicators
- **Live phone-call experience** — push-to-talk or always-listening
- **Card notifications** for approvals, alerts, important info
- **Fallback typing interface** — voice primary, text secondary

## Core Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite + React + TypeScript | Fast dev, modern JSX |
| Styling | Tailwind CSS v4 | Utility-first, dark theme tokens |
| Animation | Framer Motion | Orbital rings, waveform bars, transitions |
| Icons | Lucide React | Clean, consistent iconography |
| STT | Web Speech API (`SpeechRecognition`) | Browser-native, no API key |
| TTS | ElevenLabs WebSocket streaming | High-quality voice, low latency |
| Fallback TTS | `SpeechSynthesisUtterance` | Native browser TTS if no ElevenLabs key |

## Quick Scaffold

```bash
mkdir -p ~/projects/voice-ui && cd ~/projects/voice-ui
npm create vite@latest . -- --template react-ts
npm install
npm install framer-motion lucide-react tailwindcss @tailwindcss/vite
```

**Vite config (`vite.config.ts`):**
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true },
})
```

**Tailwind v4 (`src/index.css`):**
```css
@import "tailwindcss";

@theme {
  --color-hud-bg: #050a14;
  --color-hud-panel: #0a1525;
  --color-hud-border: #1a3a5c;
  --color-hud-glow: #00d4ff;
  --color-hud-text: #e0f7ff;
}
```

**TypeScript config note:** Disable `noUnusedLocals` and `noUnusedParameters` in `tsconfig.app.json` to avoid build failures during rapid iteration:
```json
"noUnusedLocals": false,
"noUnusedParameters": false,
```

## ElevenLabs TTS — Two Patterns

### Pattern A: Serverless Proxy (Recommended for Production)

Hide the API key by proxying through your backend or serverless function:

```ts
// Frontend calls your API, not ElevenLabs directly
const res = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello sir', voiceId: 'Q7IOSFX7VG3cnK4eU8Z4' }),
})
const blob = await res.blob()
const url = URL.createObjectURL(blob)
const audio = new Audio(url)
audio.onended = () => URL.revokeObjectURL(url)
await audio.play()
```

**Serverless function (`/api/tts`):**
```js
export default async function handler(req, res) {
  const { text, voiceId } = req.body
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({ text, model_id: 'eleven_flash_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.8 } }),
  })
  res.setHeader('Content-Type', 'audio/mpeg')
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    res.write(Buffer.from(value))
  }
  res.end()
}
```

**Why:** API key stays server-side. Client never sees it. Works with Vercel, Netlify Functions, or any backend.

### Pattern B: Direct WebSocket (Client-Side, Development Only)

The WebSocket API provides real-time streaming with lower latency than REST:

```ts
const ws = new WebSocket(
  `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_flash_v2_5`
);

// Send API key + voice settings
ws.send(JSON.stringify({
  text: ' ',
  voice_settings: { stability: 0.5, similarity_boost: 0.8 },
  xi_api_key: apiKey,
}));

// Send text chunks
ws.send(JSON.stringify({ text: message + ' ' }));
ws.send(JSON.stringify({ text: '' })); // End stream

// Receive audio chunks
ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);
  if (data.audio) {
    const binary = atob(data.audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const buffer = await audioContext.decodeAudioData(bytes.buffer);
    // Queue and play via AudioBufferSourceNode
  }
};
```

**Key points:**
- Model: `eleven_flash_v2_5` (fastest, lowest latency)
- Send a space `' '` first to initialize the stream
- Append a space to each text chunk for natural pauses
- Empty string `''` signals end-of-stream
- Decode base64 audio chunks and queue in an AudioContext
- **WARNING:** Exposes API key in client-side code. Only use for local development or with restricted keys.

**Fallback to native TTS:**
```ts
const utter = new SpeechSynthesisUtterance(text);
utter.rate = 1.1;
utter.pitch = 0.9;
speechSynthesis.speak(utter);
```

## Browser Speech Recognition (STT)

```ts
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const rec = new SpeechRecognition();
rec.continuous = true;
rec.interimResults = true;
rec.lang = 'en-US';

rec.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      onFinalTranscript(transcript);
    } else {
      onInterimTranscript(transcript);
    }
  }
};
```

**Note:** `SpeechRecognition` is not in TypeScript DOM types. Use `(window as any)` or declare a global interface. The type is `any` in practice.

## HUD Voice Core Component Pattern

The central orb with animated rings:

```tsx
// Three concentric rings rotating at different speeds
// Core orb pulses by state (idle/listening/speaking/thinking)
// Waveform bars appear when active
// Tap to toggle listen/speak

const ringColors = {
  idle: '#1a3a5c',
  listening: '#00d4ff',
  speaking: '#00ff88',
  thinking: '#ffaa00',
};
```

See `references/hud-voice-core-pattern.tsx` for the full implementation.

## Touchscreen Optimization

Critical for car systems, phones, kiosks:

1. **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />`
2. **Tap targets:** Minimum 44px for all interactive elements
3. **Active feedback:** `active:scale-95` on buttons, visual state change on tap
4. **No hover-dependent interactions:** Touch devices have no hover
5. **Swipe gestures:** Consider `touch-action: manipulation` and swipe-to-dismiss for notifications
6. **Prevent text selection:** `select-none` on the root container
7. **Theme color:** `<meta name="theme-color" content="#050a14" />` for mobile browser chrome
8. **Standalone app:** `<meta name="apple-mobile-web-app-capable" content="yes" />`

## Notification Card Pattern

Slide-up cards for approvals, alerts, info:

```tsx
// Types: approval (Approve/Deny buttons), info, warning, urgent
// AnimatePresence for enter/exit animations
// Large touch-friendly buttons (min 44px height)
// Auto-dismiss or manual close
```

See `references/notification-card-pattern.tsx` for the full implementation.

## Chat Fallback Panel

When voice isn't appropriate (loud environment, privacy):

```tsx
// Toggle between voice and chat modes via top bar button
// Message bubbles with role-based styling (user/assistant/system)
// Typing indicator (animated dots)
// Auto-scroll to bottom on new messages
// Send on Enter key, button for mic toggle
```

## Environment Variables

```bash
# .env.local
VITE_ELEVENLABS_API_KEY=sk_...
VITE_ELEVENLABS_VOICE_ID=Q7IOSFX7VG3cnK4eU8Z4
```

Vite exposes only `VITE_` prefixed env vars to the client.

### Connecting to Agent Backend

The UI POSTs to `/api/chat` by default. Proxy in `vite.config.ts`:
```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8642', changeOrigin: true }
  }
}
```

Or deploy the UI as static files and point `fetch()` to the agent API directly.

**Backend proxy pattern (Express + node-fetch):**
```js
const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  
  const messages = [
    { role: 'system', content: 'You are J.A.R.V.I.S...' },
    ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
    { role: 'user', content: message },
  ];

  const response = await fetch('http://127.0.0.1:8642/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'kimi-k2.6', messages, temperature: 0.7, max_tokens: 500 }),
  });
  
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'I am here, sir.';
  
  // Approval guardrail for dangerous commands
  const needsApproval = /\b(delete|remove|exec|run|sudo|rm -rf|format)\b/i.test(message);
  
  res.json({ reply, notification: needsApproval ? { type: 'approval', title: '...', body: '...' } : null });
});
```

**Key points:**
- Hermes API server runs on `127.0.0.1:8642` by default (OpenAI-compatible `/v1/chat/completions`)
- No API key needed for local Hermes — it uses the configured provider (kimi-coding, openrouter, etc.)
- Map `history` array roles correctly (`user`/`assistant`, not `user`/`agent`)
- Return `notification` object for approval cards — UI renders them automatically

## Build & Deploy

```bash
npm run build
# Serve dist/ folder via nginx, Coolify, or any static host
```

For Coolify deployment: Add Resource → Static Site → point to `dist/` folder.

## Pitfalls

### TypeScript: SpeechRecognition not in DOM types
`SpeechRecognition` and `webkitSpeechRecognition` are not in standard TypeScript DOM lib. Use `(window as any).SpeechRecognition` or add a global declaration. Do NOT try to install `@types/dom-speech-recognition` — it often conflicts with bundled types.

### ElevenLabs WebSocket requires API key in message
Unlike REST, the WebSocket API requires the API key in the FIRST JSON message (`xi_api_key` field), not in headers. Sending it as a query param or header will fail.

### AudioContext requires user gesture
Browsers block AudioContext autoplay. Initialize it inside the first user interaction (tap on the orb) to avoid `NotAllowedError`.

### Web Speech API not available on all browsers
Chrome/Edge support it well. Firefox requires permissions. Safari has limited support. Always provide the chat fallback.

### ElevenLabs voice ID format
Voice IDs are 22-character strings like `Q7IOSFX7VG3cnK4eU8Z4`. Do NOT confuse with model IDs (`eleven_flash_v2_5`) or API keys.

### Tailwind v4 `@import` syntax
Tailwind CSS v4 uses `@import "tailwindcss"` instead of the v3 `@tailwind` directives. The `@theme` block defines custom CSS variables. See `references/tailwind-v4-setup.md`.

### Vite + Tailwind v4 plugin order
The `@tailwindcss/vite` plugin must be listed AFTER `@vitejs/plugin-react` in the plugins array:
```ts
plugins: [react(), tailwindcss()] // correct
plugins: [tailwindcss(), react()] // may cause HMR issues
```

### React hooks: `speak` used before declaration in callbacks
When `speak` from `useVoice()` is called inside a `useCallback` that is defined BEFORE the hook call, TypeScript errors with "Block-scoped variable used before its declaration." Fix: use a `useRef` to hold the speak function, assign it after the hook call, and call via ref in the callback:
```ts
const speakRef = useRef<(text: string) => Promise<void>>(async () => {});
const { speak } = useVoice({...});
speakRef.current = speak;
// In callback:
await speakRef.current(replyText);
```

### SpeechRecognition race condition on start/stop (REFINED)
The Web Speech API `onend` event fires asynchronously even when you call `.stop()` manually. This causes a race where `setIsListening(false)` from `onend` overrides your `setIsListening(true)` from a subsequent `startListening()` call, making the button appear stuck or intermittent.

**Fix:** Use a ref to track INTENDED listening state, separate from UI state:
```ts
const isListeningRef = useRef(false)

rec.onend = () => {
  if (isListeningRef.current) {
    try { rec.start() } catch { isListeningRef.current = false }
  } else {
    setIsListening(false)
  }
}

const startListening = () => {
  isListeningRef.current = true
  try { rec.start() } catch { /* already started */ }
}

const stopListening = () => {
  isListeningRef.current = false  // Signal intent BEFORE calling stop
  rec.stop()
}
```

See `references/browser-speech-recognition-pitfalls.md` for full debugging guide.
See `templates/useVoice.ts` for production-ready implementation.

### React stale closure in `useCallback` with state dependencies
When a callback function (like `handleUserMessage`) is wrapped in `useCallback` with a state array (`messages`) in its dependency list, child components that receive this callback may hold a stale reference. The callback gets recreated on every state change, but the child component's event handler may still reference the old function instance.

**Symptom:** Chat input "Enter" or send button works intermittently or not at all. Voice mode works fine because it uses a ref pattern.

**Fix:** Remove the state from `useCallback` dependencies if it's only used for optimistic updates. Use functional state updates (`setMessages(prev => ...)`) instead:
```ts
// BAD — messages in deps causes stale closure
const handleUserMessage = useCallback(async (text: string) => {
  setMessages(prev => [...prev, userMsg])
  // ...fetch...
  setMessages(prev => [...prev, assistantMsg])
}, [messages, mode, addNotification]) // ← messages here is the problem

// GOOD — remove messages from deps, use functional updates
const handleUserMessage = useCallback(async (text: string) => {
  setMessages(prev => [...prev, userMsg])
  // ...fetch...
  setMessages(prev => [...prev, assistantMsg])
}, [mode, addNotification]) // ← no messages dependency
```

### SpeechRecognition race condition on start/stop (REFINED)
The Web Speech API `onend` event fires asynchronously even when you call `.stop()` manually. This causes a race where `setIsListening(false)` from `onend` overrides your `setIsListening(true)` from a subsequent `startListening()` call, making the button appear stuck or intermittent.

**Fix:** Use a ref to track INTENDED listening state, separate from UI state:
```ts
const isListeningRef = useRef(false)

rec.onend = () => {
  if (isListeningRef.current) {
    try { rec.start() } catch { isListeningRef.current = false }
  } else {
    setIsListening(false)
  }
}

const startListening = () => {
  isListeningRef.current = true
  try { rec.start() } catch { /* already started */ }
}

const stopListening = () => {
  isListeningRef.current = false  // Signal intent BEFORE calling stop
  rec.stop()
}
```

See `references/browser-speech-recognition-pitfalls.md` for full debugging guide.
See `templates/useVoice.ts` for production-ready implementation.

### React stale closure in `useCallback` with state dependencies
When a callback function (like `handleUserMessage`) is wrapped in `useCallback` with a state array (`messages`) in its dependency list, child components that receive this callback may hold a stale reference. The callback gets recreated on every state change, but the child component's event handler may still reference the old function instance.

**Symptom:** Chat input "Enter" or send button works intermittently or not at all. Voice mode works fine because it uses a ref pattern.

**Fix:** Remove the state from `useCallback` dependencies if it's only used for optimistic updates. Use functional state updates (`setMessages(prev => ...)`) instead:
```ts
// BAD — messages in deps causes stale closure
const handleUserMessage = useCallback(async (text: string) => {
  setMessages(prev => [...prev, userMsg])
  // ...fetch...
  setMessages(prev => [...prev, assistantMsg])
}, [messages, mode, addNotification]) // ← messages here is the problem

// GOOD — remove messages from deps, use functional updates
const handleUserMessage = useCallback(async (text: string) => {
  setMessages(prev => [...prev, userMsg])
  // ...fetch...
  setMessages(prev => [...prev, assistantMsg])
}, [mode, addNotification]) // ← no messages dependency
```

### Gradient border buttons with CSS
For the purple-to-cyan gradient border effect (no border-image support in all browsers), use a pseudo-element with `mask-composite: exclude`:
```css
.gradient-border {
  position: relative;
  background: rgba(10, 10, 20, 0.9);
  border-radius: 50px;
}
.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50px;
  padding: 2px;
  background: linear-gradient(90deg, #9d50bb, #00d2ff);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

### Responsive widget visibility (desktop vs mobile)
Use Tailwind responsive prefixes to show/hide corner widgets:
```tsx
// Desktop only (xl breakpoint = 1280px)
<div className="hidden xl:flex absolute top-16 left-4">
  <SystemStatusPanel />
</div>

// Mobile gets clean centered HUD, no side widgets
// Core scales: 240px mobile → 300px tablet → 380px desktop
```

### SVG ring construction for JARVIS-style HUD
Build concentric rings with SVG for precise control:
```tsx
// Outer thick ring with cyan segments
<svg viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="95" fill="none" stroke="#0a1a2a" strokeWidth="8" />
  {Array.from({ length: 12 }).map((_, i) => {
    const startAngle = i * 30 + 5;
    const endAngle = startAngle + 18;
    const r = 95;
    const toRad = (deg) => (deg * Math.PI) / 180;
    return (
      <path
        d={`M ${100 + r * Math.cos(toRad(startAngle))} ${100 + r * Math.sin(toRad(startAngle))}
            A ${r} ${r} 0 0 1 ${100 + r * Math.cos(toRad(endAngle))} ${100 + r * Math.sin(toRad(endAngle))}`}
        fill="none" stroke={color} strokeWidth="3"
      />
    );
  })}
</svg>
```

### Command text box with blinking cursor
```tsx
<div className="flex items-center gap-2 bg-panel/80 border border-border rounded-xl px-4 py-2">
  <span>Comands, {transcript || '...'}</span>
  <motion.span className="w-0.5 h-4 bg-cyan" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
  <span className="text-[10px] text-dim/50 ml-auto">V2.0</span>
</div>
```

## References
- `references/hud-voice-core-pattern.tsx` — Full VoiceCore component with animated rings, glow, waveform
- `references/notification-card-pattern.tsx` — NotificationStack with approval cards, slide animations
- `references/elevenlabs-websocket-pattern.ts` — Complete WebSocket TTS hook with audio queue
- `references/serverless-tts-integration.md` — Proxy ElevenLabs through serverless function (hide API key)
- `references/task-execution-visualization.md` — Animated task tracker for AI agent workflows (Codex → coding → building → deploying)
- `references/chat-panel-pattern.tsx` — Chat fallback panel with typing indicator
- `references/tailwind-v4-setup.md` — Tailwind CSS v4 configuration for Vite + React
- `references/jarvis-hud-desktop-widgets.tsx` — Desktop corner widgets: System Status, Weather, Battery, Earth globe, Voice Radar
- `references/gradient-border-button.css` — Purple-to-cyan gradient border button pattern
- `references/backend-proxy-pattern.js` — Express proxy server connecting UI to Hermes/OpenAI-compatible API
- `references/vite-backend-proxy-pattern.md` — Vite dev server proxy to Express backend, cross-device testing with Cloudflare tunnel
- `references/responsive-jarvis-layout.md` — Responsive layout strategy: mobile vs desktop widget visibility
- `references/browser-speech-recognition-pitfalls.md` — Web Speech API race conditions, permission handling, browser compatibility
- `templates/useVoice.ts` — Production-ready speech recognition React hook with error handling

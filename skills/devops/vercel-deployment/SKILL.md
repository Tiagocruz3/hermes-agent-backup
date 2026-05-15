---
name: vercel-deployment
description: "Deploy full-stack web apps to Vercel: React/Vite frontend + serverless API routes (Node.js). Handles CLI auth, env vars, build config, and production aliases."
tags: [devops, vercel, deployment, serverless, vite, react, api-routes, fullstack]
trigger: "User mentions Vercel, deploy to vercel, vercel token, serverless API, or wants to host a web app with backend API on Vercel."
---

# Vercel Deployment — Full-Stack Apps

Deploy React/Vite frontends with serverless API routes to Vercel. One command deploys both frontend static files and backend API endpoints.

## When To Use This Skill

- User has a Vercel account and token
- App has a frontend (React/Vite/Vue/etc.) + needs backend API endpoints
- User wants serverless functions instead of a persistent backend server
- Quick public deployment without managing VPS/Docker

## Prerequisites

- Vercel CLI installed globally or via npx
- Vercel token (from dashboard → Settings → Tokens)
- Git repo (Vercel links to GitHub for continuous deployment)

## Quick Deploy

```bash
# Install CLI if needed
npm install -g vercel

# Deploy with token (non-interactive)
cd ~/projects/my-app
vercel --token <TOKEN> --yes

# Deploy to production
vercel --token <TOKEN> --prod --yes
```

**Token location:** User may provide token directly. Save it securely (not in repo). Store in memory or env var.

## Project Structure

Vercel auto-detects the framework. For Vite + React + API routes:

```
my-app/
├── src/                    # Frontend React code
│   ├── App.tsx
│   └── ...
├── api/                    # Serverless API routes (REQUIRED folder name)
│   ├── chat.js            # → /api/chat
│   └── health.js          # → /api/health
├── dist/                   # Build output (Vite)
├── package.json
├── vite.config.ts
└── vercel.json            # Optional: explicit config
```

**The `api/` folder is magic:** Any `.js`/`.ts` file in `api/` becomes a serverless function at `/api/filename`.

## vercel.json Config

When using `builds` array (explicit frontend + API config):

```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "api/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

**Note:** When `builds` exists, Vercel ignores framework auto-detection. You MUST specify both frontend and API builds.

## API Route Pattern

Serverless function that proxies to an external API (e.g., Hermes, OpenAI):

```js
// api/chat.js
export default async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message } = req.body
  const HERMES_API_URL = process.env.HERMES_API_URL
  const HERMES_API_KEY = process.env.HERMES_API_KEY

  try {
    const response = await fetch(`${HERMES_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(HERMES_API_KEY && { 'Authorization': `Bearer ${HERMES_API_KEY}` }),
      },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'I am here, sir.'
    res.status(200).json({ reply })
  } catch {
    res.status(200).json({ reply: 'Connection to the mainframe is unstable.' })
  }
}
```

**Key points:**
- Use ES modules (`export default`) for Vercel Node.js runtime
- `req`/`res` are standard Node.js http objects
- Environment variables are auto-injected from Vercel project settings
- No need to import `node-fetch` — Vercel Node 18+ has native `fetch`
- **Always add CORS headers** if the frontend and API might be on different origins (e.g., custom domain vs vercel.app)

## Serverless TTS Proxy Pattern

Hide ElevenLabs API key from the client by proxying TTS through a serverless function:

```js
// api/tts.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, voiceId = 'Q7IOSFX7VG3cnK4eU8Z4' } = req.body
  if (!text) return res.status(400).json({ error: 'Text required' })

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'TTS service not configured' })
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 },
      }),
    })

    if (!response.ok) throw new Error('TTS failed')

    // Stream audio back to client
    res.setHeader('Content-Type', 'audio/mpeg')
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
    res.end()
  } catch {
    res.status(500).json({ error: 'TTS generation failed' })
  }
}
```

**Why this pattern:**
- ElevenLabs API key stays server-side (env var)
- Client calls `/api/tts` with just text — no key needed
- Streams audio directly — no base64 encoding overhead
- Works with `new Audio(url)` or `audio.play()` on the frontend

**Voice ID from environment:** Read the voice ID from a server-side env var so it can be changed without redeploying:

```js
const { text, voiceId: voiceIdFromBody } = req.body
const voiceId = process.env.ELEVENLABS_VOICE_ID || voiceIdFromBody || 'fallback-id'
```

Set it via CLI:
```bash
echo "Q7IOSFX7VG3cnK4eU8Z4" | vercel --token <TOKEN> env add ELEVENLABS_VOICE_ID production
```

**Pitfall:** Hardcoding the voice ID in the serverless function means every voice change requires a redeploy. Using `process.env.ELEVENLABS_VOICE_ID` lets you swap voices instantly by updating the env var.

**Frontend usage:**
```ts
const res = await fetch('/api/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Hello sir', voiceId: 'Q7IOSFX7VG3cnK4eU8Z4' }),
})
const blob = await res.blob()
const url = URL.createObjectURL(blob)
const audio = new Audio(url)
await audio.play()
```

## Environment Variables

Set via CLI (non-interactive):

```bash
# Add env var for production environment
echo "value" | vercel --token <TOKEN> env add VAR_NAME production

# Examples
echo "https://api.example.com" | vercel --token <TOKEN> env add HERMES_API_URL production
echo "sk-..." | vercel --token <TOKEN> env add HERMES_API_KEY production
```

**Important:** Env vars set via CLI are project-scoped. The project must already be linked (first deploy creates the link).

**Verify env vars:**
```bash
vercel --token <TOKEN> env ls
```

## Frontend API Calls

In production, API routes are on the same domain:

```ts
// Frontend calls relative path — works in dev (Vite proxy) and production (same domain)
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: text }),
})
```

**Vite dev proxy (vite.config.ts):**
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
```

In production, Vercel routes `/api/*` to serverless functions automatically.

## Pitfalls

### CORS errors from frontend
If the frontend gets `CORS policy: No 'Access-Control-Allow-Origin' header`, add CORS headers to every API route:

```js
res.setHeader('Access-Control-Allow-Origin', '*')
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
if (req.method === 'OPTIONS') return res.status(200).end()
```

This happens when the frontend is on a custom domain or when testing from `localhost` against the production API.

### Streaming response hangs or times out
Vercel serverless functions have a 10s timeout on Hobby tier. For long TTS streams, use the streaming pattern with `res.write()` + `res.end()` rather than buffering the entire response:

```js
res.setHeader('Content-Type', 'audio/mpeg')
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  res.write(Buffer.from(value))
}
res.end()
```

Do NOT use `res.json()` or `res.send()` for binary streams — they buffer and may truncate.

### "Cannot find module" for API routes
If API routes use ES modules (`import/export`) but `package.json` lacks `"type": "module"`, Vercel may fail with "Cannot use import statement outside a module".

**Fix:** Add `"type": "module"` to `package.json`, OR use `.mjs` extension for API files, OR use CommonJS (`require`/`module.exports`) in API files.

### Env var not available in API route
Vercel env vars are injected at build time for frontend, runtime for API routes. If an API route can't read `process.env.MY_VAR`:

1. Check the var is set: `vercel env ls`
2. Check it's set for the right environment (production vs preview vs development)
3. Redeploy after adding env vars — they don't apply retroactively

### Build fails with "No output directory named 'dist'"
Vercel auto-detects Vite and expects `dist/` as output. If using a custom build command or different output dir, specify in `vercel.json`:

```json
{
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ]
}
```

### Speech recognition (Web Speech API) fails / UI flashes
The browser's `webkitSpeechRecognition` API has race conditions between `.start()`, `.stop()`, and the `onend` event. If tapping "Start Listening" causes the UI to flash without capturing speech:

1. **Check browser:** Must be Chrome or Edge. Safari and Firefox don't support it.
2. **Check HTTPS:** SpeechRecognition requires HTTPS (or localhost).
3. **Check mic permission:** Browser must allow microphone access.
4. **Use ref-based state tracking:** The `onend` handler fires for both intentional stops AND errors. Use a ref to distinguish:

```ts
const isListeningRef = useRef(false)

// Before calling .stop()
const stopListening = () => {
  isListeningRef.current = false  // Signal intent
  recognition.stop()
}

// In onend handler
rec.onend = () => {
  if (isListeningRef.current) {
    // Unexpected stop — try to restart
    try { rec.start() } catch {}
  } else {
    // Intentional stop — update UI
    setIsListening(false)
  }
}
```

### Safari / Firefox speech recognition fallback
Safari and Firefox do not support `webkitSpeechRecognition`. For cross-browser voice UIs, implement a server-side STT fallback:

**Architecture:**
```
Frontend (Safari) → MediaRecorder → Record 5s audio → POST /api/stt → Deepgram API → Transcript
```

**Serverless STT endpoint:**
```js
// api/stt.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
  if (!DEEPGRAM_API_KEY) return res.status(500).json({ error: 'STT not configured' })

  const { audio } = req.body  // base64-encoded webm/opus
  if (!audio) return res.status(400).json({ error: 'Audio required' })

  const buffer = Buffer.from(audio, 'base64')
  const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/webm',
    },
    body: buffer,
  })

  const data = await response.json()
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
  res.status(200).json({ transcript })
}
```

**Frontend fallback detection:**
```ts
const hasNativeSTT = typeof window !== 'undefined' && 
  (window.SpeechRecognition || window.webkitSpeechRecognition)

if (!hasNativeSTT) {
  // Use server-side STT via MediaRecorder + /api/stt
  const mediaRecorder = new MediaRecorder(stream)
  // ... record, send to /api/stt
}
```

**Key points:**
- `MediaRecorder` is supported in all modern browsers
- Record for a fixed duration (e.g., 5s) then send the blob
- Deepgram `nova-2` model is fast and accurate for short utterances
- Always provide a manual text input fallback for accessibility

See `references/browser-speech-recognition-pitfalls.md` for full debugging guide.
See `templates/useVoice.ts` for production-ready implementation with both native and server-side STT.

## Workflow

1. Ensure `api/` folder exists with serverless functions
2. Ensure `vercel.json` has proper `builds` and `routes`
3. Deploy: `vercel --token <TOKEN> --yes`
4. Set env vars: `echo "value" | vercel --token <TOKEN> env add NAME production`
5. Redeploy to pick up env vars: `vercel --token <TOKEN> --prod`
6. Test: `curl https://your-app.vercel.app/api/health`

## References
- `references/iron-me-deployment.md` — Complete Iron Me deployment session notes
- `references/serverless-tts-proxy.md` — ElevenLabs TTS proxy pattern
- `references/browser-speech-recognition-pitfalls.md` — Web Speech API race conditions & fixes
- `references/voice-conversation-mode.md` — Live voice chat: auto-turn, interrupt, transcript UI
- `references/task-execution-visualization.md` — Animated task tracker UI for AI agent workflows
- `templates/useVoice.ts` — Production-ready speech recognition React hook

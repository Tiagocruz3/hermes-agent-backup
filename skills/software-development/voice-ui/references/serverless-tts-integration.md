# Serverless TTS Integration for Voice UI

Session: 2026-05-15 — Iron Me JARVIS deployment

## Context
When deploying a voice UI to Vercel (or any static host), the ElevenLabs API key cannot be exposed to the browser. The solution is a serverless function that proxies TTS requests.

## Architecture

```
Browser (React)          Vercel (Serverless)          ElevenLabs
     |                          |                          |
     |-- POST /api/tts -------->|                          |
     |   {text, voiceId}        |                          |
     |                          |-- POST /v1/text-to-speech/>|
     |                          |   {text, model_id, ...}  |
     |                          |   xi-api-key: (env var)  |
     |                          |<-- audio/mpeg stream -------|
     |<-- audio/mpeg stream ------|
```

## Frontend Hook Pattern

Replace direct ElevenLabs WebSocket with fetch-to-server:

```ts
// useVoice.ts — simplified speak function
const speak = useCallback(async (text: string) => {
  setIsSpeaking(true)
  onSpeakingStart()

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: 'Q7IOSFX7VG3cnK4eU8Z4' }),
    })

    if (res.ok && res.headers.get('content-type')?.includes('audio')) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      audio.onended = () => {
        setIsSpeaking(false)
        onSpeakingEnd()
        URL.revokeObjectURL(url)
      }
      await audio.play()
      return
    }

    throw new Error('Server TTS unavailable')
  } catch {
    // Fallback to native speech synthesis
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.1
    utter.pitch = 0.9
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    speechSynthesis.speak(utter)
  }
}, [onSpeakingStart, onSpeakingEnd])
```

## Key differences from client-side WebSocket

| Aspect | WebSocket (client) | Serverless Proxy |
|--------|-------------------|------------------|
| API key exposure | In browser (risky) | Server-side only (safe) |
| Latency | Lower (direct) | Higher (+1 hop) |
| Streaming | Real-time chunks | Full audio blob |
| Fallback | Manual | Automatic (native TTS) |
| Best for | Local dev | Production |

## Env vars

```bash
# Vercel
vercel --token <TOKEN> env add ELEVENLABS_API_KEY production

# Local dev (if using local backend proxy)
ELEVENLABS_API_KEY=sk_... npm start
```

## Pitfall: WebSocket vs REST API
The serverless proxy uses ElevenLabs REST API (`/v1/text-to-speech/{voiceId}/stream`), NOT the WebSocket API. The REST endpoint returns a complete MP3 stream, while WebSocket sends chunks. For serverless, REST is simpler — no WebSocket connection management.

## Pitfall: AudioContext not needed
With the serverless proxy, you don't need Web Audio API (`AudioContext`, `AudioBufferSourceNode`). Just use `new Audio(url)` — much simpler.

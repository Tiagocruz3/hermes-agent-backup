# Serverless TTS Proxy on Vercel

Session: 2026-05-15 — Iron Me JARVIS Voice UI

## Problem
ElevenLabs API key must be hidden from the browser client, but the UI needs voice output.

## Solution
Proxy TTS through a Vercel serverless function (`/api/tts`). The client sends text, the server sends audio.

## api/tts.js

```js
export default async function handler(req, res) {
  // CORS
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

## Frontend usage

```ts
async function speak(text: string) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: 'Q7IOSFX7VG3cnK4eU8Z4' }),
  })

  if (!res.ok) {
    // Fallback to native speech synthesis
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.1
    utter.pitch = 0.9
    speechSynthesis.speak(utter)
    return
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  await audio.play()
  audio.onended = () => URL.revokeObjectURL(url)
}
```

## Env vars

```bash
echo "your-elevenlabs-key" | vercel --token <TOKEN> env add ELEVENLABS_API_KEY production
```

## Key points
- Streams binary audio directly — no base64 overhead
- Client never sees the API key
- Fallback to native `SpeechSynthesis` if server fails
- CORS headers required for cross-origin frontend
- 10s timeout on Hobby tier — use streaming, not buffering

# Vite + Express Backend Proxy Pattern

When building a React frontend with a separate Express backend (common for voice UIs that need API keys hidden from the client), use Vite's dev server proxy.

## Architecture

```
Browser (localhost:5173) → Vite dev server → Proxy /api/* → Express backend (:3001)
```

**Why proxy:** The frontend runs on a different port than the backend during development. Browsers block cross-origin requests (CORS) by default. Vite's proxy forwards `/api` requests to the backend transparently.

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,        // Allow access from other devices on network
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // Express backend
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
```

## Express Backend

```javascript
// server/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', service: 'J.A.R.V.I.S. Proxy', version: '2.0' });
});

// Chat endpoint — forwards to Hermes API
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  const response = await fetch(process.env.HERMES_API_URL + '/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'kimi-k2.6',
      messages: [
        { role: 'system', content: 'You are J.A.R.V.I.S....' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  
  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || 'I am here, sir.';
  
  // Approval guardrail for dangerous commands
  const needsApproval = /\b(delete|remove|exec|run|sudo|rm -rf|format)\b/i.test(message);
  
  res.json({
    reply,
    notification: needsApproval ? {
      type: 'approval',
      title: 'Confirm Action',
      body: `Approve: "${message}"?`,
    } : null,
  });
});

app.listen(3001, () => console.log('Proxy server on port 3001'));
```

## Environment Variables

```bash
# server/.env
HERMES_API_URL=http://127.0.0.1:8642
PORT=3001

# .env.local (frontend)
VITE_ELEVENLABS_API_KEY=sk_...
VITE_ELEVENLABS_VOICE_ID=Q7IOSFX7VG3cnK4eU8Z4
```

## Production Deployment

For production, the proxy pattern changes:

1. **Build frontend:** `npm run build` → outputs to `dist/`
2. **Serve static files from Express:**
   ```javascript
   app.use(express.static('dist'));
   app.get('*', (req, res) => res.sendFile('dist/index.html'));
   ```
3. **Single server runs both frontend and API**
4. **Or deploy separately:** Frontend to static host (Vercel, Netlify), backend to VPS/render

## Cross-Device Testing with Cloudflare Tunnel

When testing on phone/tablet, the backend needs to be accessible from the device:

```bash
# Tunnel the backend port
cloudflared tunnel --url http://localhost:3001
```

Set the tunneled URL in frontend `.env.local`:
```
VITE_API_URL=https://abc123.trycloudflare.com
```

Update fetch calls:
```typescript
const API_URL = import.meta.env.VITE_API_URL || '';
fetch(`${API_URL}/api/chat`, {...})
```

## Session Notes

- `host: true` in Vite config allows access from `192.168.x.x` on local network
- The proxy only works during `npm run dev` — production needs different handling
- Keep API keys in backend `.env`, never in frontend code
- Hermes API at `:8642` is OpenAI-compatible — no API key needed for local access

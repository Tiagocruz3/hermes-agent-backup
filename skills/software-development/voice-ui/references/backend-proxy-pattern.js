# Backend Proxy Pattern for Voice UI

Express server that proxies chat requests from the voice UI to a local Hermes or OpenAI-compatible API server.

## Full Implementation

```js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3001;

const HERMES_API_URL = process.env.HERMES_API_URL || 'http://127.0.0.1:8642';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', service: 'J.A.R.V.I.S. Proxy', version: '2.0' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const messages = [
      { role: 'system', content: 'You are J.A.R.V.I.S., Tony Stark\'s AI assistant. Respond concisely and intelligently. You have a dry wit and British mannerisms. Always address the user as "sir".' },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch(`${HERMES_API_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'kimi-k2.6',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Hermes API error:', error);
      return res.json({
        reply: 'I apologize, sir. The mainframe appears to be offline.',
        notification: null,
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I am here, sir.';

    // Approval guardrail for dangerous commands
    const needsApproval = /\b(delete|remove|exec|run|sudo|rm -rf|format)\b/i.test(message);

    res.json({
      reply,
      notification: needsApproval ? {
        type: 'approval',
        title: 'Command Authorization Required',
        body: `The command "${message}" requires your approval to proceed.`,
      } : null,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.json({
      reply: 'I apologize, sir. I am experiencing technical difficulties.',
      notification: null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`J.A.R.V.I.S. proxy server running on port ${PORT}`);
  console.log(`Hermes API: ${HERMES_API_URL}`);
});
```

## Hermes API Discovery

Hermes runs an OpenAI-compatible API server on port 8642 by default. Check `~/.hermes/config.yaml`:

```yaml
platforms:
  api_server:
    enabled: true
    extra:
      host: 127.0.0.1
      port: 8642
      cors_origins: "*"
```

**Test the API:**
```bash
curl -s http://127.0.0.1:8642/v1/chat/completions \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"kimi-k2.6","messages":[{"role":"user","content":"hello"}]}'
```

**Response:**
```json
{"id": "chatcmpl-...", "choices": [{"message": {"role": "assistant", "content": "Hey ace!"}}]}
```

**No API key needed** — Hermes uses its configured provider (kimi-coding, openrouter, etc.) internally.

## Vite Proxy Config

During development, proxy `/api` to the backend:
```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
```

In production, serve the built `dist/` folder from Express or deploy UI and API separately.

## Approval Guardrail Pattern

The regex check for dangerous keywords triggers a notification card in the UI:
```js
const needsApproval = /\b(delete|remove|exec|run|sudo|rm -rf|format)\b/i.test(message);
```

The UI's `NotificationStack` component renders an approval card with Approve/Deny buttons when `notification.type === 'approval'`.

## Package.json

```json
{
  "name": "jarvis-proxy",
  "version": "2.0.0",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "node-fetch": "^2.7.0"
  }
}
```

## Pitfalls

### Hermes API returns 404 on `/api/chat`
Hermes uses OpenAI-compatible endpoints at `/v1/chat/completions`, not `/api/chat`. Always use the `/v1/` path.

### History role mapping
The UI stores roles as `user`/`assistant`/`system`. Map correctly when forwarding:
```js
history.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))
```

### CORS in production
If UI and API are on different domains, ensure `cors()` middleware is enabled and `cors_origins` in Hermes config allows the UI domain.

### Model name mismatch
Use the exact model name from Hermes config (`kimi-k2.6`, `claude-sonnet-4`, etc.). Check `~/.hermes/config.yaml` under `model.default`.

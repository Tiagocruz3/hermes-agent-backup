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
      ...history.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
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

app.post('/api/notify', (req, res) => {
  res.json({ success: true, id: Math.random().toString(36).slice(2) });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../dist'));
}

app.listen(PORT, () => {
  console.log(`J.A.R.V.I.S. proxy server running on port ${PORT}`);
  console.log(`Hermes API: ${HERMES_API_URL}`);
});

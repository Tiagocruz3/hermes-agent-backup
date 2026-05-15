export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { message } = req.body
  if (!message) return res.status(400).json({ error: 'Message required' })

  const HERMES_API_URL = process.env.HERMES_API_URL || 'https://decimal-empire-describes-mounting.trycloudflare.com'
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

    const dangerWords = /\b(delete|remove|exec|run\s+sudo|rm\s+-rf|format)\b/i
    const notification = dangerWords.test(message) ? {
      id: Date.now().toString(),
      type: 'approval',
      title: 'Dangerous Command Detected',
      message: `"${message}" — Approve execution?`,
      timestamp: Date.now(),
    } : null

    res.status(200).json({ reply, notification })
  } catch {
    res.status(200).json({ reply: 'Connection to the mainframe is unstable.', notification: null })
  }
}

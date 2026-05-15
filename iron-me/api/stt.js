export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
  if (!DEEPGRAM_API_KEY) {
    return res.status(500).json({ error: 'STT service not configured' })
  }

  try {
    const { audio } = req.body
    if (!audio) return res.status(400).json({ error: 'Audio data required' })

    const buffer = Buffer.from(audio, 'base64')

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true', {
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
  } catch {
    res.status(500).json({ error: 'Transcription failed' })
  }
}

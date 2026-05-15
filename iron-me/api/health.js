export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.status(200).json({ status: 'online', service: 'J.A.R.V.I.S. Proxy', version: '2.0' })
}

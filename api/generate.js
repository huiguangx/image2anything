export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const BACKEND_URL = process.env.BACKEND_URL || 'http://43.155.220.62'

  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const text = await response.text()
      return res.status(response.status).json({ error: text })
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('image/')) {
      const buffer = Buffer.from(await response.arrayBuffer())
      const b64 = buffer.toString('base64')
      return res.status(200).json({
        data: [{ b64_json: b64 }],
      })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

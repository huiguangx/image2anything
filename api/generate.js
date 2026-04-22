import { generateImageWithFallback } from './_providers.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    const result = await generateImageWithFallback(prompt)
    if (!result.ok) {
      return res.status(result.statusCode || 500).json({
        error: result.error,
        attempts: result.attempts,
      })
    }

    return res.status(200).json({
      data: [{ b64_json: result.b64_json }],
      meta: {
        provider: result.provider,
        responseId: result.meta?.responseId || null,
        quality: result.meta?.finalCall?.quality || null,
        revisedPrompt: result.meta?.finalCall?.revised_prompt || null,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

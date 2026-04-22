import type { GenerateRequest, GenerateResult } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

async function generateImageReal(req: GenerateRequest): Promise<GenerateResult> {
  const res = await fetch(`${API_BASE}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: req.prompt,
    }),
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('No image returned')

  return {
    imageUrl: `data:image/png;base64,${b64}`,
    prompt: req.prompt,
  }
}

async function generateImageMock(req: GenerateRequest): Promise<GenerateResult> {
  await new Promise((r) => setTimeout(r, 2000))
  return {
    imageUrl: `https://placehold.co/1024x1024/1a1a2e/e0e0e0?text=AI+Generated`,
    prompt: req.prompt,
  }
}

const useMock = !API_BASE

export const generateImage = useMock ? generateImageMock : generateImageReal

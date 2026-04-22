import type { GenerateRequest, GenerateResult } from '../types'

async function generateImageReal(req: GenerateRequest): Promise<GenerateResult> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: req.prompt }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `API error: ${res.status}`)
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

const useMock = import.meta.env.DEV

export const generateImage = useMock ? generateImageMock : generateImageReal

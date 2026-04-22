import type { GenerateRequest, GenerateResult } from '../types'

export async function generateImage(req: GenerateRequest): Promise<GenerateResult> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: req.prompt }),
  })
// a
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `生成失败: ${res.status}`)
  }

  const data = await res.json()
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('未返回图片')

  return {
    imageUrl: `data:image/png;base64,${b64}`,
    prompt: req.prompt,
  }
}

import type { GenerateRequest, GenerateResult } from '../types'

function getGenerateUrl() {
  const raw = (import.meta.env.VITE_IMAGE_API_URL || '/api/generate').trim()
  return raw.replace(/\/+$/, '')
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('图片读取失败'))
    }
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(blob)
  })
}

async function parseError(res: Response) {
  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `生成失败: ${res.status}`)
  }

  const text = await res.text().catch(() => '')
  throw new Error(text || `生成失败: ${res.status}`)
}

export async function generateImage(req: GenerateRequest): Promise<GenerateResult> {
  const res = await fetch(getGenerateUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: req.prompt }),
  })

  if (!res.ok) {
    await parseError(res)
  }

  const contentType = res.headers.get('content-type') || ''

  if (contentType.includes('image/')) {
    const blob = await res.blob()
    return {
      imageUrl: await blobToDataUrl(blob),
      prompt: req.prompt,
    }
  }

  const data = await res.json().catch(() => null)
  const b64 = data?.data?.[0]?.b64_json
  const imageUrl = data?.imageUrl
  const finalImageUrl = imageUrl || (b64 ? `data:image/png;base64,${b64}` : '')

  if (!finalImageUrl) {
    throw new Error('未返回图片')
  }

  return {
    imageUrl: finalImageUrl,
    prompt: req.prompt,
  }
}

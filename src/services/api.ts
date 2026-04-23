import type { GenerateRequest, GenerateResult } from '../types'

const GENERATE_TIMEOUT_MS = 160000
const MODEL_CAPACITY_ERROR = '当前模型资源有点紧张，辛苦您再试一次～'
const MODEL_CAPACITY_RETRY_HINT = `${MODEL_CAPACITY_ERROR} 如果现在人太多，过一会儿再试更容易成功。`

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
    if (err.errorCode === 'model_capacity' || [502, 503, 504].includes(res.status)) {
      throw new Error(MODEL_CAPACITY_ERROR)
    }
    throw new Error(err.error || `生成失败: ${res.status}`)
  }

  const text = await res.text().catch(() => '')
  if ([502, 503, 504].includes(res.status)) {
    throw new Error(MODEL_CAPACITY_ERROR)
  }
  throw new Error(text || `生成失败: ${res.status}`)
}

export async function generateImage(
  req: GenerateRequest,
  options?: { signal?: AbortSignal }
): Promise<GenerateResult> {
  const controller = new AbortController()
  let timedOut = false
  let rejectOnTimeout: ((reason?: unknown) => void) | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    rejectOnTimeout = reject
  })
  const timer = window.setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('timeout', 'AbortError'))
    rejectOnTimeout?.(new Error(MODEL_CAPACITY_RETRY_HINT))
  }, GENERATE_TIMEOUT_MS)
  const externalSignal = options?.signal
  const forwardAbort = () => controller.abort(externalSignal?.reason || 'cancelled')

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason || 'cancelled')
    } else {
      externalSignal.addEventListener('abort', forwardAbort, { once: true })
    }
  }

  const requestPromise = (async (): Promise<GenerateResult> => {
    const res = await fetch(getGenerateUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: req.prompt }),
      signal: controller.signal,
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
  })()

  try {
    return await Promise.race([requestPromise, timeoutPromise])
  } catch (error) {
    if (timedOut) {
      throw new Error(MODEL_CAPACITY_RETRY_HINT)
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      if (externalSignal?.aborted) {
        throw error
      }
      throw new Error(MODEL_CAPACITY_RETRY_HINT)
    }

    if (error instanceof TypeError) {
      throw new Error(MODEL_CAPACITY_RETRY_HINT)
    }

    throw error
  } finally {
    window.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', forwardAbort)
  }
}

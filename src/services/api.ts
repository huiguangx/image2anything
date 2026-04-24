import type { GenerateJob, GenerateRequest, GenerateResult } from '../types'

const MODEL_CAPACITY_ERROR = '当前模型资源有点紧张，辛苦您再试一次～'
const MODEL_CAPACITY_RETRY_HINT = `${MODEL_CAPACITY_ERROR} 如果现在人太多，过一会儿再试更容易成功。`
const GENERATE_JOB_POLL_INTERVAL_MS = 1500

function getGenerateBaseUrl() {
  const raw = (import.meta.env.VITE_IMAGE_API_URL || '/api/generate').trim()
  return raw.replace(/\/+$/, '')
}

function createAbortError() {
  return new DOMException('The operation was aborted', 'AbortError')
}

function getGenerateJobsUrl() {
  return `${getGenerateBaseUrl()}/jobs`
}

function resolveImageUrl(imageUrl: string) {
  if (/^(data:|https?:\/\/)/.test(imageUrl)) {
    return imageUrl
  }

  const baseUrl = getGenerateBaseUrl()
  if (baseUrl.endsWith('/generate') && imageUrl.startsWith('/api/generate/')) {
    const apiPrefix = baseUrl.replace(/\/generate$/, '')
    return `${apiPrefix}${imageUrl.slice('/api'.length)}`
  }

  return imageUrl
}

async function waitForDelay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      window.clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(createAbortError())
    }

    signal?.addEventListener('abort', onAbort, { once: true })
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

async function createGenerateJob(req: GenerateRequest, signal?: AbortSignal) {
  const res = await fetch(getGenerateJobsUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: req.prompt,
      preferredProviders: req.preferredProviders,
    }),
    signal,
  })

  if (!res.ok) {
    await parseError(res)
  }

  const data = await res.json().catch(() => null)
  const jobId = data?.jobId

  if (!jobId || typeof jobId !== 'string') {
    throw new Error('任务创建失败，请稍后再试')
  }

  return jobId
}

async function getGenerateJob(jobId: string, signal?: AbortSignal): Promise<GenerateJob> {
  const res = await fetch(`${getGenerateJobsUrl()}/${encodeURIComponent(jobId)}`, { signal })

  if (!res.ok) {
    await parseError(res)
  }

  const data = await res.json().catch(() => null)
  if (!data?.jobId || !data?.status) {
    throw new Error('任务状态读取失败，请稍后再试')
  }

  return data as GenerateJob
}

async function cancelGenerateJob(jobId: string) {
  try {
    await fetch(`${getGenerateJobsUrl()}/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    })
  } catch {
    // Ignore best-effort cancellation failures.
  }
}

async function waitForGenerateResult(
  jobId: string,
  prompt: string,
  signal?: AbortSignal
): Promise<GenerateResult> {
  while (true) {
    const job = await getGenerateJob(jobId, signal)

    if (job.status === 'queued' || job.status === 'running') {
      await waitForDelay(GENERATE_JOB_POLL_INTERVAL_MS, signal)
      continue
    }

    if (job.status === 'succeeded' && job.imageUrl) {
      return {
        imageUrl: resolveImageUrl(job.imageUrl),
        prompt,
        providerName: job.providerName || undefined,
      }
    }

    if (job.status === 'canceled') {
      throw createAbortError()
    }

    if (job.errorCode === 'model_capacity') {
      throw new Error(MODEL_CAPACITY_ERROR)
    }

    throw new Error(job.error || '这次没有成功出图，请稍后再试一次')
  }
}

export async function generateImage(
  req: GenerateRequest,
  options?: { signal?: AbortSignal }
): Promise<GenerateResult> {
  const externalSignal = options?.signal
  let jobId: string | null = null
  let cancelRequested = false

  if (externalSignal?.aborted) {
    throw createAbortError()
  }

  const handleAbort = () => {
    if (jobId && !cancelRequested) {
      cancelRequested = true
      void cancelGenerateJob(jobId)
    }
  }

  externalSignal?.addEventListener('abort', handleAbort, { once: true })

  try {
    jobId = await createGenerateJob(req, externalSignal)
    return await waitForGenerateResult(jobId, req.prompt, externalSignal)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (jobId && !cancelRequested) {
        cancelRequested = true
        await cancelGenerateJob(jobId)
      }
      throw error
    }

    if (error instanceof TypeError) {
      throw new Error(MODEL_CAPACITY_RETRY_HINT)
    }

    throw error
  } finally {
    externalSignal?.removeEventListener('abort', handleAbort)
  }
}

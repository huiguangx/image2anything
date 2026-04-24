import type { GenerateJob, SessionUser } from '../types'

const SESSION_STORAGE_KEY = 'gpt-image-user-id'

function getKeysUrl() {
  const explicit = (import.meta.env.VITE_KEYS_API_URL || '').trim()
  if (explicit) {
    return explicit.replace(/\/+$/, '')
  }

  const generateUrl = (import.meta.env.VITE_IMAGE_API_URL || '/api/generate').trim().replace(/\/+$/, '')
  if (generateUrl.endsWith('/generate')) {
    return generateUrl.replace(/\/generate$/, '/keys')
  }

  return '/api/keys'
}

function getSessionBaseUrl() {
  return getKeysUrl().replace(/\/keys$/, '/session')
}

export function readStoredUserId() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY) || ''
}

function storeUserId(userId: string) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, userId)
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) {
    throw new Error((data && typeof data.error === 'string' && data.error) || '请求失败，请稍后再试')
  }
  return data as T
}

export async function ensureSession(userId?: string): Promise<SessionUser> {
  const res = await fetch(getSessionBaseUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId || readStoredUserId() || undefined }),
  })

  const data = await parseJson<{ user: SessionUser }>(res)
  storeUserId(data.user.id)
  return data.user
}

export async function registerAccount(profileName: string, userId?: string): Promise<SessionUser> {
  const res = await fetch(`${getSessionBaseUrl()}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: userId || readStoredUserId() || undefined, profileName }),
  })

  const data = await parseJson<{ user: SessionUser }>(res)
  storeUserId(data.user.id)
  return data.user
}

export async function fetchUserJobs(userId: string): Promise<GenerateJob[]> {
  const res = await fetch(`${getSessionBaseUrl()}/${encodeURIComponent(userId)}/jobs`, {
    headers: {
      'X-User-Id': userId,
    },
  })

  const data = await parseJson<{ jobs: GenerateJob[] }>(res)
  return data.jobs || []
}

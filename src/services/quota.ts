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

async function callKeysApi(body: Record<string, unknown>, userId?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (userId) {
    headers['X-User-Id'] = userId
  }

  const res = await fetch(getKeysUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(
      (data && typeof data.error === 'string' && data.error) || '额度服务暂时不可用，请稍后再试'
    )
  }

  return data || {}
}

export async function checkFree(userId?: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'check_free' }, userId)
  return !!data.free
}

export async function consumeFree(userId?: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'consume_free' }, userId)
  return !!data.ok
}

export async function validateKey(key: string, userId?: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'validate', key }, userId)
  return data.valid
}

export async function consumeKey(key: string, userId?: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'consume', key }, userId)
  return !!data.ok
}

export async function consumeCredit(userId: string): Promise<number> {
  const data = await callKeysApi({ action: 'consume_credit' }, userId)
  return Number(data.credits || 0)
}

export async function getQuotaStatus(userId?: string) {
  return callKeysApi({ action: 'status' }, userId)
}

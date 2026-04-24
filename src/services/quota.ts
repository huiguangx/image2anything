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

async function callKeysApi(body: Record<string, unknown>) {
  const res = await fetch(getKeysUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function checkFree(): Promise<boolean> {
  const data = await callKeysApi({ action: 'check_free' })
  return !!data.free
}

export async function consumeFree(): Promise<boolean> {
  const data = await callKeysApi({ action: 'consume_free' })
  return !!data.ok
}

export async function validateKey(key: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'validate', key })
  return data.valid
}

export async function consumeKey(key: string): Promise<boolean> {
  const data = await callKeysApi({ action: 'consume', key })
  return !!data.ok
}

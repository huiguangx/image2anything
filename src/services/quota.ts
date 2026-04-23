async function callKeysApi(body: Record<string, unknown>) {
  const res = await fetch('/api/keys', {
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

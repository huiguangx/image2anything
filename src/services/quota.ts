async function callKeysApi(body: Record<string, unknown>) {
  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
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

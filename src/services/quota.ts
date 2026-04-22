interface QuotaResponse {
  remaining: number
  total: number
  error?: string
}

async function callQuotaApi(action: 'check' | 'consume'): Promise<QuotaResponse> {
  const res = await fetch('/api/quota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  return res.json()
}

export async function checkQuota(): Promise<boolean> {
  const data = await callQuotaApi('check')
  return data.remaining > 0
}

export async function consumeQuota(): Promise<boolean> {
  const data = await callQuotaApi('consume')
  return !data.error
}

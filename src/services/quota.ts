const STORAGE_KEY = 'nano_banana_key'

export function getSavedKey(): string {
  return localStorage.getItem(STORAGE_KEY) || ''
}

export function saveKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key)
}

export function clearKey() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function validateKey(key: string): Promise<boolean> {
  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'validate', key }),
  })
  const data = await res.json()
  return data.valid
}

export async function consumeKey(key: string): Promise<boolean> {
  const res = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'consume', key }),
  })
  const data = await res.json()
  return !!data.ok
}

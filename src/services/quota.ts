const STORAGE_KEY = 'nano_banana_usage'
const FREE_QUOTA = 1

interface UsageData {
  used: number
}

function getUsage(): UsageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // corrupted storage, treat as fresh
  }
  return { used: 0 }
}

function setUsage(data: UsageData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getRemainingFree(): number {
  return Math.max(0, FREE_QUOTA - getUsage().used)
}

export function consumeOnce(): boolean {
  const usage = getUsage()
  if (usage.used >= FREE_QUOTA) return false
  usage.used += 1
  setUsage(usage)
  return true
}

export function hasFreeTries(): boolean {
  return getRemainingFree() > 0
}

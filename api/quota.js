import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const FREE_QUOTA = 1

function getRedis() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function fingerprint(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
  const ua = req.headers['user-agent'] || ''
  const raw = `${ip}:${ua}`
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body
  const redis = getRedis()

  if (!redis) {
    return res.status(200).json({ remaining: FREE_QUOTA, total: FREE_QUOTA, mock: true })
  }

  const fp = fingerprint(req)
  const key = `quota:${fp}`

  if (action === 'check') {
    const used = (await redis.get(key)) || 0
    return res.status(200).json({
      remaining: Math.max(0, FREE_QUOTA - Number(used)),
      total: FREE_QUOTA,
    })
  }

  if (action === 'consume') {
    const used = (await redis.get(key)) || 0
    if (Number(used) >= FREE_QUOTA) {
      return res.status(403).json({ error: 'quota_exceeded', remaining: 0 })
    }
    await redis.incr(key)
    return res.status(200).json({
      remaining: Math.max(0, FREE_QUOTA - Number(used) - 1),
      total: FREE_QUOTA,
    })
  }

  return res.status(400).json({ error: 'Invalid action. Use "check" or "consume".' })
}

import { Redis } from '@upstash/redis'
import crypto from 'crypto'

function getRedis() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

const KEYS_SET = 'image_keys'
const FREE_QUOTA = 1

function fingerprint(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown'
  const ua = req.headers['user-agent'] || ''
  return 'free:' + crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, key } = req.body
  const redis = getRedis()

  if (!redis) {
    if (action === 'check_free') return res.status(200).json({ free: true, mock: true })
    if (action === 'validate') return res.status(200).json({ valid: true, mock: true })
    return res.status(200).json({ ok: true, mock: true })
  }

  if (action === 'check_free') {
    const fp = fingerprint(req)
    const used = (await redis.get(fp)) || 0
    return res.status(200).json({ free: Number(used) < FREE_QUOTA })
  }

  if (action === 'consume_free') {
    const fp = fingerprint(req)
    const used = (await redis.get(fp)) || 0
    if (Number(used) >= FREE_QUOTA) {
      return res.status(403).json({ error: 'free_exhausted' })
    }
    await redis.incr(fp)
    return res.status(200).json({ ok: true })
  }

  if (action === 'validate') {
    if (!key) return res.status(400).json({ valid: false, error: '请输入密钥' })
    const exists = await redis.sismember(KEYS_SET, key.trim())
    return res.status(200).json({ valid: !!exists })
  }

  if (action === 'consume') {
    if (!key) return res.status(400).json({ error: '请输入密钥' })
    const removed = await redis.srem(KEYS_SET, key.trim())
    if (!removed) {
      return res.status(403).json({ error: '密钥无效或已使用' })
    }
    return res.status(200).json({ ok: true })
  }

  if (action === 'import') {
    const adminKey = process.env.ADMIN_KEY
    if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const { keys } = req.body
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'keys array required' })
    }
    await redis.sadd(KEYS_SET, ...keys)
    const total = await redis.scard(KEYS_SET)
    return res.status(200).json({ imported: keys.length, total })
  }

  return res.status(400).json({ error: 'Invalid action' })
}

import { readConfig, sanitizeProvider, validateProvider, writeConfig } from './_providers.js'

function requireAdmin(req) {
  const adminKey = process.env.ADMIN_KEY || ''
  if (!adminKey) return true
  return req.headers['x-admin-key'] === adminKey
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (!requireAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const config = readConfig()
    return res.status(200).json({
      ok: true,
      roundRobinIndex: config.roundRobinIndex,
      request: config.request,
      providers: config.providers.map((provider) => ({
        name: provider.name,
        url: provider.url,
        enabled: provider.enabled !== false,
        apiKeyMasked: provider.apiKey ? `${provider.apiKey.slice(0, 6)}...${provider.apiKey.slice(-4)}` : '',
      })),
    })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!requireAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const body = req.body || {}
    const current = readConfig()

    if (!Array.isArray(body.providers) || body.providers.length === 0) {
      return res.status(400).json({ error: 'providers must be a non-empty array' })
    }

    const providers = body.providers.map(sanitizeProvider)
    providers.forEach(validateProvider)

    const nextConfig = {
      roundRobinIndex: Number.isInteger(body.roundRobinIndex) ? body.roundRobinIndex : 0,
      request: {
        ...current.request,
        ...(body.request || {}),
      },
      providers,
    }

    writeConfig(nextConfig)
    return res.status(200).json({ ok: true, providerCount: providers.length })
  } catch (err) {
    return res.status(400).json({ error: err.message || String(err) })
  }
}

export interface ShowcaseItem {
  id: string
  title: string
  description?: string
  imageUrl: string
  prompt?: string
}

export interface GenerateRequest {
  prompt: string
  image?: string
  preferredProviders?: string[]
}

export interface GenerateResult {
  imageUrl: string
  prompt: string
  providerName?: string
}

export interface GenerateSlot {
  id: string
  title: string
  status: 'loading' | 'success' | 'error'
  result?: GenerateResult
  error?: string
  finishedAt?: number
}

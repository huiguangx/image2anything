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

export type GenerateJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export interface GenerateJob {
  jobId: string
  status: GenerateJobStatus
  prompt: string
  providerName?: string | null
  imageUrl?: string
  error?: string | null
  errorCode?: string | null
  retryable?: boolean
  createdAt: number
  updatedAt: number
  completedAt?: number | null
}

export interface GenerateSlot {
  id: string
  title: string
  status: 'loading' | 'success' | 'error'
  result?: GenerateResult
  error?: string
  finishedAt?: number
}

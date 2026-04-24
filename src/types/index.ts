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
  userId?: string
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
  mode?: 'text' | 'image'
  providerName?: string | null
  imageUrl?: string
  error?: string | null
  errorCode?: string | null
  retryable?: boolean
  createdAt: number
  updatedAt: number
  completedAt?: number | null
}

export interface SessionUser {
  id: string
  role: 'guest' | 'account'
  credits: number
  profileName?: string | null
}

export interface GenerateSlot {
  id: string
  title: string
  status: 'loading' | 'success' | 'error'
  result?: GenerateResult
  error?: string
  finishedAt?: number
}

export interface BackgroundGenerationState {
  prompt: string
  slots: GenerateSlot[]
  startedAt: number
  image?: string
}

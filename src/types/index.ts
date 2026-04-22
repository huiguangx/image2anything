export interface ShowcaseItem {
  id: string
  title: string
  description: string
  imageUrl: string
  prompt: string
}

export interface GenerateRequest {
  prompt: string
  image?: string
}

export interface GenerateResult {
  imageUrl: string
  prompt: string
}

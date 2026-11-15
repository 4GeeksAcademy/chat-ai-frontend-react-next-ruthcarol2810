export const MODELS = [
  { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B (Groq)' },
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const DEFAULT_MODEL: ModelId = MODELS[0].id

export function isModelId(value: unknown): value is ModelId {
  return MODELS.some((model) => model.id === value)
}

export type ChatMetadata = {
  model?: string
  createdAt?: number
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  responseTimeMs?: number
  timeToFirstTokenMs?: number
  tokensPerSecond?: number
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: ChatMetadata
}

export type TurnStats = {
  id: string
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  responseTimeMs: number
  timeToFirstTokenMs?: number
  tokensPerSecond: number
}

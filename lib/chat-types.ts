import type { UIMessage } from 'ai'

export const MODELS = [
  { id: 'openai/gpt-5.4-mini', label: 'GPT-5.4 mini' },
  { id: 'anthropic/claude-haiku-4.5', label: 'Claude Haiku 4.5' },
  { id: 'google/gemini-3-flash', label: 'Gemini 3 Flash' },
  { id: 'openai/gpt-5.5', label: 'GPT-5.5' },
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

export type ChatMessage = UIMessage<ChatMetadata>

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

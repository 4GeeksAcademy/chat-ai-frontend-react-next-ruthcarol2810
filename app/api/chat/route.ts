import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from 'ai'
import { DEFAULT_MODEL, isModelId, type ChatMessage } from '@/lib/chat-types'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, model }: { messages: ChatMessage[]; model?: unknown } = await req.json()

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'Formato de mensajes inválido' }, { status: 400 })
  }

  const modelId = isModelId(model) ? model : DEFAULT_MODEL
  const startedAt = Date.now()
  let firstTokenAt: number | undefined

  const result = streamText({
    model: modelId,
    instructions:
      'Eres un asistente útil y conciso. Responde en el idioma del usuario. Usa texto plano con párrafos cortos y listas simples cuando ayuden.',
    messages: await convertToModelMessages(messages),
    onChunk: ({ chunk }) => {
      if (firstTokenAt === undefined && chunk.type === 'text-delta') {
        firstTokenAt = Date.now()
      }
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onError: (error) => {
        console.error('[chat] stream error', error)
        return error instanceof Error
          ? error.message
          : 'No se pudo obtener respuesta del modelo. Inténtalo de nuevo.'
      },
      messageMetadata: ({ part }) => {
        if (part.type === 'start') {
          return { model: modelId, createdAt: startedAt }
        }

        if (part.type === 'finish') {
          const finishedAt = Date.now()
          const responseTimeMs = finishedAt - startedAt
          const promptTokens = part.totalUsage.inputTokens ?? 0
          const completionTokens = part.totalUsage.outputTokens ?? 0
          const totalTokens = part.totalUsage.totalTokens ?? promptTokens + completionTokens
          const generationMs = firstTokenAt ? finishedAt - firstTokenAt : responseTimeMs
          const tokensPerSecond =
            generationMs > 0 ? completionTokens / (generationMs / 1000) : 0

          return {
            model: modelId,
            createdAt: startedAt,
            promptTokens,
            completionTokens,
            totalTokens,
            responseTimeMs,
            timeToFirstTokenMs: firstTokenAt ? firstTokenAt - startedAt : undefined,
            tokensPerSecond,
          }
        }
      },
    }),
  })
}

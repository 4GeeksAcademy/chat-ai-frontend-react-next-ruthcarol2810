import { DEFAULT_MODEL, isModelId } from '@/lib/chat-types'

export const runtime = 'nodejs'

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MAX_MESSAGES = 100
const MAX_MESSAGE_LENGTH = 20_000

type GroqMessage = {
  role: 'user' | 'assistant'
  content: string
}

type GroqResponse = {
  choices?: Array<{ message?: { content?: unknown } }>
  model?: string
  usage?: {
    prompt_tokens?: unknown
    completion_tokens?: unknown
    total_tokens?: unknown
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function tokenCount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!isRecord(payload) || !isRecord(payload.error)) return undefined
  return typeof payload.error.message === 'string' ? payload.error.message : undefined
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' }, { status: 400 })
  }

  if (!isRecord(body) || !Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: 'Envía una conversación con al menos un mensaje.' }, { status: 400 })
  }

  if (body.messages.length > MAX_MESSAGES) {
    return Response.json({ error: 'La conversación es demasiado larga. Borra mensajes e inténtalo de nuevo.' }, { status: 400 })
  }

  const messages: GroqMessage[] = []
  for (const item of body.messages) {
    if (
      !isRecord(item) ||
      (item.role !== 'user' && item.role !== 'assistant') ||
      typeof item.content !== 'string' ||
      item.content.trim().length === 0 ||
      item.content.length > MAX_MESSAGE_LENGTH
    ) {
      return Response.json({ error: 'Uno o más mensajes tienen un formato inválido.' }, { status: 400 })
    }
    messages.push({ role: item.role, content: item.content })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'Falta configurar GROQ_API_KEY en el archivo .env.local. Reinicia el servidor después de añadirla.' },
      { status: 500 },
    )
  }

  const model = isModelId(body.model) ? body.model : DEFAULT_MODEL
  const startedAt = Date.now()

  let groqResponse: Response
  try {
    groqResponse = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente útil y conciso. Responde en el idioma del usuario. Usa texto claro con párrafos cortos y listas simples cuando ayuden.',
          },
          ...messages,
        ],
        stream: false,
      }),
      cache: 'no-store',
    })
  } catch {
    return Response.json(
      { error: 'No se pudo conectar con Groq. Comprueba tu conexión e inténtalo de nuevo.' },
      { status: 502 },
    )
  }

  let payload: unknown
  try {
    payload = await groqResponse.json()
  } catch {
    return Response.json({ error: 'Groq devolvió una respuesta que no se pudo interpretar.' }, { status: 502 })
  }

  if (!groqResponse.ok) {
    const providerMessage = getErrorMessage(payload)
    if (groqResponse.status === 401 || groqResponse.status === 403) {
      return Response.json(
        { error: 'Groq rechazó la API key. Verifica que sea válida y esté activa.' },
        { status: groqResponse.status },
      )
    }
    if (groqResponse.status === 404 || groqResponse.status === 400) {
      return Response.json(
        { error: providerMessage ?? 'Groq rechazó el modelo o el formato de la solicitud. Verifica el modelo configurado.' },
        { status: groqResponse.status },
      )
    }
    return Response.json(
      { error: providerMessage ?? 'Groq no pudo completar la solicitud. Inténtalo de nuevo más tarde.' },
      { status: groqResponse.status >= 500 ? 502 : groqResponse.status },
    )
  }

  if (!isRecord(payload)) {
    return Response.json({ error: 'Groq devolvió una respuesta con formato inválido.' }, { status: 502 })
  }

  const result = payload as GroqResponse
  const content = result.choices?.[0]?.message?.content
  if (typeof content !== 'string' || content.length === 0) {
    return Response.json({ error: 'Groq no devolvió texto en la respuesta.' }, { status: 502 })
  }

  const promptTokens = tokenCount(result.usage?.prompt_tokens, 0)
  const completionTokens = tokenCount(result.usage?.completion_tokens, 0)
  const totalTokens = tokenCount(result.usage?.total_tokens, promptTokens + completionTokens)
  const responseTimeMs = Date.now() - startedAt

  return Response.json({
    message: content,
    metadata: {
      model: typeof result.model === 'string' ? result.model : model,
      createdAt: Date.now(),
      promptTokens,
      completionTokens,
      totalTokens,
      responseTimeMs,
      tokensPerSecond: responseTimeMs > 0 ? completionTokens / (responseTimeMs / 1000) : 0,
    },
  })
}

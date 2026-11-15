'use client'

import { useEffect, useRef, useState } from 'react'
import { BarChart3, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { StatsSidebar } from '@/components/chat/stats-sidebar'
import { DEFAULT_MODEL, MODELS, type ChatMessage, type ModelId, type TurnStats } from '@/lib/chat-types'
import { formatInt } from '@/lib/format'

const STORAGE_KEY = 'token-lab-session-v1'

type StoredSession = { messages: ChatMessage[]; turns: TurnStats[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.role === 'user' || value.role === 'assistant') &&
    typeof value.content === 'string'
  )
}

function isTurnStats(value: unknown): value is TurnStats {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.model === 'string' &&
    ['promptTokens', 'completionTokens', 'totalTokens', 'responseTimeMs', 'tokensPerSecond'].every(
      (key) => typeof value[key] === 'number' && Number.isFinite(value[key]) && (value[key] as number) >= 0,
    ) &&
    (value.timeToFirstTokenMs === undefined || typeof value.timeToFirstTokenMs === 'number')
  )
}

function isStoredSession(value: unknown): value is StoredSession {
  return (
    isRecord(value) &&
    Array.isArray(value.messages) &&
    value.messages.every(isChatMessage) &&
    Array.isArray(value.turns) &&
    value.turns.every(isTurnStats)
  )
}

function getApiError(payload: unknown): string {
  return isRecord(payload) && typeof payload.error === 'string'
    ? payload.error
    : 'No se pudo obtener una respuesta válida del servidor.'
}

export function ChatApp() {
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [turns, setTurns] = useState<TurnStats[]>([])
  const [statsOpen, setStatsOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRestored, setIsRestored] = useState(false)
  const requestId = useRef(0)
  const abortController = useRef<AbortController | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (isStoredSession(parsed)) {
          setMessages(parsed.messages)
          setTurns(parsed.turns)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsRestored(true)
    }
  }, [])

  useEffect(() => {
    if (!isRestored) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, turns } satisfies StoredSession))
    } catch {
      setError('No se pudo guardar la conversación en este navegador.')
    }
  }, [isRestored, messages, turns])

  const lastMessage = messages.at(-1)
  const isWaiting = isBusy && lastMessage?.role === 'user'
  const sessionTotal = turns.reduce((sum, turn) => sum + turn.totalTokens, 0)

  async function handleSend(text: string) {
    const content = text.trim()
    if (!content || isBusy || !isRestored) return

    setError(null)
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    }
    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setIsBusy(true)

    const currentRequest = ++requestId.current
    const controller = new AbortController()
    abortController.current = controller
    const startedAt = Date.now()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: conversation.map(({ role, content: messageContent }) => ({
            role,
            content: messageContent,
          })),
        }),
        signal: controller.signal,
      })

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new Error('El servidor devolvió una respuesta que no se pudo interpretar.')
      }

      if (!response.ok) throw new Error(getApiError(payload))
      if (!isRecord(payload) || typeof payload.message !== 'string' || !isRecord(payload.metadata)) {
        throw new Error('El servidor devolvió una respuesta con formato inválido.')
      }

      if (currentRequest !== requestId.current) return

      const metadata = payload.metadata
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.message,
        metadata: {
          model: typeof metadata.model === 'string' ? metadata.model : model,
          createdAt: typeof metadata.createdAt === 'number' ? metadata.createdAt : Date.now(),
          promptTokens: typeof metadata.promptTokens === 'number' ? metadata.promptTokens : 0,
          completionTokens: typeof metadata.completionTokens === 'number' ? metadata.completionTokens : 0,
          totalTokens: typeof metadata.totalTokens === 'number' ? metadata.totalTokens : 0,
          responseTimeMs:
            typeof metadata.responseTimeMs === 'number' ? metadata.responseTimeMs : Date.now() - startedAt,
          tokensPerSecond: typeof metadata.tokensPerSecond === 'number' ? metadata.tokensPerSecond : 0,
        },
      }
      setMessages((previous) => [...previous, assistantMessage])
      setTurns((previous) => [
        ...previous,
        {
          id: assistantMessage.id,
          model: assistantMessage.metadata?.model ?? model,
          promptTokens: assistantMessage.metadata?.promptTokens ?? 0,
          completionTokens: assistantMessage.metadata?.completionTokens ?? 0,
          totalTokens: assistantMessage.metadata?.totalTokens ?? 0,
          responseTimeMs: assistantMessage.metadata?.responseTimeMs ?? 0,
          tokensPerSecond: assistantMessage.metadata?.tokensPerSecond ?? 0,
        },
      ])
    } catch (requestError) {
      if (currentRequest !== requestId.current) return
      if (requestError instanceof Error && requestError.name === 'AbortError') return
      setError(requestError instanceof Error ? requestError.message : 'Ocurrió un error inesperado.')
    } finally {
      if (currentRequest === requestId.current) {
        setIsBusy(false)
        abortController.current = null
      }
    }
  }

  function handleClear() {
    requestId.current += 1
    abortController.current?.abort()
    abortController.current = null
    setIsBusy(false)
    setError(null)
    setMessages([])
    setTurns([])
    localStorage.removeItem(STORAGE_KEY)
  }

  function handleResetStats() {
    setTurns([])
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">Token Lab</h1>
              <p className="text-xs text-muted-foreground">Chat con métricas de consumo</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="model-select" className="sr-only">Modelo</label>
            <select
              id="model-select"
              value={model}
              onChange={(event) => setModel(event.target.value as ModelId)}
              disabled={isBusy}
              className="h-8 rounded-lg border border-input bg-card px-2 font-mono text-xs text-foreground outline-none focus-visible:border-ring disabled:opacity-50"
            >
              {MODELS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={handleClear} disabled={messages.length === 0 && turns.length === 0 && !isBusy}>
              <Trash2 />
              <span className="hidden sm:inline">Borrar conversación</span>
              <span className="sr-only sm:hidden">Borrar conversación</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setStatsOpen(true)}
              aria-expanded={statsOpen}
              aria-controls="stats-panel"
            >
              <BarChart3 />
              <span className="font-mono tabular-nums">{formatInt(sessionTotal)}</span>
              <span className="sr-only">tokens. Ver estadísticas</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isWaiting={isWaiting} onPickSuggestion={handleSend} />
        </main>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
          {error && (
            <div role="alert" className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <ChatInput isBusy={isBusy || !isRestored} onSend={handleSend} onStop={() => abortController.current?.abort()} />
        </div>
      </div>

      <aside
        id="stats-panel"
        aria-label="Estadísticas de consumo de tokens"
        className="hidden w-80 shrink-0 border-l border-border bg-sidebar lg:block xl:w-96"
      >
        <StatsSidebar turns={turns} currentModel={model} onReset={handleResetStats} />
      </aside>

      {statsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Estadísticas de consumo de tokens">
          <button type="button" className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setStatsOpen(false)} aria-label="Cerrar estadísticas" />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm border-l border-border bg-sidebar">
            <StatsSidebar turns={turns} currentModel={model} onReset={handleResetStats} onClose={() => setStatsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

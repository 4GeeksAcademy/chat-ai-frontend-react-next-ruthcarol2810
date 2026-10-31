'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { BarChart3, Trash2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatInput } from '@/components/chat/chat-input'
import { MessageList } from '@/components/chat/message-list'
import { StatsSidebar } from '@/components/chat/stats-sidebar'
import { DEFAULT_MODEL, MODELS, type ChatMessage, type ModelId, type TurnStats } from '@/lib/chat-types'
import { formatInt } from '@/lib/format'

const transport = new DefaultChatTransport<ChatMessage>({ api: '/api/chat' })

export function ChatApp() {
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL)
  const [turns, setTurns] = useState<TurnStats[]>([])
  const [statsOpen, setStatsOpen] = useState(false)

  const { messages, sendMessage, setMessages, status, stop, error, clearError } = useChat<ChatMessage>({
    transport,
    onFinish: ({ message }) => {
      const meta = message.metadata
      if (meta?.totalTokens === undefined) return
      setTurns((previous) => [
        ...previous,
        {
          id: message.id,
          model: meta.model ?? model,
          promptTokens: meta.promptTokens ?? 0,
          completionTokens: meta.completionTokens ?? 0,
          totalTokens: meta.totalTokens ?? 0,
          responseTimeMs: meta.responseTimeMs ?? 0,
          timeToFirstTokenMs: meta.timeToFirstTokenMs,
          tokensPerSecond: meta.tokensPerSecond ?? 0,
        },
      ])
    },
  })

  const isBusy = status === 'submitted' || status === 'streaming'
  const lastMessage = messages.at(-1)
  const lastHasText =
    lastMessage?.role === 'assistant' &&
    lastMessage.parts.some((part) => part.type === 'text' && part.text.length > 0)
  const isWaiting = isBusy && !lastHasText
  const sessionTotal = turns.reduce((sum, turn) => sum + turn.totalTokens, 0)

  function handleSend(text: string) {
    clearError()
    sendMessage({ text }, { body: { model } })
  }

  function handleClear() {
    stop()
    clearError()
    setMessages([])
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
            <label htmlFor="model-select" className="sr-only">
              Modelo
            </label>
            <select
              id="model-select"
              value={model}
              onChange={(event) => setModel(event.target.value as ModelId)}
              disabled={isBusy}
              className="h-8 rounded-lg border border-input bg-card px-2 font-mono text-xs text-foreground outline-none focus-visible:border-ring disabled:opacity-50"
            >
              {MODELS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={messages.length === 0}
            >
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
          <MessageList
            messages={messages}
            isWaiting={isWaiting}
            onPickSuggestion={handleSend}
          />
        </main>

        <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
          {error && (
            <div
              role="alert"
              className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              Error al contactar con el modelo: {error.message}
            </div>
          )}
          <ChatInput isBusy={isBusy} onSend={handleSend} onStop={stop} />
        </div>
      </div>

      <aside
        id="stats-panel"
        aria-label="Estadísticas de consumo de tokens"
        className="hidden w-80 shrink-0 border-l border-border bg-sidebar lg:block xl:w-96"
      >
        <StatsSidebar turns={turns} currentModel={model} onReset={() => setTurns([])} />
      </aside>

      {statsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Estadísticas de consumo de tokens">
          <button
            type="button"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setStatsOpen(false)}
            aria-label="Cerrar estadísticas"
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm border-l border-border bg-sidebar">
            <StatsSidebar
              turns={turns}
              currentModel={model}
              onReset={() => setTurns([])}
              onClose={() => setStatsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

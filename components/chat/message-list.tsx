'use client'

import { useEffect, useRef } from 'react'
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from '@/lib/chat-types'
import { formatDecimal, formatInt, formatMs, modelLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

type MessageListProps = {
  messages: ChatMessage[]
  isWaiting: boolean
  onPickSuggestion: (text: string) => void
}

const SUGGESTIONS = [
  'Explica qué es un token en un modelo de lenguaje',
  'Resume en 3 puntos cómo funciona la atención en un transformer',
  'Escribe un haiku sobre la latencia de red',
]

export function MessageList({ messages, isWaiting, onPickSuggestion }: MessageListProps) {
  const endRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isWaiting])

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bot className="size-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-balance text-xl font-semibold">Empieza una conversación</h2>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
            Cada respuesta registra los tokens de prompt y de completado, el tiempo de respuesta y la
            velocidad de generación en el panel de estadísticas.
          </p>
        </div>
        <ul className="flex w-full max-w-md flex-col gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => onPickSuggestion(suggestion)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-ring hover:bg-accent"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <ol className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6" aria-live="polite">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isWaiting && (
        <li className="flex gap-3">
          <Avatar role="assistant" />
          <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-4 py-3">
            <span className="sr-only">La IA está pensando</span>
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                style={{ animationDelay: `${delay}ms` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </li>
      )}
      <li ref={endRef} aria-hidden="true" />
    </ol>
  )
}

function MessageItem({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  const text = message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
  const meta = message.metadata

  if (!isUser && text.length === 0) return null

  return (
    <li className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <Avatar role={isUser ? 'user' : 'assistant'} />
      <div className={cn('flex min-w-0 max-w-[85%] flex-col gap-1.5', isUser && 'items-end')}>
        <span className="text-xs font-medium text-muted-foreground">{isUser ? 'Tú' : 'Asistente'}</span>
        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm border border-border bg-card text-card-foreground',
          )}
        >
          {text}
        </div>
        {!isUser && meta?.totalTokens !== undefined && (
          <dl className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <MetaItem label="Modelo" value={modelLabel(meta.model ?? '')} />
            <MetaItem label="Prompt" value={`${formatInt(meta.promptTokens ?? 0)} tok`} />
            <MetaItem label="Completado" value={`${formatInt(meta.completionTokens ?? 0)} tok`} />
            <MetaItem label="Tiempo" value={formatMs(meta.responseTimeMs)} />
            <MetaItem label="Velocidad" value={`${formatDecimal(meta.tokensPerSecond ?? 0)} tok/s`} />
          </dl>
        )}
      </div>
    </li>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="sr-only">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  return (
    <div
      className={cn(
        'mt-5 flex size-8 shrink-0 items-center justify-center rounded-lg',
        role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/15 text-primary',
      )}
      aria-hidden="true"
    >
      {role === 'user' ? <User className="size-4" /> : <Bot className="size-4" />}
    </div>
  )
}

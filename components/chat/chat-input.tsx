'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ChatInputProps = {
  isBusy: boolean
  onSend: (text: string) => void
  onStop: () => void
}

export function ChatInput({ isBusy, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState('')
  const canSend = value.trim().length > 0 && !isBusy

  function submit() {
    if (!canSend) return
    onSend(value.trim())
    setValue('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 rounded-xl border border-input bg-card p-2 focus-within:border-ring"
    >
      <label htmlFor="chat-message" className="sr-only">
        Escribe tu mensaje
      </label>
      <textarea
        id="chat-message"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
        className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
      />
      {isBusy ? (
        <Button type="button" size="icon-lg" variant="secondary" onClick={onStop} aria-label="Detener respuesta">
          <Square className="fill-current" />
        </Button>
      ) : (
        <Button type="submit" size="icon-lg" disabled={!canSend} aria-label="Enviar mensaje">
          <ArrowUp />
        </Button>
      )}
    </form>
  )
}

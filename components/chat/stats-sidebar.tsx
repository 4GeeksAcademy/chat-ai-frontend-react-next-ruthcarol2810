'use client'

import { Activity, Clock, Gauge, RotateCcw, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TurnStats } from '@/lib/chat-types'
import { formatDecimal, formatInt, formatMs, modelLabel } from '@/lib/format'

type StatsSidebarProps = {
  turns: TurnStats[]
  currentModel: string
  onReset: () => void
  onClose?: () => void
}

export function StatsSidebar({ turns, currentModel, onReset, onClose }: StatsSidebarProps) {
  const totals = turns.reduce(
    (acc, turn) => ({
      prompt: acc.prompt + turn.promptTokens,
      completion: acc.completion + turn.completionTokens,
      total: acc.total + turn.totalTokens,
      time: acc.time + turn.responseTimeMs,
      tps: acc.tps + turn.tokensPerSecond,
    }),
    { prompt: 0, completion: 0, total: 0, time: 0, tps: 0 },
  )
  const last = turns.at(-1)
  const promptShare = totals.total > 0 ? (totals.prompt / totals.total) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">Consumo de la sesión</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={turns.length === 0}
            className="text-muted-foreground"
          >
            <RotateCcw />
            Reiniciar
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar estadísticas">
              <X />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <section aria-labelledby="total-heading" className="rounded-xl border border-border bg-card p-4">
          <h3 id="total-heading" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total combinado
          </h3>
          <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-foreground">
            {formatInt(totals.total)}
          </p>
          <p className="text-xs text-muted-foreground">
            tokens en {turns.length} {turns.length === 1 ? 'petición' : 'peticiones'}
          </p>

          <div
            className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Prompt ${formatDecimal(promptShare)}%, completado ${formatDecimal(100 - promptShare)}%`}
          >
            <div className="bg-chart-1 transition-all" style={{ width: `${promptShare}%` }} />
            <div className="bg-chart-2 transition-all" style={{ width: `${totals.total > 0 ? 100 - promptShare : 0}%` }} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <TokenStat label="Prompt" value={totals.prompt} colorClass="bg-chart-1" />
            <TokenStat label="Completado" value={totals.completion} colorClass="bg-chart-2" />
          </dl>
        </section>

        <section aria-labelledby="growth-heading" className="space-y-3">
          <h3 id="growth-heading" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acumulado por petición
          </h3>
          <AccumulationChart turns={turns} />
        </section>

        <section aria-labelledby="perf-heading" className="space-y-3">
          <h3 id="perf-heading" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Última respuesta
          </h3>
          <dl className="grid grid-cols-2 gap-2">
            <MetricCard icon={<Activity />} label="Modelo" value={modelLabel(last?.model ?? currentModel)} wide />
            <MetricCard icon={<Clock />} label="Tiempo de respuesta" value={formatMs(last?.responseTimeMs)} />
            <MetricCard icon={<Timer />} label="Primer token" value={formatMs(last?.timeToFirstTokenMs)} />
            <MetricCard
              icon={<Gauge />}
              label="Tokens / segundo"
              value={last ? formatDecimal(last.tokensPerSecond) : '—'}
            />
            <MetricCard
              icon={<Gauge />}
              label="Promedio tok/s"
              value={turns.length ? formatDecimal(totals.tps / turns.length) : '—'}
            />
          </dl>
          {turns.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tiempo medio de respuesta:{' '}
              <span className="font-mono text-foreground">{formatMs(totals.time / turns.length)}</span>
            </p>
          )}
        </section>

        <section aria-labelledby="log-heading" className="space-y-3">
          <h3 id="log-heading" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Registro de peticiones
          </h3>
          {turns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay peticiones registradas.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full font-mono text-xs tabular-nums">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-2 py-2 text-left font-medium">#</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Prompt</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Compl.</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Acum.</th>
                  </tr>
                </thead>
                <tbody>
                  {turns.map((turn, index) => {
                    const cumulative = turns
                      .slice(0, index + 1)
                      .reduce((sum, item) => sum + item.totalTokens, 0)
                    return (
                      <tr key={turn.id} className="border-t border-border">
                        <td className="px-2 py-1.5 text-muted-foreground">{index + 1}</td>
                        <td className="px-2 py-1.5 text-right">{formatInt(turn.promptTokens)}</td>
                        <td className="px-2 py-1.5 text-right">{formatInt(turn.completionTokens)}</td>
                        <td className="px-2 py-1.5 text-right text-primary">{formatInt(cumulative)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function TokenStat({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={`size-2 rounded-full ${colorClass}`} aria-hidden="true" />
        {label}
      </dt>
      <dd className="font-mono text-lg font-medium tabular-nums">{formatInt(value)}</dd>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  wide,
}: {
  icon: React.ReactNode
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-3 ${wide ? 'col-span-2' : ''}`}>
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-sm font-medium">{value}</dd>
    </div>
  )
}

function AccumulationChart({ turns }: { turns: TurnStats[] }) {
  if (turns.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        El gráfico aparecerá tras la primera respuesta
      </div>
    )
  }

  let runningPrompt = 0
  let runningCompletion = 0
  const points = turns.map((turn) => {
    runningPrompt += turn.promptTokens
    runningCompletion += turn.completionTokens
    return { id: turn.id, prompt: runningPrompt, completion: runningCompletion }
  })
  const max = Math.max(...points.map((point) => point.prompt + point.completion), 1)
  const visible = points.slice(-16)
  const offset = points.length - visible.length

  return (
    <figure className="rounded-lg border border-border bg-card p-3">
      <div className="flex h-32 items-end gap-1" role="img" aria-label={`Tokens acumulados tras ${turns.length} peticiones: ${formatInt(max)}`}>
        {visible.map((point, index) => {
          const total = point.prompt + point.completion
          return (
            <div
              key={point.id}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`#${offset + index + 1}: ${formatInt(total)} tokens acumulados`}
            >
              <div className="flex flex-col overflow-hidden rounded-sm" style={{ height: `${(total / max) * 100}%` }}>
                <div className="bg-chart-2" style={{ flexGrow: point.completion }} />
                <div className="bg-chart-1" style={{ flexGrow: point.prompt }} />
              </div>
            </div>
          )
        })}
      </div>
      <figcaption className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>#{offset + 1}</span>
        <span>{formatInt(max)} tok</span>
        <span>#{points.length}</span>
      </figcaption>
    </figure>
  )
}

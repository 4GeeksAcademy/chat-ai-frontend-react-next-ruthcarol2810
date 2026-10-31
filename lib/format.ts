const integerFormatter = new Intl.NumberFormat('es-ES')
const decimalFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })

export function formatInt(value: number) {
  return integerFormatter.format(Math.round(value))
}

export function formatDecimal(value: number) {
  return decimalFormatter.format(value)
}

export function formatMs(value: number | undefined) {
  if (value === undefined) return '—'
  if (value < 1000) return `${formatInt(value)} ms`
  return `${formatDecimal(value / 1000)} s`
}

export function modelLabel(id: string) {
  return id.includes('/') ? id.split('/')[1] : id
}

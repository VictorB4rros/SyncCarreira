/**
 * @file format.ts
 * @description Formatação de datas e números da área do aluno.
 *
 * - Instant (com "Z" ou offset) é exibido no fuso da instituição.
 * - LocalDateTime (sem fuso) já está no fuso da instituição: é exibido sem conversão,
 *   para o horário da sessão não mudar conforme o computador do aluno.
 */

export const INSTITUTION_TIME_ZONE: string =
  (import.meta.env?.VITE_TIME_ZONE as string | undefined) || 'America/Sao_Paulo'

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

/** Lê "2026-10-26T14:30:00" como horário de parede (sem fuso). */
function parseWallClock(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value)
  if (!match) return null
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = match
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)))
}

/** Converte qualquer data da API em { date, timeZone } prontos para Intl. */
function toZoned(value: string | null | undefined): { date: Date; timeZone: string } | null {
  if (!value) return null
  if (HAS_ZONE.test(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : { date, timeZone: INSTITUTION_TIME_ZONE }
  }
  const date = parseWallClock(value)
  return date ? { date, timeZone: 'UTC' } : null
}

function format(value: string | null | undefined, options: Intl.DateTimeFormatOptions, fallback = '—') {
  const zoned = toZoned(value)
  if (!zoned) return fallback
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: zoned.timeZone }).format(zoned.date)
}

/** 14/10/2025 */
export function formatDate(value: string | null | undefined, fallback = '—'): string {
  return format(value, { day: '2-digit', month: '2-digit', year: 'numeric' }, fallback)
}

/** 22 de outubro de 2025 */
export function formatLongDate(value: string | null | undefined, fallback = '—'): string {
  return format(value, { day: 'numeric', month: 'long', year: 'numeric' }, fallback)
}

/** 14/10/2025 às 14:30 */
export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  const zoned = toZoned(value)
  if (!zoned) return fallback
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: zoned.timeZone,
  }).format(zoned.date)
  return `${date} às ${formatTime(value)}`
}

/** 14:30 */
export function formatTime(value: string | null | undefined, fallback = '—'): string {
  return format(value, { hour: '2-digit', minute: '2-digit', hour12: false }, fallback)
}

/** qua., 29/10 */
export function formatWeekdayDate(value: string | null | undefined, fallback = '—'): string {
  return format(value, { weekday: 'short', day: '2-digit', month: '2-digit' }, fallback)
}

/** Horário "de parede" atual no fuso da instituição, no formato "yyyy-MM-ddTHH:mm:ss". */
export function institutionNowWallClock(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: INSTITUTION_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}:${get('second')}`
}

/** Normaliza LocalDateTime para comparação textual ("2026-10-26T14:30" → "2026-10-26T14:30:00"). */
function normalizeWallClock(value: string): string {
  const base = value.slice(0, 19)
  return base.length === 16 ? `${base}:00` : base
}

/** true se o LocalDateTime da sessão ainda não passou (considerando a duração). */
export function isUpcoming(dateTime: string, durationMinutes = 0, now: Date = new Date()): boolean {
  const start = parseWallClock(dateTime)
  if (!start) return false
  const end = new Date(start.getTime() + Math.max(durationMinutes, 0) * 60_000)
  const endIso = end.toISOString().slice(0, 19)
  return normalizeWallClock(endIso) > institutionNowWallClock(now)
}

/** "Hoje", "Amanhã" ou a data curta, para o resumo da próxima sessão. */
export function relativeDayLabel(dateTime: string, now: Date = new Date()): string {
  const day = dateTime.slice(0, 10)
  const today = institutionNowWallClock(now).slice(0, 10)
  const tomorrowDate = parseWallClock(today)
  if (tomorrowDate) tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1)
  const tomorrow = tomorrowDate?.toISOString().slice(0, 10)
  if (day === today) return 'Hoje'
  if (day === tomorrow) return 'Amanhã'
  return formatWeekdayDate(dateTime)
}

/** 1.5 → "1,5" */
export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: digits })
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

/** Só permite links http(s) (evita "javascript:" vindo de dados cadastrados). */
export function safeExternalUrl(url: string | null | undefined): string | null {
  const value = (url ?? '').trim()
  return /^https?:\/\/\S+$/i.test(value) ? value : null
}

/** Hostname legível de uma URL ("https://www.gov.br/x" → "gov.br"). */
export function hostnameOf(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

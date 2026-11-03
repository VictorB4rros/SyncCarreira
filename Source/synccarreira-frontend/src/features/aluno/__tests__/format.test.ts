import { describe, expect, it } from 'vitest'
import {
  clampPercent,
  formatDate,
  formatDateTime,
  formatNumber,
  formatTime,
  hostnameOf,
  institutionNowWallClock,
  isUpcoming,
  relativeDayLabel,
  safeExternalUrl,
} from '../lib/format'

describe('datas da API', () => {
  it('Instant (UTC) é exibido no fuso da instituição', () => {
    // 02:30Z = 23:30 do dia anterior em São Paulo
    expect(formatDate('2026-10-15T02:30:00Z')).toBe('14/10/2026')
    expect(formatTime('2026-10-15T02:30:00Z')).toBe('23:30')
  })

  it('LocalDateTime (sem fuso) é exibido sem conversão', () => {
    expect(formatDateTime('2026-10-30T14:30:00')).toBe('30/10/2026 às 14:30')
  })

  it('valores vazios ou inválidos usam o fallback', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('não é data', 'sem data')).toBe('sem data')
  })

  it('institutionNowWallClock converte o instante atual para São Paulo', () => {
    expect(institutionNowWallClock(new Date('2026-10-29T15:00:00Z'))).toBe('2026-10-29T12:00:00')
  })

  it('isUpcoming considera o fim da sessão', () => {
    const now = new Date('2026-10-29T15:00:00Z') // 12:00 SP
    expect(isUpcoming('2026-10-29T11:30:00', 45, now)).toBe(true)
    expect(isUpcoming('2026-10-29T11:00:00', 45, now)).toBe(false)
  })

  it('relativeDayLabel usa Hoje/Amanhã', () => {
    const now = new Date('2026-10-29T15:00:00Z')
    expect(relativeDayLabel('2026-10-29T18:00:00', now)).toBe('Hoje')
    expect(relativeDayLabel('2026-10-30T09:00:00', now)).toBe('Amanhã')
    expect(relativeDayLabel('2026-11-03T09:00:00', now)).toMatch(/03\/11/)
  })
})

describe('números e links', () => {
  it('formatNumber usa vírgula decimal', () => {
    expect(formatNumber(4.5)).toBe('4,5')
    expect(formatNumber(null)).toBe('—')
  })

  it('clampPercent limita entre 0 e 100', () => {
    expect(clampPercent(140)).toBe(100)
    expect(clampPercent(-3)).toBe(0)
    expect(clampPercent(Number.NaN)).toBe(0)
  })

  it('safeExternalUrl só aceita http(s)', () => {
    expect(safeExternalUrl(' https://gov.br/sisu ')).toBe('https://gov.br/sisu')
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull()
    expect(safeExternalUrl(null)).toBeNull()
  })

  it('hostnameOf remove o www', () => {
    expect(hostnameOf('https://www.gov.br/x')).toBe('gov.br')
    expect(hostnameOf('url ruim')).toBe('url ruim')
  })
})

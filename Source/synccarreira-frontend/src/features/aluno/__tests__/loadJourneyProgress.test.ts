import { beforeEach, describe, expect, it, vi } from 'vitest'
import { answerFor, makeQuestion, makeSynthesis, trails } from '../test/fixtures'

vi.mock('../api/studentApi', () => ({
  getTrails: vi.fn(),
  getMySyntheses: vi.fn(),
  canAccessTrail: vi.fn(),
  getTrailQuestions: vi.fn(),
  getMyAnswers: vi.fn(),
}))

import * as api from '../api/studentApi'
import { loadJourneyProgress } from '../api/loadJourneyProgress'

const sorted = [...trails].sort((a, b) => (a.sequentialOrder ?? 0) - (b.sequentialOrder ?? 0))
const [auto, influencias] = sorted

beforeEach(() => {
  vi.mocked(api.getTrails).mockResolvedValue(sorted)
  vi.mocked(api.getMySyntheses).mockResolvedValue([makeSynthesis(auto)])
  vi.mocked(api.canAccessTrail).mockImplementation(async id => id === auto.id || id === influencias.id)
  vi.mocked(api.getTrailQuestions).mockImplementation(async id => [makeQuestion(id * 10, 'CHECKBOX', [id * 100, id * 100 + 1], id)])
  vi.mocked(api.getMyAnswers).mockImplementation(async id => (id === auto.id ? [answerFor(auto.id * 100)] : []))
})

describe('loadJourneyProgress', () => {
  it('monta o status de cada pilar respeitando o bloqueio sequencial', async () => {
    const { trails: progress, summary } = await loadJourneyProgress()
    expect(progress.map(p => p.status)).toEqual(['CONCLUDED', 'AVAILABLE', 'LOCKED', 'LOCKED'])
    expect(summary.current?.trail.id).toBe(influencias.id)
    expect(summary.percentage).toBe(25)
  })

  it('não chama perguntas/respostas de trilhas bloqueadas (o backend devolveria 403)', async () => {
    await loadJourneyProgress()
    expect(api.getTrailQuestions).toHaveBeenCalledTimes(2)
    expect(api.getMyAnswers).toHaveBeenCalledTimes(2)
    expect(api.getTrailQuestions).not.toHaveBeenCalledWith(3)
    expect(api.getTrailQuestions).not.toHaveBeenCalledWith(4)
  })

  it('propaga falhas para a tela mostrar o erro', async () => {
    vi.mocked(api.getTrails).mockRejectedValue(new Error('offline'))
    await expect(loadJourneyProgress()).rejects.toThrow('offline')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { httpError, makeResult } from '../test/fixtures'
import { makeStudentContext, renderWithStudent } from '../test/render'
import type { JourneyRecordDTO } from '../types'

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getCurrentResult: vi.fn(),
  getJourneyResult: vi.fn(),
  getJourneyHistory: vi.fn(),
  getMyDoubt: vi.fn(),
  flagDoubt: vi.fn(),
  startNewJourney: vi.fn(),
  downloadJourneyPdf: vi.fn(),
}))

import * as api from '../api/studentApi'
import ResultsPage from '../pages/ResultsPage'

const record: JourneyRecordDTO = {
  id: 11,
  journeyNumber: 1,
  startedAt: '2026-03-10T12:00:00Z',
  concludedAt: '2026-10-22T15:00:00Z',
  schoolClassName: '3º Ano A',
  schoolYear: 2026,
  institutionName: 'Colégio',
  humanitiesScore: 78,
  exactSciencesScore: 92,
  biologicalSciencesScore: 42,
  artsScore: 65,
  affinities: { humanities: 4, exactSciences: 5, biologicalSciences: 2, arts: 3 },
  highestScoreAreas: ['EXATAS'],
  inDoubt: false,
  doubtFlaggedAt: null,
}

function renderPage(route = '/aluno/resultados', context = makeStudentContext()) {
  return renderWithStudent(<ResultsPage />, { route, path: route.includes('/resultados/') ? '/aluno/resultados/:journeyId' : '/aluno/resultados', context })
}

beforeEach(() => {
  vi.mocked(api.getCurrentResult).mockResolvedValue(makeResult())
  vi.mocked(api.getJourneyHistory).mockResolvedValue([record])
  vi.mocked(api.getMyDoubt).mockResolvedValue({ studentId: 7, inDoubt: false, doubtFlaggedAt: null })
  vi.mocked(api.downloadJourneyPdf).mockResolvedValue('jornada-1.pdf')
})

describe('ResultsPage', () => {
  it('jornada não concluída (422) mostra o estado vazio, não um erro', async () => {
    vi.mocked(api.getCurrentResult).mockRejectedValue(httpError(422, 'Conclua a jornada.'))
    vi.mocked(api.getJourneyHistory).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Seu resultado aparece ao concluir os 4 pilares')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra as áreas em ordem de afinidade, com o aviso de não diagnóstico', async () => {
    renderPage()
    const region = await screen.findByRole('region', { name: 'Distribuição de afinidade por área' })
    const headings = within(region).getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(headings).toEqual(['Exatas', 'Humanas', 'Artes', 'Biológicas'])
    expect(within(region).getByText('Maior afinidade')).toBeInTheDocument()
    expect(screen.getByText(/não é um diagnóstico fechado/)).toBeInTheDocument()
    expect(screen.getByText('Engenharia de Software')).toBeInTheDocument()
  })

  it('baixa o PDF da jornada exibida', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Baixar relatório em PDF/ }))
    expect(api.downloadJourneyPdf).toHaveBeenCalledWith(11, 1)
  })

  it('sinaliza dúvida para a psicóloga', async () => {
    vi.mocked(api.flagDoubt).mockResolvedValue({ studentId: 7, inDoubt: true, doubtFlaggedAt: '2026-10-25T13:00:00Z' })
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Sinalizar dúvida/ }))
    expect(api.flagDoubt).toHaveBeenCalled()
    expect(await screen.findByText('Dúvida sinalizada')).toBeInTheDocument()
    expect(screen.getByText('Notificação enviada com sucesso')).toBeInTheDocument()
  })

  it('nova jornada pede confirmação antes de chamar a API', async () => {
    vi.mocked(api.startNewJourney).mockResolvedValue({ currentJourneyNumber: 2, currentJourneyStartedAt: null, currentJourneyConcluded: false, concludedJourneys: 1 })
    const context = makeStudentContext()
    renderPage('/aluno/resultados', context)
    await userEvent.click(await screen.findByRole('button', { name: 'Iniciar nova jornada' }))
    expect(api.startNewJourney).not.toHaveBeenCalled()
    const dialog = screen.getByRole('dialog', { name: 'Iniciar uma nova jornada?' })
    await userEvent.click(within(dialog).getByRole('button', { name: /Sim, iniciar/ }))
    expect(api.startNewJourney).toHaveBeenCalled()
    expect(context.refreshJourney).toHaveBeenCalled()
  })

  it('resultado do histórico não oferece nova jornada nem sinalização de dúvida', async () => {
    vi.mocked(api.getJourneyResult).mockResolvedValue(makeResult())
    renderPage('/aluno/resultados/11')
    expect(await screen.findByText('Resultado de uma jornada anterior')).toBeInTheDocument()
    expect(api.getJourneyResult).toHaveBeenCalledWith(11)
    expect(screen.queryByRole('button', { name: 'Iniciar nova jornada' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Sinalizar dúvida/ })).not.toBeInTheDocument()
    expect(screen.getByText('Visualizando')).toBeInTheDocument()
  })
})

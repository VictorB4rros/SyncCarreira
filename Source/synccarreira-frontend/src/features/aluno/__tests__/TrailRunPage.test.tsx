import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { answerFor, httpError, makeQuestion, makeSynthesis, trails } from '../test/fixtures'
import { renderWithStudent } from '../test/render'

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getTrails: vi.fn(),
  canAccessTrail: vi.fn(),
  getTrailQuestions: vi.fn(),
  getMyAnswers: vi.fn(),
  getMySyntheses: vi.fn(),
  checkOption: vi.fn(),
  uncheckOption: vi.fn(),
  submitSynthesis: vi.fn(),
  getMyInformationTrail: vi.fn(),
}))

import * as api from '../api/studentApi'
import TrailRunPage from '../pages/TrailRunPage'

const sorted = [...trails].sort((a, b) => (a.sequentialOrder ?? 0) - (b.sequentialOrder ?? 0))
const auto = sorted[0]
const single = makeQuestion(1, 'CHECKBOX', [11, 12])
const multiple = makeQuestion(2, 'MULTIPLA_ESCOLHA', [21, 22])

function renderTrail(trailId = auto.id) {
  return renderWithStudent(<TrailRunPage />, { route: `/aluno/trilhas/${trailId}`, path: '/aluno/trilhas/:trailId' })
}

beforeEach(() => {
  vi.mocked(api.getTrails).mockResolvedValue(sorted)
  vi.mocked(api.canAccessTrail).mockResolvedValue(true)
  vi.mocked(api.getTrailQuestions).mockResolvedValue([single, multiple])
  vi.mocked(api.getMyAnswers).mockResolvedValue([])
  vi.mocked(api.getMySyntheses).mockResolvedValue([])
  vi.mocked(api.checkOption).mockResolvedValue(answerFor(11))
  vi.mocked(api.uncheckOption).mockResolvedValue(undefined)
})

describe('TrailRunPage', () => {
  it('mostra a tela de bloqueio quando o pilar não está liberado', async () => {
    vi.mocked(api.canAccessTrail).mockResolvedValue(false)
    renderTrail(sorted[1].id)
    expect(await screen.findByText(/Pilar 02 ainda está bloqueado/)).toBeInTheDocument()
    expect(screen.getByText(/síntese do Pilar 01/)).toBeInTheDocument()
    expect(api.getTrailQuestions).not.toHaveBeenCalled()
  })

  it('restaura as respostas salvas e calcula o progresso', async () => {
    vi.mocked(api.getMyAnswers).mockResolvedValue([answerFor(12)])
    renderTrail()
    expect(await screen.findByText('1 de 2 questões respondidas (50%)')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Opção 2' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText(/Faltam 1 pergunta/)).toBeInTheDocument()
  })

  it('salva a resposta e libera a síntese ao responder tudo', async () => {
    renderTrail()
    await userEvent.click(await screen.findByRole('radio', { name: 'Opção 1' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Opção 2' }))

    expect(api.checkOption).toHaveBeenCalledWith(11)
    expect(api.checkOption).toHaveBeenCalledWith(22)
    expect(await screen.findByRole('heading', { name: 'Síntese reflexiva do pilar' })).toBeInTheDocument()
  })

  it('desmarca opção de múltipla escolha com DELETE', async () => {
    vi.mocked(api.getMyAnswers).mockResolvedValue([answerFor(21)])
    renderTrail()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Opção 1' }))
    expect(api.uncheckOption).toHaveBeenCalledWith(21)
    expect(screen.getByRole('checkbox', { name: 'Opção 1' })).toHaveAttribute('aria-checked', 'false')
  })

  it('desfaz a seleção e mostra o erro quando o salvamento falha', async () => {
    vi.mocked(api.checkOption).mockRejectedValue(httpError(403, 'Trilha não liberada.'))
    renderTrail()
    const option = await screen.findByRole('radio', { name: 'Opção 1' })
    await userEvent.click(option)
    expect(await screen.findByText('Trilha não liberada.')).toBeInTheDocument()
    expect(option).toHaveAttribute('aria-checked', 'false')
  })

  it('valida e envia a síntese, entrando em modo revisão', async () => {
    vi.mocked(api.getMyAnswers).mockResolvedValue([answerFor(11), answerFor(21)])
    const saved = makeSynthesis(auto, { content: 'Aprendi muito sobre mim.' })
    vi.mocked(api.submitSynthesis).mockResolvedValue(saved)
    const { context } = renderTrail()

    const send = await screen.findByRole('button', { name: 'Enviar síntese' })
    await userEvent.click(send)
    expect(screen.getByText('Escreva a sua síntese antes de enviar.')).toBeInTheDocument()
    expect(api.submitSynthesis).not.toHaveBeenCalled()

    await userEvent.type(screen.getByLabelText(/Síntese do Pilar 01/), 'Aprendi muito sobre mim.')
    await userEvent.click(send)

    expect(api.submitSynthesis).toHaveBeenCalledWith({ trailId: auto.id, content: 'Aprendi muito sobre mim.' })
    expect(await screen.findByText('Pilar concluído')).toBeInTheDocument()
    expect(context.refreshJourney).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /Ir para o Pilar 02/ })).toHaveAttribute('href', `/aluno/trilhas/${sorted[1].id}`)
    // modo revisão: respostas travadas
    expect(screen.getByRole('radio', { name: 'Opção 1' })).toBeDisabled()
  })

  it('pilar já concluído abre em modo revisão com a síntese enviada', async () => {
    vi.mocked(api.getMyAnswers).mockResolvedValue([answerFor(11), answerFor(22)])
    vi.mocked(api.getMySyntheses).mockResolvedValue([makeSynthesis(auto)])
    renderTrail()
    expect(await screen.findByText('Modo revisão')).toBeInTheDocument()
    const section = screen.getByRole('heading', { name: 'Sua síntese deste pilar' }).closest('section') as HTMLElement
    expect(within(section).getByText('Minha síntese do pilar 1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: 'Opção 2' }))
    expect(api.checkOption).not.toHaveBeenCalled()
  })

  it('pilar final (Informação) mostra os materiais e a síntese final', async () => {
    const info = sorted[3]
    vi.mocked(api.getTrailQuestions).mockResolvedValue([])
    vi.mocked(api.getMyInformationTrail).mockResolvedValue({
      recommendedAreas: ['EXATAS'],
      score: null,
      areaScores: [],
      careerLinks: [{ id: 1, topic: 'Carreiras em TI', url: 'https://techcareers.org.br', knowledgeArea: 'EXATAS' }],
      universityAccessLinks: [{ id: 2, topic: 'Portal do Sisu', url: 'https://acessounico.mec.gov.br/sisu', knowledgeArea: null }],
    })
    renderTrail(info.id)
    expect(await screen.findByText('Carreiras em TI')).toBeInTheDocument()
    expect(screen.getByText('Portal do Sisu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar síntese final' })).toBeInTheDocument()
  })

  it('mostra erro com opção de tentar de novo', async () => {
    vi.mocked(api.getTrails).mockRejectedValueOnce(httpError(500, ''))
    renderTrail()
    expect(await screen.findByText(/servidor encontrou um erro/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    await waitFor(() => expect(screen.getByText('Pergunta 1?')).toBeInTheDocument())
  })
})

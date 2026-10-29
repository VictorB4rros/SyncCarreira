import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { httpError, makeFeedback } from '../test/fixtures'
import { renderWithStudent } from '../test/render'

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getMyFeedbacks: vi.fn(),
  markFeedbackAsRead: vi.fn(),
}))

import { getMyFeedbacks, markFeedbackAsRead } from '../api/studentApi'
import FeedbacksPage from '../pages/FeedbacksPage'

const journeyFeedback = makeFeedback({ id: 1, content: 'Parabéns pela jornada!' })
const sessionFeedback = makeFeedback({
  id: 2,
  type: 'SESSAO',
  journeyNumber: null,
  appointmentId: 5,
  appointmentTitle: 'Sessão individual',
  appointmentDateTime: '2026-10-20T14:00:00',
  content: 'Trabalhamos a ansiedade do vestibular.',
  createdAt: '2026-10-21T10:00:00Z',
  read: true,
  readAt: '2026-10-21T12:00:00Z',
})

function renderPage(route = '/aluno/feedbacks') {
  return renderWithStudent(<FeedbacksPage />, { route, path: '/aluno/feedbacks' })
}

beforeEach(() => {
  vi.mocked(getMyFeedbacks).mockResolvedValue([sessionFeedback, journeyFeedback])
  vi.mocked(markFeedbackAsRead).mockImplementation(async id => ({ ...journeyFeedback, id, read: true, readAt: '2026-10-25T10:00:00Z' }))
})

describe('FeedbacksPage', () => {
  it('lista os feedbacks do mais recente para o mais antigo e sincroniza o contador', async () => {
    const { context } = renderPage()
    const items = await screen.findAllByRole('button', { name: /Devolutiva da Jornada|Sessão:/ })
    expect(items[0]).toHaveTextContent('Devolutiva da Jornada #1')
    expect(items[1]).toHaveTextContent('Sessão: Sessão individual')
    expect(context.setUnreadFeedbacks).toHaveBeenCalledWith(1)
  })

  it('filtra por não lidas', async () => {
    renderPage()
    await screen.findByText('Sessão: Sessão individual')
    await userEvent.click(screen.getByRole('button', { name: /Não lidas/ }))
    expect(screen.queryByText('Sessão: Sessão individual')).not.toBeInTheDocument()
    expect(screen.getByText('Devolutiva da Jornada #1')).toBeInTheDocument()
  })

  it('abrir um feedback não lido marca como lido', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: /Devolutiva da Jornada #1/ }))
    expect(await screen.findByRole('heading', { name: 'Devolutiva da Jornada #1' })).toBeInTheDocument()
    // O texto também aparece na prévia da lista: confere dentro do painel de leitura
    const reader = screen.getByRole('region', { name: 'Leitura do feedback' })
    expect(within(reader).getByText('Parabéns pela jornada!')).toBeInTheDocument()
    await waitFor(() => expect(markFeedbackAsRead).toHaveBeenCalledWith(1))
  })

  it('feedback já lido não chama o PATCH de novo', async () => {
    renderPage('/aluno/feedbacks?id=2')
    expect(await screen.findByRole('heading', { name: 'Sessão: Sessão individual' })).toBeInTheDocument()
    expect(markFeedbackAsRead).not.toHaveBeenCalled()
  })

  it('se o PATCH falhar, volta para não lido sem tentar em loop', async () => {
    vi.mocked(markFeedbackAsRead).mockRejectedValue(httpError(500))
    renderPage('/aluno/feedbacks?id=1')
    await screen.findByRole('heading', { name: 'Devolutiva da Jornada #1' })
    await waitFor(() => expect(screen.getByText('Não lido')).toBeInTheDocument())
    expect(markFeedbackAsRead).toHaveBeenCalledTimes(1)
  })

  it('estado vazio quando não há feedbacks', async () => {
    vi.mocked(getMyFeedbacks).mockResolvedValue([])
    renderPage()
    expect(await screen.findByText('Nenhum feedback por enquanto')).toBeInTheDocument()
  })
})
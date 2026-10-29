import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { httpError, makeAppointment } from '../test/fixtures'
import { renderWithStudent } from '../test/render'
import type { InformationTrailDTO } from '../types'

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getMyInformationTrail: vi.fn(),
  getMyAppointments: vi.fn(),
}))

import { getMyAppointments, getMyInformationTrail } from '../api/studentApi'
import ContentHubPage, { filterLinks } from '../pages/ContentHubPage'
import SessionsPage from '../pages/SessionsPage'

const trail: InformationTrailDTO = {
  recommendedAreas: ['EXATAS', 'HUMANAS'],
  score: null,
  areaScores: [{ area: 'EXATAS', areaName: 'Exatas', score: 9, maxScore: 10, percentage: 90, highlighted: true }],
  careerLinks: [
    { id: 1, topic: 'Futuro das profissões em Tecnologia', url: 'https://techcareers.org.br', knowledgeArea: 'EXATAS' },
    { id: 2, topic: 'Âncoras de carreira em Humanas', url: 'https://ancoras.ufrj.br', knowledgeArea: 'HUMANAS' },
  ],
  universityAccessLinks: [{ id: 3, topic: 'Portal do Sisu', url: 'https://acessounico.mec.gov.br/sisu', knowledgeArea: null }],
}

describe('Hub de Conteúdos', () => {
  beforeEach(() => {
    vi.mocked(getMyInformationTrail).mockResolvedValue(trail)
  })

  it('filterLinks filtra por área, universidade e busca sem acento', () => {
    const all = [...trail.careerLinks, ...trail.universityAccessLinks]
    expect(filterLinks(all, 'EXATAS', '').map(l => l.id)).toEqual([1])
    expect(filterLinks(all, 'UNIVERSIDADE', '').map(l => l.id)).toEqual([3])
    expect(filterLinks(all, 'TODOS', 'ancoras').map(l => l.id)).toEqual([2])
  })

  it('lista os links e filtra pela categoria escolhida', async () => {
    renderWithStudent(<ContentHubPage />)
    expect(await screen.findByText('Futuro das profissões em Tecnologia')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Acesso à universidade/ }))
    expect(screen.queryByText('Futuro das profissões em Tecnologia')).not.toBeInTheDocument()
    expect(screen.getByText('Portal do Sisu')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Acessar link/ })).toHaveAttribute('href', 'https://acessounico.mec.gov.br/sisu')
  })

  it('busca sem resultados mostra estado vazio', async () => {
    renderWithStudent(<ContentHubPage />)
    await userEvent.type(await screen.findByRole('searchbox', { name: 'Buscar conteúdos' }), 'medicina')
    expect(screen.getByText('Nenhum conteúdo encontrado')).toBeInTheDocument()
  })

  it('403 mostra que o hub é liberado no pilar de Informação', async () => {
    vi.mocked(getMyInformationTrail).mockRejectedValue(httpError(403, 'Conclua as trilhas anteriores para acessar a trilha de informação.'))
    renderWithStudent(<ContentHubPage />)
    expect(await screen.findByText('O Hub é liberado no pilar de Informação')).toBeInTheDocument()
  })
})

describe('Minhas Sessões', () => {
  it('separa próximas e canceladas e mostra o link do Meet só nas próximas', async () => {
    vi.mocked(getMyAppointments).mockResolvedValue([
      makeAppointment({ id: 1, title: 'Sessão futura', dateTime: '2099-05-10T10:00:00' }),
      makeAppointment({ id: 2, title: 'Sessão cancelada', dateTime: '2099-05-11T10:00:00', scheduleStatus: 'CANCELADA', cancelReason: 'Feriado escolar' }),
    ])
    renderWithStudent(<SessionsPage />)

    expect(await screen.findByText('Sessão futura')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Entrar no Google Meet/ })).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij')
    expect(getMyAppointments).toHaveBeenCalledWith(7)

    await userEvent.click(screen.getByRole('tab', { name: /Canceladas/ }))
    expect(screen.getByText('Sessão cancelada')).toBeInTheDocument()
    expect(screen.getByText(/Feriado escolar/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Entrar no Google Meet/ })).not.toBeInTheDocument()
  })

  it('estado vazio sem sessões', async () => {
    vi.mocked(getMyAppointments).mockResolvedValue([])
    renderWithStudent(<SessionsPage />)
    expect(await screen.findByText('Nenhuma sessão agendada')).toBeInTheDocument()
  })
})

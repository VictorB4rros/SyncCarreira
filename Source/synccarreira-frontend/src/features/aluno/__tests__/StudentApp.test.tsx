import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { journeyInProgress, makeAppointment, makeFeedback, makeProfile, studentUser } from '../test/fixtures'
import type { AuthUser } from '../types'

const auth = vi.hoisted(() => ({ user: null as AuthUser | null, logout: vi.fn() }))
vi.mock('../../../context/AuthContext.jsx', () => ({ useAuth: () => auth }))

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getMyProfile: vi.fn(),
  getCurrentJourney: vi.fn(),
  getMyFeedbacks: vi.fn(),
  getMyAppointments: vi.fn(),
}))
// As páginas pesadas não interessam aqui: só os guardas e o layout
vi.mock('../pages/HomePage', () => ({ default: () => <h1>Página Minha Jornada</h1> }))

import * as api from '../api/studentApi'
import StudentApp from '../StudentApp'
import { pageTitleFor } from '../layout/StudentShell'

function renderAt(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/aluno/*" element={<StudentApp />} />
        <Route path="/login" element={<p>Tela de login</p>} />
        <Route path="/home" element={<p>Home antiga</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.user = studentUser
  auth.logout = vi.fn().mockResolvedValue(undefined)
  vi.mocked(api.getMyProfile).mockResolvedValue(makeProfile())
  vi.mocked(api.getCurrentJourney).mockResolvedValue(journeyInProgress)
  vi.mocked(api.getMyFeedbacks).mockResolvedValue([makeFeedback({ id: 1 }), makeFeedback({ id: 2, read: true })])
  vi.mocked(api.getMyAppointments).mockResolvedValue([makeAppointment({ dateTime: '2099-01-10T14:30:00' })])
})

describe('guardas da área do aluno', () => {
  it('sem sessão vai para o login', () => {
    auth.user = null
    renderAt('/aluno')
    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it.each([
    ['psicóloga', 'ROLE_PSICOLOGA'],
    ['admin', 'ROLE_ADMIN'],
  ])('%s é mandada(o) para o fluxo dela(e) (/home)', (_, authority) => {
    auth.user = { id: 3, nome: 'Equipe', roles: [{ authority }] }
    renderAt('/aluno')
    expect(screen.getByText('Home antiga')).toBeInTheDocument()
    expect(api.getMyProfile).not.toHaveBeenCalled()
  })

  it('aluno sem afinidades é levado às boas-vindas', async () => {
    vi.mocked(api.getMyProfile).mockResolvedValue(makeProfile({ profileCompleted: false }))
    renderAt('/aluno/trilhas')
    expect(await screen.findByText(/Antes de começar, conte suas afinidades/)).toBeInTheDocument()
  })

  it('aluno com perfil completo vê o layout com menu, badge e próxima sessão', async () => {
    renderAt('/aluno')
    expect(await screen.findByText('Página Minha Jornada')).toBeInTheDocument()
    const nav = screen.getAllByRole('navigation', { name: 'Menu do estudante' })[0]
    expect(nav).toHaveTextContent('Hub de Conteúdos')
    expect(await screen.findByText('1 nova')).toBeInTheDocument()
    expect(screen.getByText('Próxima sessão')).toBeInTheDocument()
    expect(screen.getByText('Jornada #1 • Em andamento')).toBeInTheDocument()
  })

  it('erro ao carregar o perfil mostra opção de tentar novamente', async () => {
    vi.mocked(api.getMyProfile).mockRejectedValueOnce(new Error('Falha de rede'))
    renderAt('/aluno')
    expect(await screen.findByText('Não foi possível abrir o Espaço do Estudante')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }))
    expect(await screen.findByText('Página Minha Jornada')).toBeInTheDocument()
  })

  it('sair chama o logout e volta ao login', async () => {
    renderAt('/aluno')
    await screen.findByText('Página Minha Jornada')
    await userEvent.click(screen.getAllByRole('button', { name: 'Sair da plataforma' })[0])
    expect(auth.logout).toHaveBeenCalled()
    expect(await screen.findByText('Tela de login')).toBeInTheDocument()
  })
})

describe('pageTitleFor', () => {
  it.each([
    ['/aluno', 'Minha Jornada'],
    ['/aluno/trilhas/2', 'Trilhas'],
    ['/aluno/resultados/11', 'Resultados'],
    ['/aluno/afinidades', 'Minhas Afinidades'],
  ])('%s → %s', (path, title) => {
    expect(pageTitleFor(path)).toBe(title)
  })
})

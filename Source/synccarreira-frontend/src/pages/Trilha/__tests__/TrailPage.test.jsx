import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { id: 7 } }),
}))

vi.mock('../../../services/informationLinkService.js', () => ({
  getStudentInformationTrail: vi.fn(),
}))

vi.mock('../../../services/trailService', () => ({
  getTrailById: vi.fn(),
  canAccessTrail: vi.fn(),
  getQuestionsByTrail: vi.fn(),
  getAnswers: vi.fn(),
  postAnswer: vi.fn(),
  deleteAnswer: vi.fn(),
  getMySyntheses: vi.fn(),
  postSynthesis: vi.fn(),
}))

import * as trailService from '../../../services/trailService'
import TrailPage from '../TrailPage.jsx'

function question(id, questionType, optionIds, content = `Pergunta ${id}?`) {
  return { id, content, questionType, options: optionIds.map((optionId, i) => ({ id: optionId, optionText: `Opção ${id}.${i + 1}` })) }
}

const checkbox = question(1, 'CHECKBOX', [11, 12, 13])
const single = question(2, 'MULTIPLA_ESCOLHA', [21, 22])
const limited = question(3, 'CHECKBOX', [31, 32, 33], 'O que define uma atividade bem-sucedida? (Selecione no máximo 2)')

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/trail/1']}>
      <Routes>
        <Route path="/trail/:trailId" element={<TrailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(trailService.canAccessTrail).mockResolvedValue(true)
  vi.mocked(trailService.getTrailById).mockResolvedValue({ id: 1, name: 'AUTOCONHECIMENTO' })
  vi.mocked(trailService.getQuestionsByTrail).mockResolvedValue([checkbox, single, limited])
  vi.mocked(trailService.getAnswers).mockResolvedValue([])
  vi.mocked(trailService.getMySyntheses).mockResolvedValue([])
  vi.mocked(trailService.postAnswer).mockResolvedValue({})
  vi.mocked(trailService.deleteAnswer).mockResolvedValue(undefined)
})

describe('TrailPage', () => {
  it('CHECKBOX mantém várias opções marcadas ao mesmo tempo', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Opção 1.1' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Opção 1.3' }))

    expect(screen.getByRole('checkbox', { name: 'Opção 1.1' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Opção 1.3' })).toHaveAttribute('aria-checked', 'true')
    expect(trailService.postAnswer).toHaveBeenCalledTimes(2)
  })

  it('CHECKBOX desmarca uma opção já marcada com DELETE', async () => {
    vi.mocked(trailService.getAnswers).mockResolvedValue([{ questionOptionDTO: { id: 11 } }, { questionOptionDTO: { id: 12 } }])
    renderPage()
    const first = await screen.findByRole('checkbox', { name: 'Opção 1.1' })
    expect(first).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('checkbox', { name: 'Opção 1.2' })).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(first)
    expect(trailService.deleteAnswer).toHaveBeenCalledWith(11)
    expect(first).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('checkbox', { name: 'Opção 1.2' })).toHaveAttribute('aria-checked', 'true')
  })

  it('MULTIPLA_ESCOLHA mantém só uma opção marcada', async () => {
    renderPage()
    await userEvent.click(await screen.findByRole('radio', { name: 'Opção 2.1' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Opção 2.2' }))

    expect(screen.getByRole('radio', { name: 'Opção 2.1' })).toHaveAttribute('aria-checked', 'false')
    expect(screen.getByRole('radio', { name: 'Opção 2.2' })).toHaveAttribute('aria-checked', 'true')
    expect(trailService.deleteAnswer).not.toHaveBeenCalled()
  })

  it('CHECKBOX com "no máximo 2" bloqueia a terceira opção', async () => {
    renderPage()
    expect(await screen.findByText('Marque até 2 opções')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Opção 3.1' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Opção 3.2' }))

    const third = screen.getByRole('checkbox', { name: 'Opção 3.3' })
    expect(third).toBeDisabled()
    await userEvent.click(third)
    expect(third).toHaveAttribute('aria-checked', 'false')
    expect(trailService.postAnswer).toHaveBeenCalledTimes(2)
  })
})

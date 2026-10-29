import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { httpError, makeProfile } from '../test/fixtures'

vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  updateMyAffinities: vi.fn(),
}))

import { updateMyAffinities } from '../api/studentApi'
import { AffinityForm, validateAffinities } from '../components/AffinityForm'

function pick(areaLabel: RegExp, value: number) {
  const group = screen.getByRole('radiogroup', { name: areaLabel })
  return userEvent.click(within(group).getByRole('radio', { name: new RegExp(`^${value} —`) }))
}

beforeEach(() => {
  vi.mocked(updateMyAffinities).mockReset()
})

describe('validateAffinities', () => {
  it('exige as 4 áreas com inteiros de 0 a 5', () => {
    const errors = validateAffinities({ humanities: null, exactSciences: 2, biologicalSciences: 7, arts: 1.5 })
    expect(Object.keys(errors).sort()).toEqual(['arts', 'biologicalSciences', 'humanities'])
    expect(validateAffinities({ humanities: 0, exactSciences: 5, biologicalSciences: 3, arts: 1 })).toEqual({})
  })
})

describe('AffinityForm', () => {
  it('não envia sem todas as áreas e mostra o erro por campo', async () => {
    render(<AffinityForm onSaved={vi.fn()} />)
    await pick(/Exatas/, 4)
    await userEvent.click(screen.getByRole('button', { name: /salvar afinidades/i }))
    expect(updateMyAffinities).not.toHaveBeenCalled()
    expect(screen.getAllByText('Escolha um valor de 0 a 5.')).toHaveLength(3)
  })

  it('envia o DTO completo e devolve o perfil atualizado', async () => {
    const profile = makeProfile()
    vi.mocked(updateMyAffinities).mockResolvedValue(profile)
    const onSaved = vi.fn()
    render(<AffinityForm onSaved={onSaved} />)

    await pick(/Exatas/, 5)
    await pick(/Humanas/, 4)
    await pick(/Artes/, 3)
    await pick(/Biológicas/, 0)
    await userEvent.click(screen.getByRole('button', { name: /salvar afinidades/i }))

    expect(updateMyAffinities).toHaveBeenCalledWith({ exactSciences: 5, humanities: 4, arts: 3, biologicalSciences: 0 })
    expect(onSaved).toHaveBeenCalledWith(profile)
  })

  it('mostra a mensagem do backend quando o PUT falha', async () => {
    vi.mocked(updateMyAffinities).mockRejectedValue(httpError(404, 'Aluno não encontrado.'))
    render(<AffinityForm initial={makeProfile().affinities} onSaved={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /salvar afinidades/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Aluno não encontrado.')
  })
})

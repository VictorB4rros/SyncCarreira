import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionCard } from '../components/QuestionCard'
import { makeLikert, makeQuestion } from '../test/fixtures'

describe('QuestionCard', () => {
  it('CHECKBOX funciona como escolha única (radio)', async () => {
    const onChoose = vi.fn()
    const question = makeQuestion(1, 'CHECKBOX', [11, 12])
    render(<QuestionCard question={question} index={1} selected={[11]} onChoose={onChoose} />)

    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Respondida')).toBeInTheDocument()

    await userEvent.click(radios[1])
    expect(onChoose).toHaveBeenCalledWith(question, 12)
  })

  it('MULTIPLA_ESCOLHA usa checkboxes e indica que aceita várias opções', async () => {
    const onChoose = vi.fn()
    const question = makeQuestion(2, 'MULTIPLA_ESCOLHA', [21, 22, 23])
    render(<QuestionCard question={question} index={2} selected={[]} onChoose={onChoose} />)

    expect(screen.getByText('Marque quantas quiser')).toBeInTheDocument()
    const boxes = screen.getAllByRole('checkbox')
    await userEvent.click(boxes[0])
    await userEvent.click(boxes[2])
    expect(onChoose).toHaveBeenNthCalledWith(1, question, 21)
    expect(onChoose).toHaveBeenNthCalledWith(2, question, 23)
  })

  it('LIKERT mostra 4 opções, sem a neutra', () => {
    render(<QuestionCard question={makeLikert(3, 300)} index={3} selected={[]} onChoose={vi.fn()} />)
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(4)
    expect(screen.queryByText('Neutro')).not.toBeInTheDocument()
  })

  it('LIKERT avisa quando a resposta antiga era a neutra', () => {
    render(<QuestionCard question={makeLikert(3, 300)} index={3} selected={[302]} onChoose={vi.fn()} />)
    expect(screen.getByText(/resposta anterior era neutra/i)).toBeInTheDocument()
  })

  it('em modo revisão as opções ficam desabilitadas', async () => {
    const onChoose = vi.fn()
    render(<QuestionCard question={makeQuestion(1, 'CHECKBOX', [11, 12])} index={1} selected={[11]} disabled onChoose={onChoose} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toBeDisabled()
    await userEvent.click(radios[1])
    expect(onChoose).not.toHaveBeenCalled()
  })

  it('exibe os estados de salvamento', () => {
    const question = makeQuestion(1, 'CHECKBOX', [11])
    const { rerender } = render(<QuestionCard question={question} index={1} selected={[11]} status="saving" onChoose={vi.fn()} />)
    expect(screen.getByText('Salvando…')).toBeInTheDocument()
    rerender(<QuestionCard question={question} index={1} selected={[11]} status="error" errorMessage="Trilha não liberada." onChoose={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Trilha não liberada.')
  })
})

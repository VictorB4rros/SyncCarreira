/**
 * @file QuestionCard.tsx
 * @description Uma pergunta da trilha, com o controle adequado ao tipo:
 *  - MULTIPLA_ESCOLHA → várias opções (checkbox)
 *  - CHECKBOX / ABERTA / outros → uma opção (radio)
 *  - LIKERT → escala de 4 pontos, sem neutro
 */
import { Check, CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { isMultipleChoice, likertOptions } from '../lib/journey'
import type { QuestionDTO } from '../types'
import { cn } from './ui'

export type SaveStatus = 'saving' | 'saved' | 'error'

export interface QuestionCardProps {
  question: QuestionDTO
  index: number
  selected: number[]
  status?: SaveStatus
  errorMessage?: string
  disabled?: boolean
  onChoose: (question: QuestionDTO, optionId: number) => void
}

function typeLabel(question: QuestionDTO): string {
  if (question.questionType === 'LIKERT') return 'Escala de concordância'
  if (isMultipleChoice(question)) return 'Marque quantas quiser'
  return 'Escolha uma opção'
}

function SaveFeedback({ status, errorMessage }: { status?: SaveStatus; errorMessage?: string }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-muted" role="status">
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> Salvando…
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-primary" role="status">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Resposta salva
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-error" role="alert">
        <CircleAlert className="h-3.5 w-3.5" aria-hidden /> {errorMessage || 'Não foi possível salvar. Tente novamente.'}
      </span>
    )
  }
  return null
}

export function QuestionCard({ question, index, selected, status, errorMessage, disabled = false, onChoose }: QuestionCardProps) {
  const answered = selected.length > 0
  const multiple = isMultipleChoice(question)
  const promptId = `pergunta-${question.id}`

  return (
    <article
      aria-labelledby={promptId}
      className={cn(
        'rounded-2xl bg-white p-4 shadow-card transition-all sm:p-6',
        answered ? 'ring-1 ring-primary/20' : 'ring-1 ring-transparent',
        status === 'error' && 'ring-2 ring-error/40',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">Pergunta {index}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            answered ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary',
          )}
        >
          {answered && <Check className="h-3 w-3" aria-hidden />}
          {answered ? 'Respondida' : typeLabel(question)}
        </span>
      </div>

      <p id={promptId} className="mt-3 text-base font-semibold leading-relaxed text-on-surface">
        {question.content}
      </p>

      {question.questionType === 'LIKERT' ? (
        <LikertScale question={question} selected={selected} disabled={disabled} onChoose={onChoose} labelledBy={promptId} />
      ) : (
        <div
          role={multiple ? 'group' : 'radiogroup'}
          aria-labelledby={promptId}
          className="mt-4 grid gap-2 sm:grid-cols-2"
        >
          {question.options.map(option => {
            const checked = selected.includes(option.id)
            return (
              <button
                key={option.id}
                type="button"
                role={multiple ? 'checkbox' : 'radio'}
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChoose(question, option.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                  checked
                    ? 'border-primary bg-surface-container text-primary-strong font-semibold'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary-fixed-dim hover:bg-surface-container-low',
                  disabled && 'cursor-not-allowed opacity-70 hover:border-outline-variant hover:bg-white',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors',
                    multiple ? 'rounded-md' : 'rounded-full',
                    checked ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-white',
                  )}
                >
                  {checked && (multiple ? <Check className="h-3 w-3" /> : <span className="h-2 w-2 rounded-full bg-white" />)}
                </span>
                <span>{option.optionText}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-3 min-h-5">
        <SaveFeedback status={status} errorMessage={errorMessage} />
      </div>
    </article>
  )
}

function LikertScale({
  question,
  selected,
  disabled,
  onChoose,
  labelledBy,
}: {
  question: QuestionDTO
  selected: number[]
  disabled: boolean
  onChoose: (question: QuestionDTO, optionId: number) => void
  labelledBy: string
}) {
  const options = likertOptions(question.options)
  const selectedId = selected[0]
  const hiddenNeutralSelected = selectedId !== undefined && !options.some(o => o.id === selectedId)

  return (
    <div className="mt-4">
      <div role="radiogroup" aria-labelledby={labelledBy} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option, i) => {
          const checked = option.id === selectedId
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onChoose(question, option.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center text-xs font-medium transition-all',
                checked
                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                  : 'border-outline-variant bg-white text-on-surface-variant hover:border-primary-fixed-dim hover:bg-surface-container-low',
                disabled && 'cursor-not-allowed opacity-70',
              )}
            >
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold', checked ? 'bg-white/20' : 'bg-surface-container text-primary')}>
                {i + 1}
              </span>
              <span>{option.optionText}</span>
            </button>
          )
        })}
      </div>
      {hiddenNeutralSelected && (
        <p className="mt-2 text-xs font-medium text-secondary" role="status">
          Sua resposta anterior era neutra. Escolha uma das quatro opções para atualizá-la.
        </p>
      )}
    </div>
  )
}

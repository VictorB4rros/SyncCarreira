/**
 * @file AffinityForm.tsx
 * @description Formulário de afinidades (RF-14): nota de 0 a 5 para cada grande área.
 * PUT /students/me/affinities — os valores somam aos scores de cada área.
 */
import { useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import { getErrorMessage, getFieldErrors, updateMyAffinities } from '../api/studentApi'
import { AFFINITY_FIELDS, AREA_LABELS } from '../lib/labels'
import { LIMITS, type StudentAffinityDTO, type StudentProfileDTO } from '../types'
import { Alert, Button, cn } from './ui'

type AffinityField = (typeof AFFINITY_FIELDS)[number]['field']

const SCALE = Array.from({ length: LIMITS.affinityMax - LIMITS.affinityMin + 1 }, (_, i) => LIMITS.affinityMin + i)

const SCALE_HINT: Record<number, string> = {
  0: 'Nenhuma',
  1: 'Muito baixa',
  2: 'Baixa',
  3: 'Média',
  4: 'Alta',
  5: 'Muito alta',
}

export function emptyAffinities(): StudentAffinityDTO {
  return { humanities: null, exactSciences: null, biologicalSciences: null, arts: null }
}

export function validateAffinities(values: StudentAffinityDTO): Partial<Record<AffinityField, string>> {
  const errors: Partial<Record<AffinityField, string>> = {}
  AFFINITY_FIELDS.forEach(({ field }) => {
    const value = values[field]
    if (value === null || value === undefined) errors[field] = 'Escolha um valor de 0 a 5.'
    else if (!Number.isInteger(value) || value < LIMITS.affinityMin || value > LIMITS.affinityMax)
      errors[field] = 'O valor deve ser um número inteiro entre 0 e 5.'
  })
  return errors
}

export function AffinityForm({
  initial,
  submitLabel = 'Salvar afinidades',
  onSaved,
  onCancel,
}: {
  initial?: StudentAffinityDTO | null
  submitLabel?: string
  onSaved: (profile: StudentProfileDTO) => void
  onCancel?: () => void
}) {
  const [values, setValues] = useState<StudentAffinityDTO>(initial ?? emptyAffinities())
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  function choose(field: AffinityField, value: number) {
    setValues(v => ({ ...v, [field]: value }))
    if (touched) setErrors(e => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setSubmitError('')
    const validation = validateAffinities(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSaving(true)
    try {
      const profile = await updateMyAffinities(values)
      onSaved(profile)
    } catch (err) {
      setErrors(getFieldErrors(err))
      setSubmitError(getErrorMessage(err, 'Não foi possível salvar suas afinidades.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(event)} noValidate className="flex flex-col gap-5">
      {AFFINITY_FIELDS.map(({ field, area }) => {
        const error = errors[field]
        const legendId = `afinidade-${field}`
        return (
          <fieldset key={field} aria-describedby={error ? `${legendId}-erro` : undefined} className="flex flex-col gap-2">
            <legend id={legendId} className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-on-surface">
              {AREA_LABELS[area]}
              <span className="text-xs font-bold text-primary">
                {values[field] === null ? '— / 5' : `${values[field]} / 5 · ${SCALE_HINT[values[field] as number]}`}
              </span>
            </legend>
            <div role="radiogroup" aria-labelledby={legendId} className="grid grid-cols-6 gap-1.5">
              {SCALE.map(n => {
                const checked = values[field] === n
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${n} — ${SCALE_HINT[n]}`}
                    onClick={() => choose(field, n)}
                    className={cn(
                      'h-11 rounded-xl border text-sm font-bold transition-all',
                      checked
                        ? 'border-primary bg-primary text-on-primary shadow-sm'
                        : 'border-outline-variant bg-white text-primary hover:bg-surface-container-low',
                      error && !checked && 'border-error/50',
                    )}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            {error && (
              <p id={`${legendId}-erro`} className="text-xs font-medium text-error">
                {error}
              </p>
            )}
          </fieldset>
        )
      })}

      {submitError && <Alert tone="danger">{submitError}</Alert>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" icon={Save} loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

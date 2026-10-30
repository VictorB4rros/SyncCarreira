/**
 * @file TrailRunPage.tsx
 * @description Execução de um pilar: perguntas (salvamento automático) e síntese reflexiva.
 *
 * Regras do backend respeitadas:
 *  - Trilha bloqueada → can-access = false (e perguntas/respostas devolvem 403).
 *  - MULTIPLA_ESCOLHA: POST marca e DELETE desmarca; demais tipos: POST substitui a resposta.
 *  - A síntese só é aceita com todas as perguntas respondidas e não pode ser editada (POST único).
 *  - Pilar concluído (síntese enviada) fica em modo revisão: as respostas não mudam mais.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ChartColumn,
  CircleCheck,
  Eye,
  Lock,
  NotebookPen,
  PenLine,
  Send,
} from 'lucide-react'
import {
  canAccessTrail,
  checkOption,
  getErrorMessage,
  getHttpStatus,
  getMyAnswers,
  getMyInformationTrail,
  getMySyntheses,
  getTrailQuestions,
  getTrails,
  submitSynthesis,
  uncheckOption,
} from '../api/studentApi'
import { LinkCard } from '../components/LinkCard'
import { QuestionCard, type SaveStatus } from '../components/QuestionCard'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
  Skeleton,
  useToast,
} from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync } from '../hooks/useAsync'
import { formatDateTime } from '../lib/format'
import { buildSelections, countAnswered, isMultipleChoice } from '../lib/journey'
import { AREA_LABELS, TRAIL_META, pillarCode, trailLabel } from '../lib/labels'
import { LIMITS, type QuestionDTO, type SynthesisDTO, type TrailDTO } from '../types'

interface TrailRunData {
  trail: TrailDTO | null
  nextTrail: TrailDTO | null
  previousTrail: TrailDTO | null
  locked: boolean
  questions: QuestionDTO[]
  selections: Record<number, number[]>
  synthesis: SynthesisDTO | null
}

export async function loadTrailRun(trailId: number): Promise<TrailRunData> {
  const trails = await getTrails()
  const index = trails.findIndex(t => t.id === trailId)
  const trail = index >= 0 ? trails[index] : null
  const base = {
    trail,
    nextTrail: index >= 0 ? trails[index + 1] ?? null : null,
    previousTrail: index > 0 ? trails[index - 1] : null,
  }
  if (!trail) return { ...base, locked: false, questions: [], selections: {}, synthesis: null }

  const accessible = await canAccessTrail(trailId)
  if (!accessible) return { ...base, locked: true, questions: [], selections: {}, synthesis: null }

  const [questions, answers, syntheses] = await Promise.all([
    getTrailQuestions(trailId),
    getMyAnswers(trailId),
    getMySyntheses(),
  ])
  return {
    ...base,
    locked: false,
    questions,
    selections: buildSelections(questions, answers),
    synthesis: syntheses.find(s => s.trailId === trailId) ?? null,
  }
}

const draftKey = (userId: number, trailId: number) => `sc-aluno:sintese:${userId}:${trailId}`

function readDraft(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(key, value)
    else window.localStorage.removeItem(key)
  } catch {
    // Armazenamento indisponível (aba anônima): o rascunho só não é lembrado.
  }
}

export default function TrailRunPage() {
  const params = useParams()
  const trailId = Number(params.trailId)
  const validId = Number.isInteger(trailId) && trailId > 0
  const { data, error, loading, reload } = useAsync(() => loadTrailRun(trailId), [trailId], { enabled: validId })

  if (!validId) {
    return <EmptyState icon={Lock} title="Pilar não encontrado" description="O endereço acessado não corresponde a um pilar." action={<BackToTrails />} />
  }
  if (loading && !data) return <TrailRunSkeleton />
  if (error) {
    return <ErrorState message={getErrorMessage(error, 'Não foi possível carregar este pilar.')} onRetry={reload} />
  }
  if (!data) return null
  if (!data.trail) {
    return <EmptyState icon={Lock} title="Pilar não encontrado" description="Este pilar não existe mais ou foi removido." action={<BackToTrails />} />
  }
  if (data.locked) {
    return (
      <EmptyState
        icon={Lock}
        title={`${pillarCode(data.trail.sequentialOrder)} ainda está bloqueado`}
        description={
          data.previousTrail
            ? `Conclua as perguntas e envie a síntese do ${pillarCode(data.previousTrail.sequentialOrder)} — ${trailLabel(data.previousTrail.name)} para liberar esta etapa.`
            : 'Preencha suas afinidades para liberar o primeiro pilar.'
        }
        action={<BackToTrails />}
      />
    )
  }
  return <TrailRun key={trailId} data={data} />
}

function BackToTrails() {
  return (
    <ButtonLink to="/aluno/trilhas" variant="outline" icon={ArrowLeft}>
      Voltar para as trilhas
    </ButtonLink>
  )
}

function TrailRunSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Carregando pilar">
      <Skeleton className="h-32" />
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  )
}

function TrailRun({ data }: { data: TrailRunData }) {
  const trail = data.trail as TrailDTO
  const { user, refreshJourney } = useStudent()
  const toast = useToast()

  const [selections, setSelections] = useState<Record<number, number[]>>(data.selections)
  const [statuses, setStatuses] = useState<Record<number, SaveStatus | undefined>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [synthesis, setSynthesis] = useState<SynthesisDTO | null>(data.synthesis)
  const queues = useRef<Record<number, Promise<void>>>({})
  const timers = useRef<Record<number, number>>({})

  useEffect(() => {
    const pending = timers.current
    return () => Object.values(pending).forEach(id => window.clearTimeout(id))
  }, [])

  const questions = data.questions
  const answered = countAnswered(questions, selections)
  const total = questions.length
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 100
  const allAnswered = answered === total
  const readOnly = synthesis !== null
  const saving = Object.values(statuses).some(s => s === 'saving')
  const isFinal = trail.name === 'INFORMACAO'
  const meta = TRAIL_META[trail.name]

  const setStatus = useCallback((questionId: number, status: SaveStatus | undefined) => {
    setStatuses(s => ({ ...s, [questionId]: status }))
    window.clearTimeout(timers.current[questionId])
    if (status === 'saved') {
      timers.current[questionId] = window.setTimeout(
        () => setStatuses(s => (s[questionId] === 'saved' ? { ...s, [questionId]: undefined } : s)),
        2500,
      )
    }
  }, [])

  const handleChoose = useCallback(
    (question: QuestionDTO, optionId: number) => {
      if (readOnly) return
      const previous = selections[question.id] ?? []
      const multiple = isMultipleChoice(question)
      const wasChecked = previous.includes(optionId)
      if (!multiple && wasChecked) return

      const next = multiple ? (wasChecked ? previous.filter(id => id !== optionId) : [...previous, optionId]) : [optionId]
      setSelections(s => ({ ...s, [question.id]: next }))
      setErrors(e => ({ ...e, [question.id]: '' }))
      setStatus(question.id, 'saving')

      // Fila por pergunta: cliques rápidos chegam ao backend na ordem em que foram feitos
      const run = async () => {
        try {
          if (multiple && wasChecked) await uncheckOption(optionId)
          else await checkOption(optionId)
          setStatus(question.id, 'saved')
        } catch (err) {
          setSelections(s => {
            const current = s[question.id] ?? []
            const unchanged = current.length === next.length && current.every(id => next.includes(id))
            return unchanged ? { ...s, [question.id]: previous } : s
          })
          setErrors(e => ({ ...e, [question.id]: getErrorMessage(err, 'Não foi possível salvar sua resposta.') }))
          setStatus(question.id, 'error')
        }
      }
      queues.current[question.id] = (queues.current[question.id] ?? Promise.resolve()).then(run)
    },
    [readOnly, selections, setStatus],
  )

  const nextLink = useMemo(() => {
    if (isFinal || !data.nextTrail) return { to: '/aluno/resultados', label: 'Ver meu resultado', icon: ChartColumn }
    return { to: `/aluno/trilhas/${data.nextTrail.id}`, label: `Ir para o ${pillarCode(data.nextTrail.sequentialOrder)}`, icon: ArrowRight }
  }, [data.nextTrail, isFinal])

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link to="/aluno/trilhas" className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Minhas trilhas
        </Link>

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep via-primary to-primary-container p-5 text-white shadow-raised sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-secondary-container/20" aria-hidden />
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="white">{pillarCode(trail.sequentialOrder)}</Badge>
              {isFinal && <Badge tone="white">Etapa final da jornada</Badge>}
              {readOnly && <Badge tone="white" icon={Eye}>Modo revisão</Badge>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{meta?.label ?? trail.name}</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-primary-fixed">{meta?.description}</p>
          </div>
        </section>
      </div>

      {total > 0 && (
        <div className="sticky top-16 z-30 -mx-4 bg-surface/95 px-4 py-2 backdrop-blur lg:-mx-6 lg:px-6">
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-primary-strong">
                <NotebookPen className="h-4 w-4" aria-hidden /> Progresso neste pilar
              </span>
              <span className="font-semibold text-on-surface-variant" aria-live="polite">
                {answered} de {total} questões respondidas ({percentage}%)
              </span>
            </div>
            <ProgressBar value={percentage} label="Progresso neste pilar" />
          </div>
        </div>
      )}

      {readOnly && (
        <Alert tone="success" title="Pilar concluído">
          Você enviou a síntese em {formatDateTime(synthesis?.createdAt)}. As respostas ficam disponíveis para revisão e não
          podem mais ser alteradas.
        </Alert>
      )}

      {total > 0 && (
        <div className="flex flex-col gap-4">
          {questions.map((question, i) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={i + 1}
              selected={selections[question.id] ?? []}
              status={statuses[question.id]}
              errorMessage={errors[question.id]}
              disabled={readOnly}
              onChoose={handleChoose}
            />
          ))}
        </div>
      )}

      {isFinal && <InformationLinksSection />}

      {allAnswered ? (
        <SynthesisSection
          trail={trail}
          userId={user.id}
          synthesis={synthesis}
          disabled={saving}
          isFinal={isFinal}
          onSubmitted={async saved => {
            setSynthesis(saved)
            toast.success(isFinal ? 'Síntese final enviada!' : 'Síntese enviada!', isFinal ? 'Sua jornada foi concluída.' : 'O próximo pilar foi liberado.')
            await refreshJourney()
          }}
          onAlreadySubmitted={async () => {
            const mine = await getMySyntheses().catch(() => [])
            setSynthesis(mine.find(s => s.trailId === trail.id) ?? null)
          }}
        />
      ) : (
        <div className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4 sm:p-6">
          <PenLine className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-on-surface">Síntese reflexiva</span>
            <span className="text-sm text-muted">
              Responda todas as perguntas para liberar a síntese deste pilar. Faltam {total - answered}{' '}
              {total - answered === 1 ? 'pergunta' : 'perguntas'}.
            </span>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="flex justify-end">
          <ButtonLink to={nextLink.to} iconRight={nextLink.icon}>
            {nextLink.label}
          </ButtonLink>
        </div>
      )}
    </>
  )
}

function SynthesisSection({
  trail,
  userId,
  synthesis,
  disabled,
  isFinal,
  onSubmitted,
  onAlreadySubmitted,
}: {
  trail: TrailDTO
  userId: number
  synthesis: SynthesisDTO | null
  disabled: boolean
  isFinal: boolean
  onSubmitted: (saved: SynthesisDTO) => Promise<void>
  onAlreadySubmitted: () => Promise<void>
}) {
  const key = draftKey(userId, trail.id)
  const [content, setContent] = useState(() => readDraft(key))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaId = `sintese-${trail.id}`
  const max = LIMITS.synthesisMaxLength

  if (synthesis) {
    return (
      <Card as="section" className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-on-surface">
          <CircleCheck className="h-5 w-5 text-primary" aria-hidden />
          {isFinal ? 'Sua síntese final da jornada' : 'Sua síntese deste pilar'}
        </h2>
        <p className="whitespace-pre-wrap rounded-xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant">
          {synthesis.content}
        </p>
        <span className="text-xs text-subtle">Enviada em {formatDateTime(synthesis.createdAt)}</span>
      </Card>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return setError('Escreva a sua síntese antes de enviar.')
    if (trimmed.length > max) return setError(`A síntese deve ter no máximo ${max} caracteres.`)

    setSubmitting(true)
    setError('')
    try {
      const saved = await submitSynthesis({ trailId: trail.id, content: trimmed })
      writeDraft(key, '')
      await onSubmitted(saved)
    } catch (err) {
      if (getHttpStatus(err) === 409) {
        writeDraft(key, '')
        await onAlreadySubmitted()
      }
      setError(getErrorMessage(err, 'Não foi possível enviar sua síntese.'))
    } finally {
      setSubmitting(false)
    }
  }

  const length = content.trim().length
  return (
    <Card as="section" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {isFinal && <span className="text-xs font-bold uppercase tracking-wider text-secondary">Etapa final da jornada</span>}
        <h2 className="text-lg font-bold text-on-surface">
          {isFinal ? 'Síntese final: o que você leva desta jornada?' : 'Síntese reflexiva do pilar'}
        </h2>
        <p className="text-sm text-muted">
          {isFinal
            ? 'Conte com suas palavras o que descobriu sobre você, as áreas que mais fazem sentido e os próximos passos que imagina.'
            : 'Escreva livremente o que percebeu sobre você ao responder este pilar. Depois de enviada, a síntese não pode ser editada.'}
        </p>
      </div>
      <form onSubmit={event => void handleSubmit(event)} noValidate className="flex flex-col gap-3">
        <label htmlFor={textareaId} className="sr-only">
          Síntese do {pillarCode(trail.sequentialOrder)}
        </label>
        <textarea
          id={textareaId}
          value={content}
          onChange={e => {
            setContent(e.target.value)
            writeDraft(key, e.target.value)
            if (error) setError('')
          }}
          rows={7}
          maxLength={max + 200}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${textareaId}-ajuda`}
          placeholder="Ex.: Percebi que tenho mais facilidade quando…"
          className="w-full rounded-xl border border-outline-variant bg-white p-4 text-sm leading-relaxed text-on-surface placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div id={`${textareaId}-ajuda`} className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted">Seu rascunho fica salvo neste navegador até o envio.</span>
          <span className={length > max ? 'font-semibold text-error' : 'text-subtle'}>
            {length}/{max}
          </span>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="flex justify-end">
          <Button type="submit" icon={Send} loading={submitting} disabled={disabled}>
            {isFinal ? 'Enviar síntese final' : 'Enviar síntese'}
          </Button>
        </div>
        {disabled && <p className="text-right text-xs text-muted">Aguarde o salvamento das respostas…</p>}
      </form>
    </Card>
  )
}

function InformationLinksSection() {
  const { data, error, loading, reload } = useAsync(getMyInformationTrail, [])

  return (
    <Card as="section" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold text-on-surface">Materiais para a sua decisão</h2>
        <p className="text-sm text-muted">
          Links selecionados pela equipe de psicologia para as suas áreas de maior afinidade e para o acesso à universidade.
          Explore antes de escrever a síntese final.
        </p>
      </div>
      {loading && !data ? (
        <LoadingState label="Carregando materiais…" className="py-8" />
      ) : error ? (
        <ErrorState message={getErrorMessage(error, 'Não foi possível carregar os materiais.')} onRetry={reload} />
      ) : data ? (
        <>
          {data.recommendedAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-muted">Suas áreas em destaque:</span>
              {data.recommendedAreas.map(area => (
                <Badge key={area} tone="soft">{AREA_LABELS[area]}</Badge>
              ))}
            </div>
          )}
          {data.careerLinks.length + data.universityAccessLinks.length === 0 ? (
            <p className="text-sm text-muted">Ainda não há materiais cadastrados. Você já pode escrever a sua síntese final.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[...data.careerLinks, ...data.universityAccessLinks].map(link => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
          <Link to="/aluno/conteudos" className="self-start text-sm font-semibold text-primary hover:underline">
            Abrir o Hub de Conteúdos
          </Link>
        </>
      ) : null}
    </Card>
  )
}

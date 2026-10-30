/**
 * @file PillarCard.tsx
 * @description Card de um pilar (trilha) na linha do tempo da jornada.
 * Estados: concluído, em andamento/disponível e bloqueado.
 */
import { ArrowRight, Brain, Check, CircleCheck, Clock, Eye, Info, Lock, NotebookPen, Sparkles } from 'lucide-react'
import type { TrailProgressInfo } from '../lib/journey'
import { formatDate } from '../lib/format'
import { TRAIL_META, pillarCode, trailLabel } from '../lib/labels'
import { Badge, ButtonLink, ProgressBar } from './ui'

function excerpt(text: string, max = 180) {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

export function PillarCard({ info, previous, compact = false }: { info: TrailProgressInfo; previous?: TrailProgressInfo; compact?: boolean }) {
  const { trail, status, synthesis, totalQuestions, answeredQuestions, percentage, nextQuestion } = info
  const meta = TRAIL_META[trail.name]
  const code = pillarCode(trail.sequentialOrder)
  const link = `/aluno/trilhas/${trail.id}`
  const isFinal = trail.name === 'INFORMACAO'
  const headingId = `pilar-${trail.id}-titulo`

  if (status === 'LOCKED') {
    return (
      <article aria-labelledby={headingId} className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/70 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-subtle">
              <Lock className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-subtle">{code}</span>
            <h3 id={headingId} className="text-base font-bold uppercase text-muted sm:text-lg">{meta?.label ?? trail.name}</h3>
          </div>
          <Badge tone="neutral" icon={Lock}>Bloqueado</Badge>
        </div>
        {!compact && <p className="mt-3 sm:pl-9 text-sm leading-relaxed text-muted">{meta?.description}</p>}
        {previous && (
          <div className="sm:ml-9 mt-3 flex items-center gap-2 rounded-xl bg-white/70 p-3 text-xs text-muted">
            <Info className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
            <span>
              Finalize as questões e a síntese do <strong>{pillarCode(previous.trail.sequentialOrder)}</strong> ({trailLabel(previous.trail.name)}) para desbloquear esta etapa.
            </span>
          </div>
        )}
      </article>
    )
  }

  if (status === 'CONCLUDED') {
    return (
      <article aria-labelledby={headingId} className="rounded-2xl bg-white p-4 shadow-card transition-shadow hover:shadow-raised sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary">
              <Check className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">{code}</span>
            <h3 id={headingId} className="text-base font-bold uppercase text-on-surface sm:text-lg">{meta?.label ?? trail.name}</h3>
          </div>
          <Badge tone="soft" icon={CircleCheck}>Concluído em {formatDate(synthesis?.createdAt)}</Badge>
        </div>
        {!compact && <p className="mt-3 sm:pl-9 text-sm leading-relaxed text-on-surface-variant">{meta?.description}</p>}
        {synthesis && (
          <div className="sm:ml-9 mt-3 flex flex-col gap-1.5 rounded-xl bg-surface-container-low p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-primary-strong">
                <Brain className="h-3.5 w-3.5" aria-hidden /> {isFinal ? 'Síntese final registrada' : 'Síntese pessoal registrada'}
              </span>
              {totalQuestions > 0 && <span className="text-[11px] text-subtle">{totalQuestions}/{totalQuestions} questões</span>}
            </div>
            <p className="text-xs font-medium italic leading-relaxed text-on-surface-variant">“{excerpt(synthesis.content)}”</p>
          </div>
        )}
        <div className="sm:ml-9 mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Sparkles className="h-4 w-4" aria-hidden /> 100% finalizado
          </span>
          <ButtonLink to={link} variant="secondary" size="sm" icon={Eye}>
            Revisar respostas e síntese
          </ButtonLink>
        </div>
      </article>
    )
  }

  const started = status === 'IN_PROGRESS'
  const allAnswered = answeredQuestions === totalQuestions
  const cta = isFinal && totalQuestions === 0 ? 'Abrir materiais e síntese final' : started ? 'Responder perguntas & síntese' : 'Começar este pilar'

  return (
    <article aria-labelledby={headingId} className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-raised ring-2 ring-primary/15 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
            {String(trail.sequentialOrder ?? '').padStart(2, '0')}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">{code}</span>
          <h3 id={headingId} className="text-base font-bold uppercase text-on-surface sm:text-lg">{meta?.label ?? trail.name}</h3>
        </div>
        <Badge tone="strong">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          {started ? 'Em andamento' : 'Disponível'}
        </Badge>
      </div>
      {!compact && <p className="mt-3 sm:pl-9 text-sm leading-relaxed text-on-surface-variant">{meta?.description}</p>}

      <div className="sm:ml-9 mt-3 flex flex-col gap-2.5 rounded-xl bg-surface-container-low p-4">
        {totalQuestions > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-primary-strong">
                <NotebookPen className="h-4 w-4" aria-hidden /> Questionário reflexivo
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 font-semibold text-primary">
                {answeredQuestions} de {totalQuestions} questões respondidas
              </span>
            </div>
            <ProgressBar value={percentage} label={`Progresso do ${code}`} />
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary-strong">
            <NotebookPen className="h-4 w-4" aria-hidden /> Materiais de carreira e síntese final da jornada
          </span>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted">
          <span className="min-w-0 truncate">
            {nextQuestion ? <>Próxima pergunta: “{excerpt(nextQuestion.content, 80)}”</> : allAnswered ? 'Perguntas concluídas — falta a síntese.' : ''}
          </span>
          <span className="flex items-center gap-1 font-semibold text-secondary">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Síntese pendente
          </span>
        </div>
      </div>

      <div className="sm:ml-9 mt-3 flex justify-end">
        <ButtonLink to={link} iconRight={ArrowRight} className="w-full sm:w-auto">
          {cta}
        </ButtonLink>
      </div>
    </article>
  )
}

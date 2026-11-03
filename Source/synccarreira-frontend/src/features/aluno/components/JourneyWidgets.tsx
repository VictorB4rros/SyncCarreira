/**
 * @file JourneyWidgets.tsx
 * @description Cards laterais da jornada: próxima sessão, afinidades e últimas sínteses.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  CalendarClock,
  CalendarPlus,
  ChartColumn,
  ChevronDown,
  CircleCheck,
  Clock,
  Headset,
  Shield,
  SlidersHorizontal,
  Video,
} from 'lucide-react'
import type { AppointmentDTO, StudentAffinityDTO, SynthesisDTO } from '../types'
import { formatDate, formatTime, relativeDayLabel, safeExternalUrl } from '../lib/format'
import { AFFINITY_FIELDS, AREA_LABELS, SCHEDULE_TYPE_LABELS, pillarCode, trailLabel } from '../lib/labels'
import { Badge, ButtonLink, Card, CardTitle, ExternalButtonLink, Modal, ProgressBar, cn } from './ui'

export function NextSessionCard({ session }: { session: AppointmentDTO | null }) {
  if (!session) {
    return (
      <Card className="flex flex-col gap-3">
        <CardTitle icon={CalendarClock}>Próxima orientação</CardTitle>
        <p className="text-sm text-muted">Nenhuma sessão agendada no momento. Quando sua psicóloga marcar um encontro, ele aparece aqui.</p>
        <ButtonLink to="/aluno/sessoes" variant="secondary" size="sm" className="self-start">
          Ver minhas sessões
        </ButtonLink>
      </Card>
    )
  }

  const meetLink = safeExternalUrl(session.meetLink)
  const calendarLink = safeExternalUrl(session.calendarLink)

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle icon={CalendarClock} aside={<Badge tone="soft">{SCHEDULE_TYPE_LABELS[session.scheduleType]}</Badge>}>
        Próxima orientação
      </CardTitle>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary">
          <Headset className="h-6 w-6" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold text-on-surface">{session.psychologist?.name ?? 'Psicóloga orientadora'}</span>
          <span className="truncate text-xs text-muted">{session.title}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 rounded-xl bg-surface-container-low p-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-on-surface">
          <Clock className="h-4 w-4 text-primary" aria-hidden />
          {relativeDayLabel(session.dateTime)}, {formatTime(session.dateTime)} ({session.durationMinutes} min)
        </span>
        {session.description && <span className="pl-6 text-[11px] text-muted">Pauta: {session.description}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {meetLink ? (
          <ExternalButtonLink href={meetLink} icon={Video} className="w-full">
            Entrar no Google Meet
          </ExternalButtonLink>
        ) : (
          <p className="text-center text-xs text-muted">O link da chamada aparece aqui quando estiver disponível.</p>
        )}
        {calendarLink && (
          <a
            href={calendarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-muted hover:text-primary"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden /> Ver no Google Calendar
          </a>
        )}
      </div>
    </Card>
  )
}

export function AffinitiesCard({ affinities }: { affinities: StudentAffinityDTO }) {
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle icon={ChartColumn} aside={<span className="text-[11px] text-subtle">Autoavaliação</span>}>
        Minhas afinidades
      </CardTitle>
      <p className="text-xs text-muted">Inclinação por grandes áreas do conhecimento (escala de 0 a 5):</p>
      <ul className="flex flex-col gap-2.5">
        {AFFINITY_FIELDS.map(({ field, area }) => {
          const value = affinities[field] ?? 0
          return (
            <li key={field} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-on-surface-variant">{AREA_LABELS[area]}</span>
                <span className="font-bold text-primary">{affinities[field] ?? '—'} / 5</span>
              </div>
              <ProgressBar value={(value / 5) * 100} label={`Afinidade com ${AREA_LABELS[area]}`} />
            </li>
          )
        })}
      </ul>
      <Link to="/aluno/afinidades" className="inline-flex items-center gap-1 self-end text-xs font-semibold text-primary hover:underline">
        Reajustar afinidades <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </Card>
  )
}

export function LatestSynthesesCard({ syntheses }: { syntheses: SynthesisDTO[] }) {
  const sorted = [...syntheses].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const [openId, setOpenId] = useState<number | null>(sorted[0]?.id ?? null)
  const [reading, setReading] = useState<SynthesisDTO | null>(null)

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle
        icon={Bookmark}
        aside={sorted.length > 0 && <Badge tone="soft">{sorted.length} {sorted.length === 1 ? 'registrada' : 'registradas'}</Badge>}
      >
        Últimas sínteses
      </CardTitle>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted">Ao concluir as perguntas de um pilar, você escreve uma síntese. Ela aparece aqui.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.slice(0, 4).map(s => {
            const open = openId === s.id
            const panelId = `sintese-${s.id}`
            return (
              <li key={s.id} className="overflow-hidden rounded-xl bg-surface-container-low">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="flex w-full items-center justify-between gap-2 p-3 text-left hover:bg-surface-container"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-on-surface">
                    <CircleCheck className="h-4 w-4 text-primary" aria-hidden />
                    {pillarCode(s.trailSequentialOrder)} — {trailLabel(s.trailName)}
                  </span>
                  <ChevronDown className={cn('h-4 w-4 text-subtle transition-transform', open && 'rotate-180')} aria-hidden />
                </button>
                {open && (
                  <div id={panelId} className="flex flex-col gap-2 px-3 pb-3 text-xs text-on-surface-variant">
                    <p className="line-clamp-4 border-l-2 border-primary-fixed-dim pl-2.5 italic leading-relaxed">“{s.content}”</p>
                    <div className="flex items-center justify-between text-[11px] text-subtle">
                      <span>Registrada em {formatDate(s.createdAt)}</span>
                      <button type="button" onClick={() => setReading(s)} className="font-semibold text-primary hover:underline">
                        Ver íntegra
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-container p-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="text-[11px] leading-snug text-on-surface-variant">
          Suas sínteses são confidenciais e acessíveis apenas por você e pela psicóloga orientadora, conforme a LGPD e o
          Código de Ética do CFP.
        </p>
      </div>

      <Modal
        open={reading !== null}
        onClose={() => setReading(null)}
        title={reading ? `${pillarCode(reading.trailSequentialOrder)} — ${trailLabel(reading.trailName)}` : ''}
        description={reading ? `Registrada em ${formatDate(reading.createdAt)}` : undefined}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{reading?.content}</p>
      </Modal>
    </Card>
  )
}

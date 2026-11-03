/**
 * @file SessionsPage.tsx
 * @description "Minhas Sessões": orientações agendadas pela psicóloga (somente leitura para o aluno).
 * GET /appointments/student/{id} — o backend só permite a própria agenda.
 */
import { useState } from 'react'
import { CalendarClock, CalendarPlus, CalendarX2, Clock, Headset, CalendarCheck, Users, Video } from 'lucide-react'
import { getErrorMessage, getMyAppointments } from '../api/studentApi'
import { Badge, EmptyState, ErrorState, ExternalButtonLink, PageHeader, Skeleton, cn } from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync } from '../hooks/useAsync'
import { formatDate, formatTime, formatWeekdayDate, relativeDayLabel, safeExternalUrl } from '../lib/format'
import { groupAppointments } from '../lib/journey'
import { SCHEDULE_STATUS_LABELS, SCHEDULE_TYPE_LABELS } from '../lib/labels'
import type { AppointmentDTO } from '../types'

type Tab = 'upcoming' | 'past' | 'canceled'

function SessionCard({ session, variant }: { session: AppointmentDTO; variant: Tab }) {
  const meetLink = safeExternalUrl(session.meetLink)
  const calendarLink = safeExternalUrl(session.calendarLink)
  const upcoming = variant === 'upcoming'
  const status = upcoming ? 'Agendada' : session.scheduleStatus === 'AGENDADA' ? 'Aguardando registro' : SCHEDULE_STATUS_LABELS[session.scheduleStatus]

  return (
    <article className={cn('flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-card sm:flex-row sm:items-start', variant === 'canceled' && 'opacity-80')}>
      <div
        className={cn(
          'flex w-full shrink-0 flex-row items-center justify-center gap-2 rounded-xl px-3 py-3 text-center sm:w-24 sm:flex-col sm:gap-0',
          upcoming ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary',
        )}
      >
        <span className="text-xs font-semibold uppercase">{upcoming ? relativeDayLabel(session.dateTime) : formatWeekdayDate(session.dateTime)}</span>
        <span className="text-xl font-extrabold">{formatTime(session.dateTime)}</span>
        <span className="text-[11px] opacity-80">{formatDate(session.dateTime)}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={upcoming ? 'primary' : variant === 'canceled' ? 'neutral' : 'soft'}>{status}</Badge>
          <Badge tone="soft" icon={session.scheduleType === 'GRUPO' ? Users : undefined}>
            {SCHEDULE_TYPE_LABELS[session.scheduleType]}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {session.durationMinutes} min
          </span>
        </div>
        <h3 className="text-base font-bold text-on-surface">{session.title}</h3>
        {session.description && <p className="text-sm leading-relaxed text-on-surface-variant">{session.description}</p>}
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Headset className="h-4 w-4 text-primary" aria-hidden />
          {session.psychologist?.name ?? 'Psicóloga orientadora'}
          {session.psychologist?.email && <span className="hidden sm:inline">• {session.psychologist.email}</span>}
        </span>
        {variant === 'canceled' && session.cancelReason && (
          <p className="rounded-lg bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
            <strong>Motivo do cancelamento:</strong> {session.cancelReason}
          </p>
        )}
        {upcoming && (meetLink || calendarLink) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {meetLink && (
              <ExternalButtonLink href={meetLink} icon={Video} size="sm">
                Entrar no Google Meet
              </ExternalButtonLink>
            )}
            {calendarLink && (
              <ExternalButtonLink href={calendarLink} icon={CalendarPlus} size="sm" variant="outline">
                Ver no Google Calendar
              </ExternalButtonLink>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default function SessionsPage() {
  const { user } = useStudent()
  const { data, error, loading, reload } = useAsync(() => getMyAppointments(user.id), [user.id])
  const [tab, setTab] = useState<Tab>('upcoming')
  const groups = groupAppointments(data ?? [])

  const tabs: { key: Tab; label: string; icon: typeof CalendarClock; items: AppointmentDTO[] }[] = [
    { key: 'upcoming', label: 'Próximas', icon: CalendarClock, items: groups.upcoming },
    { key: 'past', label: 'Anteriores', icon: CalendarCheck, items: groups.past },
    { key: 'canceled', label: 'Canceladas', icon: CalendarX2, items: groups.canceled },
  ]
  const active = tabs.find(t => t.key === tab) ?? tabs[0]

  const emptyText: Record<Tab, { title: string; description: string }> = {
    upcoming: { title: 'Nenhuma sessão agendada', description: 'Quando a sua psicóloga marcar uma orientação, ela aparece aqui com o link da chamada.' },
    past: { title: 'Nenhuma sessão anterior', description: 'As orientações que já aconteceram ficam registradas aqui.' },
    canceled: { title: 'Nenhuma sessão cancelada', description: 'Ótimo! Nenhuma orientação foi cancelada.' },
  }

  return (
    <>
      <PageHeader
        eyebrow="Agenda de orientação"
        title="Minhas sessões"
        description="Encontros individuais e em grupo com a equipe de psicologia escolar. Os horários seguem o fuso da sua escola."
      />

      <div role="tablist" aria-label="Sessões" className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`aba-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="painel-sessoes"
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-primary text-on-primary shadow-sm' : 'bg-white text-primary shadow-card hover:bg-surface-container-low',
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden />
            {t.label}
            {data && <span className={cn('rounded-full px-1.5 text-[11px]', tab === t.key ? 'bg-white/20' : 'bg-surface-container')}>{t.items.length}</span>}
          </button>
        ))}
      </div>

      <section id="painel-sessoes" role="tabpanel" aria-labelledby={`aba-${active.key}`} className="flex flex-col gap-4">
        {loading && !data ? (
          [0, 1].map(i => <Skeleton key={i} className="h-36" />)
        ) : error ? (
          <ErrorState message={getErrorMessage(error, 'Não foi possível carregar suas sessões.')} onRetry={reload} />
        ) : active.items.length === 0 ? (
          <EmptyState icon={active.icon} title={emptyText[active.key].title} description={emptyText[active.key].description} />
        ) : (
          active.items.map(session => <SessionCard key={session.id} session={session} variant={active.key} />)
        )}
      </section>
    </>
  )
}

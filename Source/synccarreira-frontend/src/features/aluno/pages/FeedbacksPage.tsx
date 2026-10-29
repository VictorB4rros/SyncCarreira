/**
 * @file FeedbacksPage.tsx
 * @description Caixa de devolutivas e feedbacks da psicóloga (RF-09/RF-16).
 * Abrir um feedback não lido chama PATCH /feedbacks/{id}/read e atualiza o contador do menu.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ChartColumn,
  CheckCheck,
  ChevronRight,
  Clock,
  HeartHandshake,
  Inbox,
  Mail,
  Printer,
  Shield,
  Heart,
} from 'lucide-react'
import { getErrorMessage, getMyFeedbacks, markFeedbackAsRead } from '../api/studentApi'
import { Badge, Button, ButtonLink, EmptyState, ErrorState, PageHeader, Skeleton, cn } from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync } from '../hooks/useAsync'
import { formatDateTime, formatLongDate, formatTime } from '../lib/format'
import { FEEDBACK_TYPE_LABELS } from '../lib/labels'
import type { FeedbackDTO } from '../types'

type Filter = 'ALL' | 'UNREAD' | 'JORNADA' | 'SESSAO'

export function feedbackTitle(feedback: FeedbackDTO): string {
  if (feedback.type === 'JORNADA') return `Devolutiva da Jornada #${feedback.journeyNumber ?? '—'}`
  return feedback.appointmentTitle ? `Sessão: ${feedback.appointmentTitle}` : 'Feedback de sessão'
}

function preview(text: string, max = 120) {
  const clean = text.trim().replace(/\s+/g, ' ')
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

export default function FeedbacksPage() {
  const { setUnreadFeedbacks, profile } = useStudent()
  const { data, error, loading, reload, setData } = useAsync(getMyFeedbacks, [])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('id') ? Number(params.get('id')) : null
  const markAttempted = useRef(new Set<number>())

  const feedbacks = useMemo(() => [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data])
  const counts = {
    ALL: feedbacks.length,
    UNREAD: feedbacks.filter(f => !f.read).length,
    JORNADA: feedbacks.filter(f => f.type === 'JORNADA').length,
    SESSAO: feedbacks.filter(f => f.type === 'SESSAO').length,
  }
  const visible = feedbacks.filter(f =>
    filter === 'ALL' ? true : filter === 'UNREAD' ? !f.read : f.type === filter,
  )
  const selected = feedbacks.find(f => f.id === selectedId) ?? null

  // Mantém o contador do menu em sincronia com a lista carregada
  useEffect(() => {
    if (data) setUnreadFeedbacks(data.filter(f => !f.read).length)
  }, [data, setUnreadFeedbacks])

  // Ao abrir um feedback não lido, marca como lido (otimista)
  useEffect(() => {
    if (!selected || selected.read || markAttempted.current.has(selected.id)) return
    const id = selected.id
    markAttempted.current.add(id)
    setData(list => (list ?? []).map(f => (f.id === id ? { ...f, read: true, readAt: new Date().toISOString() } : f)))
    markFeedbackAsRead(id)
      .then(updated => setData(list => (list ?? []).map(f => (f.id === id ? updated : f))))
      .catch(() => setData(list => (list ?? []).map(f => (f.id === id ? { ...f, read: false, readAt: null } : f))))
  }, [selected, setData])

  function open(feedback: FeedbackDTO) {
    setParams({ id: String(feedback.id) })
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: 'Todas' },
    { key: 'UNREAD', label: 'Não lidas' },
    { key: 'JORNADA', label: 'Devolutivas de jornada' },
    { key: 'SESSAO', label: 'Feedbacks de sessão' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Acompanhamento pedagógico"
        title="Devolutivas & feedbacks"
        description="Espaço seguro para ler as análises da equipe de psicologia escolar sobre a sua jornada e as suas sessões."
      />

      {loading && !data ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-80 lg:col-span-5" />
          <Skeleton className="h-80 lg:col-span-7" />
        </div>
      ) : error ? (
        <ErrorState message={getErrorMessage(error, 'Não foi possível carregar seus feedbacks.')} onRetry={reload} />
      ) : feedbacks.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="Nenhum feedback por enquanto"
          description="Quando a sua psicóloga enviar uma devolutiva da jornada ou um feedback de sessão, você recebe um e-mail e ele aparece aqui."
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Lista */}
          <section aria-label="Caixa de entrada" className={cn('flex-col gap-3 lg:col-span-5', selected ? 'hidden lg:flex' : 'flex')}>
            <div role="group" aria-label="Filtrar feedbacks" className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    filter === f.key ? 'bg-primary text-on-primary' : 'bg-white text-primary shadow-card hover:bg-surface-container-low',
                  )}
                >
                  {f.label}
                  <span className={cn('rounded-full px-1.5 text-[10px]', filter === f.key ? 'bg-white/20' : 'bg-surface-container')}>{counts[f.key]}</span>
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                <span className="text-sm font-bold text-on-surface">Caixa de entrada</span>
                <span className="text-xs text-muted">Mais recentes primeiro</span>
              </div>
              {visible.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">Nenhum feedback neste filtro.</p>
              ) : (
                <ul className="divide-y divide-outline-variant/60">
                  {visible.map(f => {
                    const active = f.id === selectedId
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => open(f)}
                          aria-current={active || undefined}
                          className={cn(
                            'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                            active ? 'bg-surface-container' : 'hover:bg-surface-container-low',
                          )}
                        >
                          <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', f.read ? 'bg-transparent' : 'bg-primary')} aria-hidden />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center justify-between gap-2">
                              <span className={cn('truncate text-sm', f.read ? 'font-semibold text-on-surface-variant' : 'font-bold text-on-surface')}>
                                {feedbackTitle(f)}
                              </span>
                              <span className="shrink-0 text-[11px] text-subtle">{formatLongDate(f.createdAt).replace(/ de \d{4}$/, '')}</span>
                            </span>
                            <span className="text-xs text-secondary">{f.psychologistName}</span>
                            <span className="line-clamp-2 text-xs text-muted">{preview(f.content)}</span>
                            <span className="pt-0.5 text-[11px] font-semibold">
                              {f.read ? (
                                <span className="inline-flex items-center gap-1 text-subtle">
                                  <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Lido
                                </span>
                              ) : (
                                <span className="text-primary">Não lido</span>
                              )}
                            </span>
                          </span>
                          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-subtle" aria-hidden />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Leitura */}
          <section aria-label="Leitura do feedback" className={cn('lg:col-span-7', !selected && 'hidden lg:block')}>
            {selected ? (
              <FeedbackReader feedback={selected} studentName={profile.name} onBack={() => setParams({})} />
            ) : (
              <EmptyState
                icon={Heart}
                title="Espaço de escuta ativa"
                description="Feedbacks não são notas: são reflexões para apoiar a sua decisão com autonomia. Escolha uma mensagem para ler."
              />
            )}
          </section>
        </div>
      )}
    </>
  )
}

function FeedbackReader({ feedback, studentName, onBack }: { feedback: FeedbackDTO; studentName: string; onBack: () => void }) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-card sm:p-7">
      <button type="button" onClick={onBack} className="sc-no-print inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary lg:hidden">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar à caixa de entrada
      </button>

      <div className="flex flex-col gap-3 border-b border-outline-variant pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="soft" icon={Mail}>{FEEDBACK_TYPE_LABELS[feedback.type]}</Badge>
          {feedback.journeyNumber && <Badge tone="strong">Jornada #{feedback.journeyNumber}</Badge>}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-on-surface">{feedbackTitle(feedback)}</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Enviada em {formatLongDate(feedback.createdAt)} às {formatTime(feedback.createdAt)}
          </span>
          {feedback.appointmentDateTime && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Sessão de {formatDateTime(feedback.appointmentDateTime)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-on-surface">{feedback.psychologistName}</span>
              <span className="text-xs text-muted">Psicóloga orientadora</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={Printer} onClick={() => window.print()} className="sc-no-print" aria-label="Imprimir feedback">
            Imprimir
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-surface-container-low p-3 text-xs text-on-surface-variant">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          <strong>Mensagem confidencial:</strong> protegida por sigilo profissional (Código de Ética do Psicólogo — CFP) e pela
          LGPD. Apenas você e a orientadora têm acesso.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-on-surface">
        {studentName && <p className="font-semibold">Olá, {studentName.split(' ')[0]}!</p>}
        <p className="whitespace-pre-wrap">{feedback.content}</p>
      </div>

      <div className="sc-no-print flex flex-wrap gap-2 border-t border-outline-variant pt-4">
        <ButtonLink to="/aluno/sessoes" variant="outline" size="sm" icon={CalendarDays}>
          Ver minhas sessões
        </ButtonLink>
        <ButtonLink to="/aluno/resultados" variant="outline" size="sm" icon={ChartColumn}>
          Revisar meu resultado
        </ButtonLink>
        <ButtonLink to="/aluno/feedbacks" variant="ghost" size="sm" icon={Inbox} className="lg:hidden">
          Todas as mensagens
        </ButtonLink>
      </div>
    </article>
  )
}

/**
 * @file AlunoAgendamentos.jsx
 * @description RF-16 — Área do aluno com seus agendamentos e os feedbacks da psicóloga.
 *
 * O aluno não precisa conectar o Google: o convite com o link do Meet chega
 * no e-mail dele (enviado pelo Google Agenda da psicóloga). Aqui ele também
 * encontra o link e um atalho "Adicionar ao Google Agenda".
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import SessionCard, { MeetIcon } from './components/SessionCard.jsx'
import {
  getStudentAppointments, displayStatus, formatSessionDate, isHappeningSoon, USE_MOCK,
} from '../../services/appointmentService'
import { buildAddToCalendarUrl } from '../../services/googleCalendarService'

function timeUntil(dateTime) {
  const diff = new Date(dateTime).getTime() - Date.now()
  if (diff <= 0) return 'agora'
  const min = Math.round(diff / 60000)
  if (min < 60) return `em ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `em ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'amanhã' : `em ${d} dias`
}

function MeetButton({ appointment, big = false }) {
  if (!appointment.meetLink) {
    return <span className="ag-muted-sm">O link do Meet será enviado pela orientadora.</span>
  }
  return (
    <a
      className={`ag-btn ag-btn--meet ${big ? '' : 'ag-btn--sm'}`}
      href={appointment.meetLink}
      target="_blank"
      rel="noreferrer"
    >
      <MeetIcon /> Entrar no Google Meet
    </a>
  )
}

/** Card de destaque da próxima sessão do aluno. */
function NextSession({ appointment: a, email }) {
  const live = isHappeningSoon(a)
  const eyebrow = live ? 'Sua sessão está começando' : `Próxima sessão · ${timeUntil(a.dateTime)}`
  const title = a.title || (a.scheduleType === 'GRUPO' ? 'Sessão em grupo' : 'Sessão individual')
  const withWhom = a.psychologist?.name ? `Com ${a.psychologist.name}` : 'Com sua orientadora'

  return (
    <section className={`ag-next${live ? ' ag-next--live' : ''}`}>
      <span className="ag-next__eyebrow">{eyebrow}</span>
      <h2 className="ag-next__title">{title}</h2>
      <p className="ag-next__when">{formatSessionDate(a)}</p>
      <p className="ag-next__who">
        {withWhom}
        {a.scheduleType === 'GRUPO' && ` · em grupo (${a.students.length} participantes)`}
      </p>
      {a.description && <p className="ag-next__desc">{a.description}</p>}
      <div className="ag-next__actions">
        <MeetButton appointment={a} big />
        <a className="ag-btn ag-btn--light" href={buildAddToCalendarUrl(a)} target="_blank" rel="noreferrer">
          Adicionar ao Google Agenda
        </a>
      </div>
      <p className="ag-next__hint">
        O convite também foi enviado para <strong>{email}</strong>.
      </p>
    </section>
  )
}

export default function AlunoAgendamentos() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAppointments(await getStudentAppointments(user.id, user.email))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user.id, user.email])

  useEffect(() => { load() }, [load])

  const { next, upcoming, history, feedbacks } = useMemo(() => {
    const up   = appointments.filter(a => displayStatus(a) === 'AGENDADA')
    const hist = appointments.filter(a => displayStatus(a) !== 'AGENDADA').reverse()
    const fb   = appointments
      .filter(a => a.feedback)
      .sort((a, b) => new Date(b.feedbackDate || b.dateTime) - new Date(a.feedbackDate || a.dateTime))
    return { next: up[0] ?? null, upcoming: up.slice(1), history: hist, feedbacks: fb }
  }, [appointments])

  return (
    <>
      <div className="ag-page-head">
        <div>
          <h1 className="ag-h1">Meus agendamentos</h1>
          <p className="ag-sub">Suas sessões com a orientadora e os feedbacks que ela enviou para você.</p>
        </div>
      </div>

      {USE_MOCK && (
        <div className="ag-note">
          Modo demonstração: os agendamentos vêm do armazenamento local deste navegador.
        </div>
      )}

      {loading && <div className="ag-state"><div className="ag-spinner" />Carregando seus agendamentos…</div>}

      {!loading && error && (
        <div className="ag-state ag-state--error">
          {error}
          <button className="ag-btn ag-btn--ghost ag-btn--sm" onClick={load}>Tentar de novo</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Próxima sessão em destaque */}
          {next ? (
            <NextSession appointment={next} email={user.email} />
          ) : (
            <div className="ag-empty ag-empty--card">
              Você não tem sessões agendadas no momento. Quando sua orientadora marcar uma,
              ela aparece aqui e o convite chega no seu e-mail.
            </div>
          )}

          {/* Outras próximas */}
          {upcoming.length > 0 && (
            <section className="ag-section">
              <h2 className="ag-h2">Também agendadas</h2>
              <div className="ag-list">
                {upcoming.map(a => (
                  <SessionCard key={a.id} appointment={a} viewer="aluno">
                    <MeetButton appointment={a} />
                    <a className="ag-btn ag-btn--ghost ag-btn--sm" href={buildAddToCalendarUrl(a)} target="_blank" rel="noreferrer">
                      Adicionar à agenda
                    </a>
                  </SessionCard>
                ))}
              </div>
            </section>
          )}

          {/* Feedbacks */}
          <section className="ag-section">
            <h2 className="ag-h2">Feedbacks da orientadora</h2>
            {feedbacks.length === 0 ? (
              <div className="ag-empty">Depois das sessões, os feedbacks da sua orientadora aparecem aqui.</div>
            ) : (
              <div className="ag-list">
                {feedbacks.map(a => (
                  <article key={a.id} className="ag-feedback">
                    <header className="ag-feedback__head">
                      <span className="ag-feedback__avatar" aria-hidden="true">
                        {(a.psychologist?.name ?? 'O').charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <strong>{a.psychologist?.name ?? 'Sua orientadora'}</strong>
                        <span className="ag-feedback__meta">
                          {a.title || 'Sessão'} · {new Date(a.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        </span>
                      </div>
                    </header>
                    <p className="ag-feedback__text">{a.feedback}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Histórico */}
          {history.length > 0 && (
            <section className="ag-section">
              <h2 className="ag-h2">Histórico</h2>
              <div className="ag-list">
                {history.map(a => <SessionCard key={a.id} appointment={a} viewer="aluno" />)}
              </div>
            </section>
          )}
        </>
      )}
    </>
  )
}
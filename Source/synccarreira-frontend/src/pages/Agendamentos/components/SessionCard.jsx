/**
 * @file SessionCard.jsx
 * @description Card de uma sessão agendada. Usado pela psicóloga e pelo aluno.
 *
 * As ações (botões) são passadas como `children`, assim cada perfil
 * decide o que pode fazer com a sessão.
 */

import {
  displayStatus, STATUS_LABEL, TYPES, formatSessionDate, isHappeningSoon,
} from '../../../services/appointmentService'

export function MeetIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="13" height="12" rx="2" />
      <path d="M15 10l5-3v10l-5-3z" />
    </svg>
  )
}

/**
 * @param {Object}  props
 * @param {Object}  props.appointment
 * @param {'psicologa'|'aluno'} props.viewer - muda o texto de "com quem" é a sessão
 * @param {React.ReactNode} [props.children] - botões de ação
 */
export default function SessionCard({ appointment: a, viewer, children }) {
  const status = displayStatus(a)
  const start  = new Date(a.dateTime)
  const soon   = status === 'AGENDADA' && isHappeningSoon(a)

  const withWhom = viewer === 'psicologa'
    ? a.students.map(s => s.name).join(', ') || 'Sem participantes'
    : a.psychologist?.name ? `com ${a.psychologist.name}` : 'com sua orientadora'

  return (
    <article className={`ag-card ag-card--${status.toLowerCase()}${soon ? ' ag-card--soon' : ''}`}>
      <div className="ag-card__date" aria-hidden="true">
        <span className="ag-card__day">{start.getDate().toString().padStart(2, '0')}</span>
        <span className="ag-card__month">
          {start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
        </span>
      </div>

      <div className="ag-card__body">
        <div className="ag-card__top">
          <h3 className="ag-card__title">
            {a.title || (a.scheduleType === TYPES.GRUPO ? 'Sessão em grupo' : 'Sessão individual')}
          </h3>
          <span className={`ag-badge ag-badge--${status.toLowerCase()}`}>
            {soon ? 'Agora' : STATUS_LABEL[status]}
          </span>
        </div>

        <p className="ag-card__when">{formatSessionDate(a)}</p>

        <p className="ag-card__who">
          <span className={`ag-chip${a.scheduleType === TYPES.GRUPO ? ' ag-chip--group' : ''}`}>
            {a.scheduleType === TYPES.GRUPO ? `Grupo · ${a.students.length}` : 'Individual'}
          </span>
          <span className="ag-card__names">{withWhom}</span>
        </p>

        {a.description && <p className="ag-card__desc">{a.description}</p>}

        {status === 'CANCELADA' && a.cancelReason && (
          <p className="ag-card__cancel">Motivo do cancelamento: {a.cancelReason}</p>
        )}

        {children && <div className="ag-card__actions">{children}</div>}
      </div>
    </article>
  )
}
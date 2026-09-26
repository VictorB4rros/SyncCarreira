/**
 * @file SessionFormModal.jsx
 * @description Formulário para criar/editar uma sessão (individual ou em grupo).
 *
 * Este componente só coleta e valida os dados. Quem salva (Google + backend)
 * é a página, através da prop `onSubmit(form)`.
 */

import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { TYPES } from '../../../services/appointmentService'
import { isGoogleConfigured } from '../../../services/googleCalendarService'

const DURATIONS = [30, 45, 50, 60, 90]

/** "2026-10-01T14:00:00" → { date: "2026-10-01", time: "14:00" } */
function splitDateTime(dt) {
  if (!dt) return { date: '', time: '' }
  const [date, time = ''] = dt.split('T')
  return { date, time: time.slice(0, 5) }
}

function todayISO() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * @param {Object}   props
 * @param {Object}   [props.initial]   - sessão existente (modo edição)
 * @param {Array}    props.students    - alunos disponíveis [{id,name,email,className}]
 * @param {boolean}  props.loadingStudents
 * @param {Function} props.onSubmit    - async (form) => void
 * @param {Function} props.onClose
 */
export default function SessionFormModal({ initial, students, loadingStudents, onSubmit, onClose }) {
  const editing = Boolean(initial)
  const { date: d0, time: t0 } = splitDateTime(initial?.dateTime)

  const [scheduleType, setType]   = useState(initial?.scheduleType ?? TYPES.INDIVIDUAL)
  const [selectedIds, setSelected] = useState(() => new Set(initial?.students?.map(s => s.id) ?? []))
  const [title, setTitle]         = useState(initial?.title ?? '')
  const [date, setDate]           = useState(d0)
  const [time, setTime]           = useState(t0)
  const [duration, setDuration]   = useState(initial?.durationMinutes ?? 50)
  const [description, setDesc]    = useState(initial?.description ?? '')
  const [syncGoogle, setSync]     = useState(isGoogleConfigured())
  const [search, setSearch]       = useState('')

  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  // Alunos da sessão em edição que por algum motivo não vieram na lista
  const allStudents = useMemo(() => {
    const map = new Map(students.map(s => [s.id, s]))
    initial?.students?.forEach(s => { if (!map.has(s.id)) map.set(s.id, s) })
    return [...map.values()]
  }, [students, initial])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allStudents
    return allStudents.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.className?.toLowerCase().includes(q))
  }, [allStudents, search])

  function changeType(type) {
    setType(type)
    // ao voltar para individual, mantém no máximo 1 aluno
    if (type === TYPES.INDIVIDUAL && selectedIds.size > 1) {
      setSelected(new Set([[...selectedIds][0]]))
    }
  }

  function toggleStudent(id) {
    setError('')
    setSelected(prev => {
      if (scheduleType === TYPES.INDIVIDUAL) return new Set([id])
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const chosen = allStudents.filter(s => selectedIds.has(s.id))

    if (chosen.length === 0) {
      return setError(scheduleType === TYPES.GRUPO
        ? 'Selecione ao menos um aluno para a sessão em grupo.'
        : 'Selecione o aluno da sessão.')
    }
    if (scheduleType === TYPES.GRUPO && chosen.length < 2) {
      return setError('Uma sessão em grupo precisa de pelo menos 2 alunos.')
    }
    if (!date || !time) return setError('Informe a data e o horário da sessão.')

    const dateTime = `${date}T${time}:00`
    if (new Date(dateTime) <= new Date()) {
      return setError('Escolha uma data e horário no futuro.')
    }

    const semEmail = chosen.filter(s => !s.email)
    if (syncGoogle && semEmail.length) {
      return setError(`Sem e-mail cadastrado: ${semEmail.map(s => s.name).join(', ')}. O convite do Google não pode ser enviado.`)
    }

    setBusy(true)
    try {
      await onSubmit({
        scheduleType,
        students: chosen,
        title: title.trim(),
        description: description.trim(),
        dateTime,
        durationMinutes: Number(duration),
        syncGoogle,
      })
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a sessão.')
      setBusy(false)
    }
  }

  const footer = (
    <>
      <button type="button" className="ag-btn ag-btn--ghost" onClick={onClose} disabled={busy}>
        Voltar
      </button>
      <button type="submit" form="ag-session-form" className="ag-btn ag-btn--primary" disabled={busy}>
        {busy
          ? (syncGoogle ? 'Sincronizando com o Google…' : 'Salvando…')
          : (editing ? 'Salvar alterações' : 'Agendar sessão')}
      </button>
    </>
  )

  return (
    <Modal
      title={editing ? 'Editar sessão' : 'Nova sessão'}
      subtitle={editing
        ? 'Os participantes serão avisados da alteração pelo Google Agenda.'
        : 'Os alunos recebem o convite com o link do Google Meet no e-mail.'}
      onClose={onClose}
      busy={busy}
      footer={footer}
      wide
    >
      <form id="ag-session-form" className="ag-form" onSubmit={handleSubmit} noValidate>

        {/* Tipo */}
        <div className="ag-field">
          <span className="ag-label">Tipo de sessão</span>
          <div className="ag-segment" role="radiogroup">
            {[
              { id: TYPES.INDIVIDUAL, label: 'Individual' },
              { id: TYPES.GRUPO,      label: 'Em grupo' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={scheduleType === opt.id}
                className={`ag-segment__opt${scheduleType === opt.id ? ' ag-segment__opt--on' : ''}`}
                onClick={() => changeType(opt.id)}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Alunos */}
        <div className="ag-field">
          <span className="ag-label">
            {scheduleType === TYPES.GRUPO ? 'Alunos participantes' : 'Aluno'}
            {selectedIds.size > 0 && <em className="ag-label__count">{selectedIds.size} selecionado(s)</em>}
          </span>

          <input
            type="search"
            className="ag-input"
            placeholder="Buscar por nome, e-mail ou turma…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="ag-picker" role="listbox" aria-multiselectable={scheduleType === TYPES.GRUPO}>
            {loadingStudents && <p className="ag-picker__empty">Carregando alunos…</p>}
            {!loadingStudents && filtered.length === 0 && (
              <p className="ag-picker__empty">Nenhum aluno encontrado.</p>
            )}
            {!loadingStudents && filtered.map(s => {
              const on = selectedIds.has(s.id)
              return (
                <label key={s.id} className={`ag-picker__item${on ? ' ag-picker__item--on' : ''}`}>
                  <input
                    type={scheduleType === TYPES.GRUPO ? 'checkbox' : 'radio'}
                    name="ag-student"
                    checked={on}
                    onChange={() => toggleStudent(s.id)}
                  />
                  <span className="ag-picker__avatar" aria-hidden="true">
                    {s.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                  <span className="ag-picker__info">
                    <span className="ag-picker__name">{s.name}</span>
                    <span className="ag-picker__meta">
                      {s.email || 'sem e-mail'}{s.className ? ` · ${s.className}` : ''}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Título */}
        <div className="ag-field">
          <label className="ag-label" htmlFor="ag-title">Título <em>(opcional)</em></label>
          <input
            id="ag-title"
            className="ag-input"
            maxLength={120}
            placeholder={scheduleType === TYPES.GRUPO ? 'Ex.: Roda de conversa — Plano de futuro' : 'Ex.: Conversa sobre a trilha Autoconhecimento'}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Data / hora / duração */}
        <div className="ag-row">
          <div className="ag-field">
            <label className="ag-label" htmlFor="ag-date">Data</label>
            <input id="ag-date" type="date" className="ag-input" min={todayISO()}
                   value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="ag-field">
            <label className="ag-label" htmlFor="ag-time">Horário</label>
            <input id="ag-time" type="time" className="ag-input" step={300}
                   value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="ag-field">
            <label className="ag-label" htmlFor="ag-duration">Duração</label>
            <select id="ag-duration" className="ag-input" value={duration}
                    onChange={e => setDuration(e.target.value)}>
              {DURATIONS.map(m => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        </div>

        {/* Pauta */}
        <div className="ag-field">
          <label className="ag-label" htmlFor="ag-desc">Pauta / observações para o aluno <em>(opcional)</em></label>
          <textarea
            id="ag-desc"
            className="ag-input ag-textarea"
            rows={3}
            maxLength={1000}
            placeholder="Aparece no convite do Google Agenda e na área do aluno."
            value={description}
            onChange={e => setDesc(e.target.value)}
          />
        </div>

        {/* Google */}
        <label className={`ag-google-opt${!isGoogleConfigured() ? ' ag-google-opt--off' : ''}`}>
          <input
            type="checkbox"
            checked={syncGoogle}
            disabled={!isGoogleConfigured()}
            onChange={e => setSync(e.target.checked)}
          />
          <span>
            <strong>Criar Google Meet e avisar pelo Google Agenda</strong>
            <small>
              {isGoogleConfigured()
                ? 'O evento é criado na sua agenda Google e o convite é enviado ao e-mail de cada aluno.'
                : 'Indisponível: configure VITE_GOOGLE_CLIENT_ID no .env do front.'}
            </small>
          </span>
        </label>

        {error && <div className="ag-error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}
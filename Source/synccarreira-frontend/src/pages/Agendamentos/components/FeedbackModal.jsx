/**
 * @file FeedbackModal.jsx
 * @description Psicóloga registra o feedback de uma sessão realizada (visível ao aluno — RF-16).
 */

import { useState } from 'react'
import Modal from './Modal.jsx'
import { formatSessionDate, TYPES } from '../../../services/appointmentService'

const MAX = 2000

export default function FeedbackModal({ appointment, onSave, onClose }) {
  const [text, setText]   = useState(appointment.feedback ?? '')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!text.trim()) return setError('Escreva o feedback antes de enviar.')
    setBusy(true)
    setError('')
    try {
      await onSave(text.trim())
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o feedback.')
      setBusy(false)
    }
  }

  const names = appointment.students.map(s => s.name).join(', ')

  return (
    <Modal
      title={appointment.feedback ? 'Editar feedback' : 'Enviar feedback'}
      subtitle={`${formatSessionDate(appointment)} · ${names}`}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className="ag-btn ag-btn--ghost" onClick={onClose} disabled={busy}>
            Voltar
          </button>
          <button type="button" className="ag-btn ag-btn--primary" onClick={handleSave} disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar feedback'}
          </button>
        </>
      }
    >
      {appointment.scheduleType === TYPES.GRUPO && (
        <p className="ag-modal__text">
          Sessão em grupo: este feedback ficará visível para <strong>todos os participantes</strong>.
        </p>
      )}
      <div className="ag-field">
        <label className="ag-label" htmlFor="ag-feedback">Feedback para o aluno</label>
        <textarea
          id="ag-feedback"
          className="ag-input ag-textarea"
          rows={7}
          maxLength={MAX}
          placeholder="Pontos conversados, combinados e próximos passos…"
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        <span className="ag-counter">{text.length}/{MAX}</span>
      </div>
      {error && <div className="ag-error" role="alert">{error}</div>}
    </Modal>
  )
}
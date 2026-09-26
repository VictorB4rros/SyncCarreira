/**
 * @file appointmentService.js
 * @description Agendamentos de sessões (RF-08 psicóloga / RF-16 aluno).
 *
 * Endpoints esperados no backend (ver API_CONTRACT.md → "6. Agendamentos"):
 *  - GET   /appointments/psychologist/{id}   → sessões da psicóloga
 *  - GET   /appointments/student/{id}        → sessões do aluno
 *  - POST  /appointments                     → cria sessão
 *  - PUT   /appointments/{id}                → edita sessão
 *  - PATCH /appointments/{id}/cancel         → cancela sessão
 *  - PUT   /appointments/{id}/feedback       → registra feedback
 *
 * ─── Modo mock ────────────────────────────────────────────────
 * Enquanto o backend não expõe esses endpoints, defina no .env:
 *   VITE_APPOINTMENTS_MOCK=true
 * Os agendamentos passam a ser salvos no localStorage do navegador.
 * (A integração com o Google Agenda/Meet funciona normalmente no mock.)
 */

import api from './api'

export const USE_MOCK = import.meta.env.VITE_APPOINTMENTS_MOCK === 'true'

export const STATUS = {
  AGENDADA:  'AGENDADA',
  CANCELADA: 'CANCELADA',
  REALIZADA: 'REALIZADA',
}

export const TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  GRUPO:      'GRUPO',
}

// ─── Normalização (backend → front) ───────────────────────────

function normalize(a) {
  if (!a) return a
  return {
    id:              a.id,
    title:           a.title ?? '',
    description:     a.description ?? '',
    dateTime:        a.dateTime,
    durationMinutes: a.durationMinutes ?? 50,
    scheduleType:    a.scheduleType ?? TYPES.INDIVIDUAL,
    scheduleStatus:  a.scheduleStatus ?? STATUS.AGENDADA,
    psychologist:    a.psychologist ?? null,
    students:        a.students ?? (a.student ? [a.student] : []),
    googleEventId:   a.googleEventId ?? null,
    meetLink:        a.meetLink ?? null,
    calendarLink:    a.calendarLink ?? null,
    feedback:        a.feedback ?? null,
    feedbackDate:    a.feedbackDate ?? null,
    cancelReason:    a.cancelReason ?? null,
  }
}

/** Monta o corpo enviado ao backend a partir do formulário. */
function toRequest(data) {
  return {
    title:           data.title,
    description:     data.description,
    dateTime:        data.dateTime.length === 16 ? `${data.dateTime}:00` : data.dateTime,
    durationMinutes: Number(data.durationMinutes),
    scheduleType:    data.scheduleType,
    psychologistId:  data.psychologist?.id,
    studentIds:      data.students.map(s => s.id),
    googleEventId:   data.googleEventId ?? null,
    meetLink:        data.meetLink ?? null,
    calendarLink:    data.calendarLink ?? null,
  }
}

function extractError(error, fallback) {
  const errs = error.response?.data?.errors
  if (errs?.length) return new Error(errs.map(e => e.message).join(' '))
  const msg = error.response?.data?.error || error.response?.data?.message
  if (msg) return new Error(msg)
  if (error.code === 'ECONNABORTED' || !error.response) {
    return new Error('Não foi possível falar com o servidor. Tente novamente.')
  }
  if (error.response?.status === 404) {
    return new Error('Endpoint de agendamentos não encontrado no backend. Ative VITE_APPOINTMENTS_MOCK=true enquanto ele não existir.')
  }
  return new Error(fallback)
}

// ─── Implementação mock (localStorage) ────────────────────────

const MOCK_KEY = 'sc_appointments_mock'

const mock = {
  read() {
    try { return JSON.parse(localStorage.getItem(MOCK_KEY)) ?? [] } catch { return [] }
  },
  write(list) {
    localStorage.setItem(MOCK_KEY, JSON.stringify(list))
  },
  delay(v) {
    return new Promise(r => setTimeout(() => r(v), 250))
  },
  async byPsychologist(id) {
    return this.delay(this.read().filter(a => a.psychologist?.id === id))
  },
  async byStudent(id, email) {
    return this.delay(this.read().filter(a =>
      a.students.some(s => s.id === id || (email && s.email === email))))
  },
  async create(data) {
    const list = this.read()
    const item = normalize({
      ...toRequest(data),
      id: Date.now(),
      scheduleStatus: STATUS.AGENDADA,
      psychologist: data.psychologist,
      students: data.students.map(({ id, name, email }) => ({ id, name, email })),
    })
    list.push(item)
    this.write(list)
    return this.delay(item)
  },
  async patch(id, changes) {
    const list = this.read()
    const idx = list.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Agendamento não encontrado.')
    list[idx] = normalize({ ...list[idx], ...changes })
    this.write(list)
    return this.delay(list[idx])
  },
}

// ─── API pública do service ───────────────────────────────────

const byDate = (a, b) => new Date(a.dateTime) - new Date(b.dateTime)

/** Sessões da psicóloga logada. */
export async function getPsychologistAppointments(psychologistId) {
  if (USE_MOCK) return (await mock.byPsychologist(psychologistId)).map(normalize).sort(byDate)
  try {
    const { data } = await api.get(`/appointments/psychologist/${psychologistId}`)
    return (data.content ?? data).map(normalize).sort(byDate)
  } catch (e) { throw extractError(e, 'Não foi possível carregar os agendamentos.') }
}

/** Sessões do aluno logado. */
export async function getStudentAppointments(studentId, email) {
  if (USE_MOCK) return (await mock.byStudent(studentId, email)).map(normalize).sort(byDate)
  try {
    const { data } = await api.get(`/appointments/student/${studentId}`)
    return (data.content ?? data).map(normalize).sort(byDate)
  } catch (e) { throw extractError(e, 'Não foi possível carregar seus agendamentos.') }
}

/**
 * Cria a sessão.
 * @param {Object} data - dados do formulário + psychologist + students + dados do Google
 */
export async function createAppointment(data) {
  if (USE_MOCK) return mock.create(data)
  try {
    const { data: resp } = await api.post('/appointments', toRequest(data))
    return normalize(resp)
  } catch (e) { throw extractError(e, 'Não foi possível criar o agendamento.') }
}

/** Edita a sessão. */
export async function updateAppointment(id, data) {
  if (USE_MOCK) {
    const req = toRequest(data)
    return mock.patch(id, {
      ...req,
      students: data.students.map(({ id: sid, name, email }) => ({ id: sid, name, email })),
    })
  }
  try {
    const { data: resp } = await api.put(`/appointments/${id}`, toRequest(data))
    return normalize(resp)
  } catch (e) { throw extractError(e, 'Não foi possível atualizar o agendamento.') }
}

/** Cancela a sessão. */
export async function cancelAppointment(id, cancelReason = '') {
  if (USE_MOCK) return mock.patch(id, { scheduleStatus: STATUS.CANCELADA, cancelReason })
  try {
    const { data } = await api.patch(`/appointments/${id}/cancel`, { cancelReason })
    return normalize(data)
  } catch (e) { throw extractError(e, 'Não foi possível cancelar o agendamento.') }
}

/** Registra/atualiza o feedback da psicóloga sobre a sessão. */
export async function sendFeedback(id, feedback) {
  if (USE_MOCK) {
    return mock.patch(id, {
      feedback,
      feedbackDate: new Date().toISOString(),
      scheduleStatus: STATUS.REALIZADA,
    })
  }
  try {
    const { data } = await api.put(`/appointments/${id}/feedback`, { feedback })
    return normalize(data)
  } catch (e) { throw extractError(e, 'Não foi possível enviar o feedback.') }
}

// ─── Helpers de exibição ──────────────────────────────────────

/**
 * Status "visual" da sessão:
 *  - CANCELADA → cancelada
 *  - REALIZADA ou horário já passou → realizada
 *  - senão → agendada
 */
export function displayStatus(a) {
  if (a.scheduleStatus === STATUS.CANCELADA) return STATUS.CANCELADA
  if (a.scheduleStatus === STATUS.REALIZADA) return STATUS.REALIZADA
  const end = new Date(a.dateTime).getTime() + (a.durationMinutes || 50) * 60000
  return end < Date.now() ? STATUS.REALIZADA : STATUS.AGENDADA
}

export const STATUS_LABEL = {
  AGENDADA:  'Agendada',
  CANCELADA: 'Cancelada',
  REALIZADA: 'Realizada',
}

/** "qua., 01 de out. · 14:00 – 14:50" */
export function formatSessionDate(a) {
  const start = new Date(a.dateTime)
  const end   = new Date(start.getTime() + (a.durationMinutes || 50) * 60000)
  const day = start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
  const hh  = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const text = `${day} · ${hh(start)} – ${hh(end)}`
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** true se a sessão começa em até 15 min ou está acontecendo agora */
export function isHappeningSoon(a) {
  const start = new Date(a.dateTime).getTime()
  const end   = start + (a.durationMinutes || 50) * 60000
  const now   = Date.now()
  return now >= start - 15 * 60000 && now <= end
}
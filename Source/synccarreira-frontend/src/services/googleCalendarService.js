/**
 * @file googleCalendarService.js
 * @description Integração com Google Calendar + Google Meet (RF-08).
 *
 * Como funciona:
 *  1. A psicóloga clica em "Conectar Google" → abre o popup de login/consentimento
 *     do Google (Google Identity Services) e recebemos um access_token com o
 *     escopo `calendar.events`.
 *  2. Ao criar uma sessão, criamos um evento na agenda PRINCIPAL da psicóloga,
 *     com os alunos como convidados (attendees) e pedindo ao Google que gere
 *     um link do Google Meet (conferenceData).
 *  3. Usamos `sendUpdates=all`: o próprio Google envia o convite por e-mail
 *     para o aluno, e o evento aparece no Google Agenda dele.
 *     Editar → Google envia "Evento atualizado". Cancelar → "Evento cancelado".
 *
 * Nenhum segredo fica no front: só o CLIENT_ID (público) do OAuth.
 * Configure em .env:  VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
 *
 * Referências:
 *  - https://developers.google.com/identity/oauth2/web/guides/use-token-model
 *  - https://developers.google.com/calendar/api/v3/reference/events
 */

const CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPE        = 'https://www.googleapis.com/auth/calendar.events'
const GIS_SRC      = 'https://accounts.google.com/gsi/client'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export const TIME_ZONE =
  Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'

// Estado em memória (o token do Google NÃO é salvo no localStorage por segurança)
let tokenClient = null
let accessToken = null
let tokenExpiresAt = 0
let gisLoading = null

/** true se o CLIENT_ID do Google foi configurado no .env */
export const isGoogleConfigured = () => Boolean(CLIENT_ID)

/** true se já temos um token válido do Google nesta aba */
export const isGoogleConnected = () => Boolean(accessToken) && Date.now() < tokenExpiresAt

// ─── Carregamento do script do Google Identity Services ───────

function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoading) return gisLoading

  gisLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      gisLoading = null
      reject(new Error('Não foi possível carregar o login do Google. Verifique sua conexão.'))
    }
    document.head.appendChild(script)
  })
  return gisLoading
}

/**
 * Pré-carrega o script do Google ao abrir a página. Assim, quando a psicóloga
 * clicar em "Conectar"/"Agendar", o popup abre na hora e não é bloqueado.
 */
export function preloadGoogle() {
  if (CLIENT_ID) loadGis().catch(() => {})
}

/**
 * Abre o popup do Google e obtém um access_token para a agenda.
 * Deve ser chamado a partir de um clique do usuário (senão o navegador bloqueia o popup).
 *
 * @param {string} [loginHint] - e-mail da psicóloga, para pré-selecionar a conta
 * @returns {Promise<string>} access token
 */
export async function connectGoogle(loginHint) {
  if (!CLIENT_ID) {
    throw new Error('Integração com Google não configurada (VITE_GOOGLE_CLIENT_ID ausente no .env).')
  }
  if (isGoogleConnected()) return accessToken

  await loadGis()

  return new Promise((resolve, reject) => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error('O Google recusou o acesso à agenda: ' + resp.error))
          return
        }
        accessToken = resp.access_token
        // margem de 60 s antes de expirar
        tokenExpiresAt = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000
        resolve(accessToken)
      },
      error_callback: (err) => {
        reject(new Error(
          err?.type === 'popup_closed'
            ? 'A janela do Google foi fechada antes de concluir.'
            : 'Não foi possível conectar ao Google.'
        ))
      },
    })
    tokenClient.requestAccessToken({ prompt: '', login_hint: loginHint })
  })
}

/** Revoga o token atual e "desconecta" a conta Google. */
export function disconnectGoogle() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {})
  }
  accessToken = null
  tokenExpiresAt = 0
}

// ─── Chamadas à Calendar API ──────────────────────────────────

async function calendarFetch(path, { method = 'GET', query = {}, body } = {}) {
  if (!isGoogleConnected()) {
    throw new Error('Conecte sua conta Google para sincronizar a agenda.')
  }

  const url = new URL(CALENDAR_API + path)
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))

  const resp = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (resp.status === 401) {
    accessToken = null
    throw new Error('Sua sessão do Google expirou. Conecte novamente.')
  }
  // 410 = evento já foi removido no Google → tratamos como sucesso no cancelamento
  if (resp.status === 204 || resp.status === 410) return null
  if (!resp.ok) {
    let msg = `Erro ${resp.status} no Google Agenda.`
    try {
      const err = await resp.json()
      if (err?.error?.message) msg = `Google Agenda: ${err.error.message}`
    } catch { /* ignora */ }
    throw new Error(msg)
  }
  return resp.json()
}

/** Soma minutos a uma data "YYYY-MM-DDTHH:mm[:ss]" local e devolve no mesmo formato. */
export function addMinutesLocal(localDateTime, minutes) {
  const d = new Date(localDateTime)
  d.setMinutes(d.getMinutes() + Number(minutes))
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function buildEventBody(session) {
  const start = session.dateTime.length === 16 ? `${session.dateTime}:00` : session.dateTime
  const end   = addMinutesLocal(start, session.durationMinutes || 50)

  const tipo = session.scheduleType === 'GRUPO' ? 'Sessão em grupo' : 'Sessão individual'

  return {
    summary: session.title || `SyncCarreira · ${tipo}`,
    description: [
      session.description,
      '',
      `${tipo} de orientação de carreira agendada pela plataforma SyncCarreira.`,
      'Entre pelo link do Google Meet no horário marcado.',
    ].filter(v => v !== undefined).join('\n'),
    start: { dateTime: start, timeZone: TIME_ZONE },
    end:   { dateTime: end,   timeZone: TIME_ZONE },
    attendees: session.students
      .filter(s => s.email)
      .map(s => ({ email: s.email, displayName: s.name })),
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 dia antes
        { method: 'popup', minutes: 15 },
      ],
    },
    extendedProperties: {
      shared: { origem: 'synccarreira' },
    },
  }
}

/** Extrai o link do Meet do evento retornado pelo Google. */
function meetLinkOf(event) {
  return event?.hangoutLink
    || event?.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri
    || null
}

/**
 * O Google às vezes devolve a sala do Meet como "pending".
 * Consultamos o evento mais algumas vezes até o link aparecer.
 */
async function waitForMeetLink(event) {
  let current = event
  for (let i = 0; i < 4 && !meetLinkOf(current); i++) {
    await new Promise(r => setTimeout(r, 1000))
    current = await calendarFetch(`/${event.id}`)
  }
  return current
}

function toResult(event) {
  return {
    googleEventId: event.id,
    meetLink:      meetLinkOf(event),
    calendarLink:  event.htmlLink || null,
  }
}

/**
 * Cria o evento com Google Meet e envia o convite aos alunos.
 * @param {Object} session - { title, description, dateTime, durationMinutes, scheduleType, students:[{name,email}] }
 * @returns {Promise<{googleEventId:string, meetLink:string|null, calendarLink:string|null}>}
 */
export async function createMeetEvent(session) {
  const body = buildEventBody(session)
  body.conferenceData = {
    createRequest: {
      requestId: crypto.randomUUID?.() ?? String(Date.now()),
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  }

  const created = await calendarFetch('', {
    method: 'POST',
    query: { conferenceDataVersion: 1, sendUpdates: 'all' },
    body,
  })
  return toResult(await waitForMeetLink(created))
}

/**
 * Atualiza data/horário/participantes do evento. O Google avisa os convidados.
 * Se o evento ainda não tinha Meet, cria um.
 */
export async function updateMeetEvent(googleEventId, session) {
  const body = buildEventBody(session)
  if (!session.meetLink) {
    body.conferenceData = {
      createRequest: {
        requestId: crypto.randomUUID?.() ?? String(Date.now()),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const updated = await calendarFetch(`/${googleEventId}`, {
    method: 'PATCH',
    query: { conferenceDataVersion: 1, sendUpdates: 'all' },
    body,
  })
  return toResult(await waitForMeetLink(updated))
}

/** Cancela (remove) o evento. O Google envia o aviso de cancelamento aos alunos. */
export async function cancelMeetEvent(googleEventId) {
  await calendarFetch(`/${googleEventId}`, {
    method: 'DELETE',
    query: { sendUpdates: 'all' },
  })
}

/**
 * Link "Adicionar ao Google Agenda" (não exige login/API).
 * Usado na área do aluno como atalho caso ele não tenha recebido o convite.
 */
export function buildAddToCalendarUrl(appointment) {
  const fmt = (local) => {
    const d = new Date(local)
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }
  const start = appointment.dateTime
  const end   = addMinutesLocal(start, appointment.durationMinutes || 50)
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    appointment.title || 'Sessão SyncCarreira',
    dates:   `${fmt(start)}/${fmt(end)}`,
    details: [appointment.description, appointment.meetLink && `Google Meet: ${appointment.meetLink}`]
      .filter(Boolean).join('\n\n'),
    ctz:     TIME_ZONE,
  })
  if (appointment.meetLink) params.set('location', appointment.meetLink)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
/**
 * @file googleCalendarService.js
 * @description Integração com Google Calendar + Google Meet (RF-08).
 *
 * Como funciona:
 *  1. A psicóloga clica em "Conectar Google" → abre o popup de login/consentimento
 *     do Google (Google Identity Services) e recebemos um access_token com o
 *     escopo `calendar.events`.
 *  2. Ao criar uma sessão, criamos um evento na agenda PRINCIPAL da psicóloga,
 *     com os alunos como convidados (attendees) e pedindo ao Google que geregit
 *     um link do Google Meet (conferenceData).
 *  3. Usamos `sendUpdates=all`: o próprio Google envia o convite por e-mail
 *     para o aluno, e o evento aparece no Google Agenda dele.
 *     Editar → Google envia "Evento atualizado". Cancelar → "Evento cancelado".
 *
 * Cuidados de produção implementados aqui:
 *  - Fuso fixo da instituição (VITE_TIME_ZONE, padrão America/Sao_Paulo), igual ao
 *    backend, para o horário não mudar conforme o computador da psicóloga.
 *  - Confere se a psicóloga marcou a permissão da agenda no consentimento.
 *  - Mensagens claras para popup bloqueado, popup fechado e acesso negado.
 *  - Novas tentativas automáticas em falhas temporárias (rede, 429 e 5xx).
 *  - ID do evento gerado no front: se a criação for repetida, não duplica o evento.
 *  - Editar um evento que sumiu do Google (apagado ou criado por outra conta) cria
 *    um evento novo. Cancelar um evento que já não existe conta como sucesso.it
 * 
 * Nenhum segredo fica no front: só o CLIENT_ID (público) do OAuth.
 * O token do Google fica só em memória (não vai para localStorage/sessionStorage).
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

/** Fuso da instituição. Os horários do backend são LocalDateTime nesse fuso. */
export const TIME_ZONE = import.meta.env.VITE_TIME_ZONE || 'America/Sao_Paulo'

const DEFAULT_DURATION_MINUTES = 50
const MAX_ATTEMPTS = 3
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const MEET_POLL_ATTEMPTS = 5

// Estado em memória
let tokenClient = null
let accessToken = null
let tokenExpiresAt = 0
let gisLoading = null
let pendingToken = null // { promise, resolve, reject } enquanto o popup está aberto

/** Erro com o status HTTP do Google, para quem chamou decidir o que fazer. */
class GoogleCalendarError extends Error {
  constructor(message, status = 0, reason = '') {
    super(message)
    this.name = 'GoogleCalendarError'
    this.status = status
    this.reason = reason
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** true se o CLIENT_ID do Google foi configurado no .env */
export const isGoogleConfigured = () => Boolean(CLIENT_ID)

/** true se já temos um token válido do Google nesta aba */
export const isGoogleConnected = () => Boolean(accessToken) && Date.now() < tokenExpiresAt

function clearToken() {
  accessToken = null
  tokenExpiresAt = 0
}

// ─── Login do Google (Google Identity Services) ───────────────

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
      reject(new GoogleCalendarError(
        'Não foi possível carregar o login do Google. Verifique a conexão ou se algum bloqueador está impedindo o acesso a accounts.google.com.'
      ))
    }
    document.head.appendChild(script)
  })
  return gisLoading
}

/**
 * Pré-carrega o script do Google ao abrir a página. Assim, no clique em
 * "Conectar"/"Agendar", o popup abre na hora e o navegador não o bloqueia.
 */
export function preloadGoogle() {
  if (CLIENT_ID) loadGis().catch(() => undefined)
}

function finishPending(action, value) {
  const pending = pendingToken
  pendingToken = null
  if (pending) pending[action](value)
}

function handleTokenResponse(resp) {
  if (resp.error) {
    const message = resp.error === 'access_denied'
      ? 'Você não autorizou o acesso à agenda. Sem essa permissão não dá para criar o link do Meet.'
      : `O Google recusou o acesso à agenda (${resp.error}).`
    finishPending('reject', new GoogleCalendarError(message, 0, resp.error))
    return
  }
  // No consentimento, a pessoa pode desmarcar a permissão da agenda
  if (!window.google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPE)) {
    finishPending('reject', new GoogleCalendarError(
      'É preciso marcar a permissão "Ver e editar eventos em todas as suas agendas" na tela do Google. Clique em conectar de novo e marque essa opção.',
      0,
      'scope_not_granted'
    ))
    return
  }
  accessToken = resp.access_token
  // margem de 60 s antes de expirar
  tokenExpiresAt = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000
  finishPending('resolve', accessToken)
}

function popupErrorMessage(type) {
  if (type === 'popup_failed_to_open') {
    return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.'
  }
  if (type === 'popup_closed') {
    return 'A janela do Google foi fechada antes de concluir.'
  }
  return 'Não foi possível conectar ao Google.'
}

function getTokenClient() {
  if (tokenClient) return tokenClient
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPE,
    callback: handleTokenResponse,
    error_callback: err => finishPending('reject', new GoogleCalendarError(popupErrorMessage(err?.type), 0, err?.type)),
  })
  return tokenClient
}

/**
 * Abre o popup do Google e obtém um access_token para a agenda.
 * Deve ser chamado a partir de um clique (senão o navegador bloqueia o popup).
 * Se já houver um popup aberto, devolve a mesma promessa.
 *
 * @param {string} [loginHint] - e-mail da psicóloga, para pré-selecionar a conta
 * @returns {Promise<string>} access token
 */
export async function connectGoogle(loginHint) {
  if (!CLIENT_ID) {
    throw new GoogleCalendarError('Integração com Google não configurada (VITE_GOOGLE_CLIENT_ID ausente no .env).')
  }
  if (isGoogleConnected()) return accessToken
  if (pendingToken) return pendingToken.promise

  await loadGis()

  let resolveToken
  let rejectToken
  const promise = new Promise((resolve, reject) => {
    resolveToken = resolve
    rejectToken = reject
  })
  pendingToken = { promise, resolve: resolveToken, reject: rejectToken }

  getTokenClient().requestAccessToken({ prompt: '', login_hint: loginHint || undefined })
  return promise
}

/** Revoga o token atual e "desconecta" a conta Google. */
export function disconnectGoogle() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => undefined)
  }
  clearToken()
}

// ─── Chamadas à Calendar API ──────────────────────────────────

async function readGoogleError(resp) {
  try {
    const body = await resp.json()
    return {
      message: body?.error?.message || '',
      reason: body?.error?.errors?.[0]?.reason || body?.error?.status || '',
    }
  } catch {
    return { message: '', reason: '' }
  }
}

function forbiddenMessage(reason, message) {
  if (reason === 'insufficientPermissions' || reason === 'PERMISSION_DENIED') {
    return 'A permissão da agenda não foi concedida. Desconecte e conecte o Google de novo, marcando a permissão da agenda.'
  }
  if (reason === 'forbiddenForNonOrganizer' || reason === 'requiredAccessLevel') {
    return 'Este evento foi criado por outra conta Google. Conecte a mesma conta usada no agendamento.'
  }
  if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
    return 'O Google Agenda está recebendo muitas solicitações. Aguarde um minuto e tente de novo.'
  }
  return message ? `Google Agenda: ${message}` : 'O Google Agenda negou a operação.'
}

async function toCalendarError(resp) {
  const { message, reason } = await readGoogleError(resp)
  if (resp.status === 401) {
    clearToken()
    return new GoogleCalendarError('Sua conexão com o Google expirou. Conecte novamente e repita a ação.', 401, reason)
  }
  if (resp.status === 403) {
    return new GoogleCalendarError(forbiddenMessage(reason, message), 403, reason)
  }
  const text = message ? `Google Agenda: ${message}` : `Erro ${resp.status} no Google Agenda.`
  return new GoogleCalendarError(text, resp.status, reason)
}

function buildUrl(path, query) {
  const url = new URL(CALENDAR_API + path)
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))
  return url
}

/** Uma tentativa. Devolve { resp } ou { networkError }. */
async function sendOnce(url, method, body) {
  try {
    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { resp }
  } catch (networkError) {
    return { networkError }
  }
}

async function calendarFetch(path, { method = 'GET', query = {}, body } = {}) {
  if (!isGoogleConnected()) {
    throw new GoogleCalendarError('Conecte sua conta Google para sincronizar a agenda.', 401)
  }

  const url = buildUrl(path, query)
  for (let attempt = 1; ; attempt++) {
    const { resp, networkError } = await sendOnce(url, method, body)
    const isLast = attempt >= MAX_ATTEMPTS

    if (networkError) {
      if (isLast) throw new GoogleCalendarError('Sem conexão com o Google Agenda. Verifique a internet e tente de novo.')
    } else if (resp.ok || resp.status === 204) {
      return resp.status === 204 ? null : resp.json()
    } else if (isLast || !RETRYABLE_STATUS.has(resp.status)) {
      throw await toCalendarError(resp)
    }

    // espera crescente: 1 s, 2 s…
    await sleep(1000 * attempt)
  }
}

/** Soma minutos a uma data "YYYY-MM-DDTHH:mm[:ss]" local e devolve no mesmo formato. */
export function addMinutesLocal(localDateTime, minutes) {
  const d = new Date(localDateTime)
  d.setMinutes(d.getMinutes() + Number(minutes))
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function withSeconds(localDateTime) {
  return localDateTime.length === 16 ? `${localDateTime}:00` : localDateTime.slice(0, 19)
}

function buildEventBody(session) {
  const start = withSeconds(session.dateTime)
  const end   = addMinutesLocal(start, session.durationMinutes || DEFAULT_DURATION_MINUTES)
  const tipo  = session.scheduleType === 'GRUPO' ? 'Sessão em grupo' : 'Sessão individual'
  const intro = session.description?.trim()
  const footer = [
    `${tipo} de orientação de carreira agendada pela plataforma SyncCarreira.`,
    'Entre pelo link do Google Meet no horário marcado.',
  ]

  return {
    summary: session.title || `SyncCarreira · ${tipo}`,
    description: (intro ? [intro, '', ...footer] : footer).join('\n'),
    start: { dateTime: start, timeZone: TIME_ZONE },
    end:   { dateTime: end,   timeZone: TIME_ZONE },
    attendees: (session.students ?? [])
      .filter(student => student.email)
      .map(student => ({ email: student.email, displayName: student.name })),
    guestsCanModify: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: session.scheduleType === 'GRUPO',
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

function randomHex() {
  if (crypto.randomUUID) return crypto.randomUUID().replaceAll('-', '')
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/** ID do evento gerado no front (base32hex: 0-9 e a-v). Reenviar a criação não duplica. */
const newEventId = () => `sc${randomHex()}`

function meetRequest() {
  return {
    createRequest: {
      requestId: randomHex(),
      conferenceSolutionKey: { type: 'hangoutsMeet' },
    },
  }
}

/** Extrai o link do Meet do evento retornado pelo Google. */
function meetLinkOf(event) {
  return event?.hangoutLink
    || event?.conferenceData?.entryPoints?.find(entry => entry.entryPointType === 'video')?.uri
    || null
}

function meetCreationFailed(event) {
  return event?.conferenceData?.createRequest?.status?.statusCode === 'failure'
}

/**
 * O Google às vezes devolve a sala do Meet como "pending".
 * Consulta o evento mais algumas vezes até o link aparecer.
 */
async function waitForMeetLink(event) {
  let current = event
  for (let i = 0; i < MEET_POLL_ATTEMPTS && !meetLinkOf(current) && !meetCreationFailed(current); i++) {
    await sleep(1000)
    current = await calendarFetch(`/${encodeURIComponent(event.id)}`)
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
  const body = { ...buildEventBody(session), id: newEventId(), conferenceData: meetRequest() }

  let created
  try {
    created = await calendarFetch('', {
      method: 'POST',
      query: { conferenceDataVersion: 1, sendUpdates: 'all' },
      body,
    })
  } catch (error) {
    // 409 = o evento com esse ID já existe: uma tentativa anterior chegou ao Google
    if (error.status !== 409) throw error
    created = await calendarFetch(`/${body.id}`)
  }
  return toResult(await waitForMeetLink(created))
}

/**
 * Atualiza data/horário/participantes do evento. O Google avisa os convidados.
 * Se o evento ainda não tinha Meet, cria um. Se o evento não existe mais nesta
 * conta Google (apagado ou criado por outra conta), cria um evento novo.
 */
export async function updateMeetEvent(googleEventId, session) {
  const body = buildEventBody(session)
  if (!session.meetLink) body.conferenceData = meetRequest()

  try {
    const updated = await calendarFetch(`/${encodeURIComponent(googleEventId)}`, {
      method: 'PATCH',
      query: { conferenceDataVersion: 1, sendUpdates: 'all' },
      body,
    })
    if (updated?.status === 'cancelled') return createMeetEvent(session)
    return toResult(await waitForMeetLink(updated))
  } catch (error) {
    if (error.status === 404 || error.status === 410) return createMeetEvent(session)
    throw error
  }
}

/** Cancela (remove) o evento. O Google envia o aviso de cancelamento aos alunos. */
export async function cancelMeetEvent(googleEventId) {
  try {
    await calendarFetch(`/${encodeURIComponent(googleEventId)}`, {
      method: 'DELETE',
      query: { sendUpdates: 'all' },
    })
  } catch (error) {
    // 404/410 = o evento já não existe no Google: nada a cancelar
    if (error.status !== 404 && error.status !== 410) throw error
  }
}

/** Data local da instituição → "YYYYMMDDTHHMMSS" (formato do link do Google Agenda, com ctz). */
function toCalendarUrlDate(localDateTime) {
  return withSeconds(localDateTime).replaceAll('-', '').replaceAll(':', '')
}

/**
 * Link "Adicionar ao Google Agenda" (não exige login/API).
 * Usado na área do aluno como atalho caso ele não tenha recebido o convite.
 */
export function buildAddToCalendarUrl(appointment) {
  const start = withSeconds(appointment.dateTime)
  const end   = addMinutesLocal(start, appointment.durationMinutes || DEFAULT_DURATION_MINUTES)
  const params = new URLSearchParams({
    action:  'TEMPLATE',
    text:    appointment.title || 'Sessão SyncCarreira',
    dates:   `${toCalendarUrlDate(start)}/${toCalendarUrlDate(end)}`,
    details: [appointment.description, appointment.meetLink && `Google Meet: ${appointment.meetLink}`]
      .filter(Boolean).join('\n\n'),
    ctz:     TIME_ZONE,
  })
  if (appointment.meetLink) params.set('location', appointment.meetLink)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
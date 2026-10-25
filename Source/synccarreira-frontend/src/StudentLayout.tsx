/**
 * @file StudentLayout.tsx
 * @description Casca do "Espaço do Estudante" (ROLE_USER), extraída de 01-minha-jornada-home.html:
 *  - Sidebar fixa roxa (w-64) com marca, navegação, selo LGPD/CFP, aluno, turma e "Sair"
 *  - Top Bar fixa translúcida (h-16) com breadcrumb, status da jornada, próxima sessão e avatar
 *  - <Outlet /> na área central (<main>)
 *
 * Paleta (tokens Material do HTML):
 *  primary #732993 · primary-container #8e44ad · primary-fixed #f8d8ff · primary-fixed-dim #ecb2ff
 *  secondary #804698 · secondary-container #e7a6ff · on-secondary-container #6c3485
 *  surface #fff7fb · surface-container #fde7ff · surface-container-low #ffefff
 *  inverse-surface #491b5e · inverse-on-surface #feebff · on-surface #320047 · on-surface-variant #4e4350
 *  outline #807381 · error #ba1a1a · error-container #ffdad6
 * Fonte: Plus Jakarta Sans
 *
 * Logo: coloque o ícone em /public/logo-synccarreira.png (fallback automático para o ícone ∞).
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Compass,
  HandHeart,
  Infinity as InfinityIcon,
  Loader2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  User,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import { useTypedAuth } from '../auth/RequireRole'
import type {
  AppointmentDTO,
  FeedbackDTO,
  JourneyRecordDTO,
  JourneyStatusDTO,
} from '../types/api'

const BASE = '/aluno'
const FONT = "font-['Plus_Jakarta_Sans',Inter,sans-serif]"
const LOGO_SRC = '/logo-synccarreira.png'

// ─── Navegação (mesma ordem do HTML de referência) ───────────────

interface NavItemConfig {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  showUnreadBadge?: boolean
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: BASE, label: 'Minha Jornada', icon: Compass, end: true },
  { to: `${BASE}/resultados`, label: 'Resultados', icon: BarChart3 },
  { to: `${BASE}/conteudos`, label: 'Hub de Conteúdos', icon: BookOpen },
  { to: `${BASE}/sessoes`, label: 'Minhas Sessões', icon: CalendarDays },
  { to: `${BASE}/feedbacks`, label: 'Feedbacks', icon: HandHeart, showUnreadBadge: true },
]

/** Rótulo do último nível do breadcrumb por rota. */
const BREADCRUMB_LABELS: Array<[RegExp, string]> = [
  [/^\/aluno\/?$/, 'Minha Jornada'],
  [/^\/aluno\/trilhas/, 'Trilhas'],
  [/^\/aluno\/trilha\//, 'Trilha'],
  [/^\/aluno\/resultados/, 'Resultados'],
  [/^\/aluno\/conteudos/, 'Hub de Conteúdos'],
  [/^\/aluno\/sessoes/, 'Minhas Sessões'],
  [/^\/aluno\/feedbacks/, 'Feedbacks'],
  [/^\/aluno\/perfil/, 'Meu Perfil'],
]

// ─── Helpers ─────────────────────────────────────────────────────

const plural = (n: number, singular: string, pluralForm: string) => (n === 1 ? singular : pluralForm)

/** LocalDateTime ("2026-10-26T14:30:00") é interpretado no fuso local, como o backend grava. */
function parseLocalDateTime(value: string): Date | null {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatSessionDate(date: Date): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000)
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  if (diffDays === 0) return `Hoje às ${time}`
  if (diffDays === 1) return `Amanhã às ${time}`
  if (diffDays > 1 && diffDays < 7) {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} às ${time}`
  }
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${time}`
}

function pickNextSession(appointments: AppointmentDTO[]): AppointmentDTO | null {
  const now = Date.now()
  return (
    appointments
      .filter((a) => a.scheduleStatus === 'AGENDADA')
      .map((a) => ({ a, date: parseLocalDateTime(a.dateTime) }))
      .filter((x): x is { a: AppointmentDTO; date: Date } => x.date !== null)
      // Sessão em andamento continua sendo "a próxima" até terminar
      .filter(({ a, date }) => date.getTime() + (a.durationMinutes ?? 0) * 60_000 > now)
      .sort((x, y) => x.date.getTime() - y.date.getTime())[0]?.a ?? null
  )
}

/** Texto da pílula "Próxima Sessão" (substitui o ternário aninhado do JSX). */
function describeSession(session: AppointmentDTO | null): string {
  if (!session) return 'Nenhuma sessão agendada'
  const date = parseLocalDateTime(session.dateTime)
  if (!date) return 'Nenhuma sessão agendada'
  const meetSuffix = session.meetLink ? ' (Meet)' : ''
  return `${formatSessionDate(date)}${meetSuffix}`
}

/** Turma/instituição da jornada mais recente (o aluno não tem acesso a GET /students). */
function latestRecord(records: JourneyRecordDTO[]): JourneyRecordDTO | null {
  return [...records].sort((x, y) => (y.journeyNumber ?? 0) - (x.journeyNumber ?? 0))[0] ?? null
}

// ─── Dados da casca ──────────────────────────────────────────────

interface ShellData {
  journey: JourneyStatusDTO | null
  record: JourneyRecordDTO | null
  nextSession: AppointmentDTO | null
  unreadFeedbacks: number
}

type ShellState =
  | { status: 'loading' }
  | { status: 'ready'; data: ShellData; partialError: string | null }

function useStudentShellData(studentId: number | undefined, pathname: string) {
  const [state, setState] = useState<ShellState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  // Recarrega ao trocar de seção (ex.: depois de concluir uma trilha ou ler um feedback)
  const section = pathname.split('/')[2] ?? ''

  useEffect(() => {
    if (!studentId) return
    const controller = new AbortController()
    const opts = { signal: controller.signal, suppressGlobalError: true }

    void Promise.allSettled([
      api.get<JourneyStatusDTO>('/journeys/me/current', opts),
      api.get<JourneyRecordDTO[]>('/journeys/me', opts),
      api.get<AppointmentDTO[]>(`/appointments/student/${studentId}`, opts),
      api.get<FeedbackDTO[]>('/feedbacks/me', opts),
    ]).then(([journey, records, appointments, feedbacks]) => {
      if (controller.signal.aborted) return

      const failures = [journey, records, appointments, feedbacks].filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      )

      setState({
        status: 'ready',
        data: {
          journey: journey.status === 'fulfilled' ? journey.value.data : null,
          record: records.status === 'fulfilled' ? latestRecord(records.value.data ?? []) : null,
          nextSession:
            appointments.status === 'fulfilled' ? pickNextSession(appointments.value.data ?? []) : null,
          unreadFeedbacks:
            feedbacks.status === 'fulfilled' ? (feedbacks.value.data ?? []).filter((f) => !f.read).length : 0,
        },
        partialError: failures.length > 0 ? getErrorMessage(failures[0].reason) : null,
      })
    })

    return () => controller.abort()
  }, [studentId, section, reloadKey])

  return { state, reload: () => setReloadKey((k) => k + 1) }
}

// ─── Props (imutáveis) ───────────────────────────────────────────

type ShellProps = Readonly<{
  shell: ShellState
}>

type UnreadBadgeProps = Readonly<{
  state: ShellState
}>

type SidebarNavProps = Readonly<{
  shell: ShellState
  onNavigate: () => void
}>

type SidebarFooterProps = Readonly<{
  name: string
  shell: ShellState
  loggingOut: boolean
  onLogout: () => void
}>

type NextSessionCardProps = Readonly<{
  shell: ShellState
  onRetry: () => void
}>

// ─── Componentes visuais ─────────────────────────────────────────

function BrandLogo() {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#8e44ad] to-[#e7a6ff] flex items-center justify-center text-white shadow-sm shrink-0">
        <InfinityIcon className="w-5 h-5" aria-hidden="true" />
      </div>
    )
  }
  return (
    <img
      src={LOGO_SRC}
      alt="SyncCarreira"
      className="h-8 w-auto object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  )
}

function UnreadBadge({ state }: UnreadBadgeProps) {
  if (state.status === 'loading') {
    return <span className="w-12 h-4 rounded-full bg-[#8e44ad]/60 animate-pulse" aria-label="Carregando feedbacks" />
  }
  const count = state.data.unreadFeedbacks
  if (count <= 0) return null
  return (
    <span className="px-1 py-0.5 rounded-full bg-[#e7a6ff] text-[#6c3485] text-[11px] leading-[14px] font-semibold whitespace-nowrap">
      {count} {plural(count, 'nova', 'novas')}
    </span>
  )
}

function SidebarNav({ shell, onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-4 overflow-y-auto flex-1" aria-label="Navegação principal">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end, showUnreadBadge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center justify-between gap-2 px-4 py-2 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ecb2ff]',
              isActive
                ? 'bg-white text-[#732993] font-bold shadow-sm'
                : 'text-[#f8d8ff] hover:bg-[#8e44ad] hover:text-white',
            ].join(' ')
          }
        >
          <span className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-sm leading-5 font-semibold truncate">{label}</span>
          </span>
          {showUnreadBadge && <UnreadBadge state={shell} />}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({ name, shell, loggingOut, onLogout }: SidebarFooterProps) {
  const record = shell.status === 'ready' ? shell.data.record : null

  return (
    <div className="p-4 bg-[#491b5e] text-[#feebff] flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/10 backdrop-blur-sm">
        <ShieldCheck className="w-[18px] h-[18px] text-[#f8d8ff] shrink-0" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="text-[11px] leading-[14px] font-semibold text-[#f8d8ff]">Ambiente Seguro</span>
          <span className="text-xs leading-[18px] text-[#feebff]/80">LGPD &amp; Sigilo CFP</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#807381]/30">
        <div className="flex flex-col min-w-0">
          <span className="text-xs leading-4 font-semibold text-[#feebff] truncate" title={name}>{name}</span>
          {shell.status === 'loading' ? (
            <>
              <span className="mt-1 h-3 w-28 rounded bg-white/15 animate-pulse" />
              <span className="mt-1 h-3 w-20 rounded bg-white/10 animate-pulse" />
            </>
          ) : (
            <>
              <span className="text-xs leading-[18px] text-[#feebff]/70 truncate">
                {record?.schoolClassName ?? 'Turma não vinculada'}
              </span>
              {record?.institutionName && (
                <span className="text-xs leading-[18px] text-[#feebff]/60 truncate">{record.institutionName}</span>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          title="Sair da Plataforma"
          aria-label="Sair da Plataforma"
          className="p-1 rounded-lg text-[#feebff]/80 hover:text-[#ffdad6] hover:bg-[#ba1a1a]/20 transition-colors flex items-center justify-center disabled:cursor-wait disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}

function JourneyPill({ shell }: ShellProps) {
  if (shell.status === 'loading') {
    return <span className="hidden md:block h-6 w-44 rounded-full bg-[#fde7ff] animate-pulse" aria-label="Carregando jornada" />
  }
  const journey = shell.data.journey
  if (!journey?.currentJourneyNumber) return null

  const concluded = journey.currentJourneyConcluded
  return (
    <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-[#fde7ff] text-[#732993] text-[11px] leading-[14px] font-semibold whitespace-nowrap">
      <span
        className={`w-2 h-2 rounded-full ${concluded ? 'bg-emerald-600' : 'bg-[#732993] animate-pulse'}`}
        aria-hidden="true"
      />
      <span>
        Jornada #{journey.currentJourneyNumber} • {concluded ? 'Concluída' : 'Em Andamento'}
      </span>
    </div>
  )
}

function NextSessionCard({ shell, onRetry }: NextSessionCardProps) {
  const base =
    'hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#ffefff] text-[#320047] shadow-[0_2px_8px_-2px_rgba(91,44,111,0.05)]'

  if (shell.status === 'loading') {
    return (
      <div className={base} aria-label="Carregando próxima sessão">
        <Video className="w-[18px] h-[18px] text-[#732993]" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <span className="h-3 w-20 rounded bg-[#fde7ff] animate-pulse" />
          <span className="h-3 w-28 rounded bg-[#fde7ff] animate-pulse" />
        </div>
      </div>
    )
  }

  const sessionLabel = describeSession(shell.data.nextSession)

  // O botão de retry é irmão do <Link> (botão dentro de <a> é HTML inválido)
  return (
    <div className={`${base} hover:bg-[#fde7ff] transition-colors`}>
      <Link
        to={`${BASE}/sessoes`}
        className="flex items-center gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ecb2ff]"
      >
        <Video className="w-[18px] h-[18px] text-[#732993] shrink-0" aria-hidden="true" />
        <span className="flex flex-col">
          <span className="text-[11px] leading-[14px] font-semibold text-[#320047]">Próxima Sessão</span>
          <span className="text-xs leading-[18px] text-[#4e4350]">{sessionLabel}</span>
        </span>
      </Link>
      {shell.partialError && (
        <button
          type="button"
          onClick={onRetry}
          title={`Alguns dados não carregaram: ${shell.partialError}`}
          aria-label="Recarregar dados do cabeçalho"
          className="ml-1 p-1 rounded-md text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

// ─── Layout ──────────────────────────────────────────────────────

export default function StudentLayout() {
  const { user, logout } = useTypedAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { state: shell, reload } = useStudentShellData(user?.id, location.pathname)

  const name = user?.nome || user?.name || 'Estudante'

  const pageLabel = useMemo(
    () => BREADCRUMB_LABELS.find(([pattern]) => pattern.test(location.pathname))?.[1] ?? 'Minha Jornada',
    [location.pathname],
  )

  useEffect(() => setMobileOpen(false), [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className={`min-h-screen bg-[#fff7fb] text-[#320047] text-sm antialiased ${FONT}`}>
      {mobileOpen && (
        <button
          type="button"
          tabIndex={-1}
          onClick={closeMobile}
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-[#320047]/40 lg:hidden cursor-default"
        />
      )}

      {/* 1. SIDEBAR ESQUERDA FIXA */}
      <aside
        id="student-sidebar"
        className={`fixed left-0 top-0 h-screen w-64 bg-[#732993] z-50 flex flex-col justify-between text-white shadow-[0_1px_8px_rgba(0,0,0,0.08)] transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-6 flex items-center gap-2 bg-[#8e44ad]/20 relative">
            <BrandLogo />
            <div className="flex flex-col min-w-0">
              <span className="text-lg leading-6 tracking-tight text-white font-bold">SyncCarreira</span>
              <span className="text-[11px] leading-[14px] font-semibold text-[#ecb2ff]">Espaço do Estudante</span>
            </div>
            <button
              type="button"
              onClick={closeMobile}
              className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#f8d8ff] hover:bg-[#8e44ad]"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <SidebarNav shell={shell} onNavigate={closeMobile} />
        </div>
        <SidebarFooter name={name} shell={shell} loggingOut={loggingOut} onLogout={() => void handleLogout()} />
      </aside>

      <div className="lg:pl-64">
        {/* 2. TOP BAR FIXA */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-1 rounded-lg text-[#4e4350] hover:bg-[#fde7ff]"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              aria-controls="student-sidebar"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="hidden sm:block">
              <BrandLogo />
            </div>
            <nav aria-label="Você está em" className="min-w-0">
              <ol className="flex items-center gap-1 text-[#4e4350] text-xs leading-4 font-medium">
                <li className="hidden sm:block">
                  <Link to={BASE} className="text-[#732993] font-semibold hover:underline">
                    SyncCarreira
                  </Link>
                </li>
                <li className="hidden sm:flex items-center gap-1" aria-hidden="true">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="hidden md:block">Espaço do Estudante</li>
                <li className="hidden md:flex items-center" aria-hidden="true">
                  <ChevronRight className="w-3.5 h-3.5" />
                </li>
                <li className="text-[#320047] font-semibold truncate" aria-current="page">
                  {pageLabel}
                </li>
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <JourneyPill shell={shell} />
            <NextSessionCard shell={shell} onRetry={reload} />
            <Link
              to={`${BASE}/perfil`}
              className="relative flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ecb2ff]"
              title="Meu perfil"
              aria-label="Meu perfil"
            >
              <span className="w-8 h-8 rounded-full bg-[#732993] flex items-center justify-center">
                <User className="w-[18px] h-[18px] text-white" aria-hidden="true" />
              </span>
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#804698] ring-2 ring-white"
                aria-hidden="true"
              />
            </Link>
          </div>
        </header>

        {/* 3. CONTEÚDO CENTRAL */}
        <main className="w-full pt-16 bg-[#fff7fb] min-h-screen">
          <div className="max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-4 flex flex-col gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

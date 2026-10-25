/**
 * @file PsychologistLayout.tsx
 * @description Casca do "Painel da Psicóloga" (ROLE_PSICOLOGA), extraída de 01-painel-dashboard.html:
 *  - Sidebar fixa branca (w-64) com marca, navegação, selo LGPD, perfil e ações
 *  - Top Bar fixa (h-16) com busca (Ctrl+K), status do Google Calendar e CTA "Nova Orientação"
 *  - <Outlet /> na área central (<main>)
 *
 * Paleta: brand-700 #6D28D9 · brand-600 #7C3AED · brand-100 #EDE9FE · brand-200 #DDD6FE
 *         fundo #F8FAFC · texto #0F172A · alerta #D97706/#FEF3C7 · sucesso #059669/#ECFDF5
 * Fonte:  Plus Jakarta Sans (fallback Inter)
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  Infinity as InfinityIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Route as RouteIcon,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import api, { getErrorMessage } from '../services/api'
import {
  connectGoogle,
  isGoogleConfigured,
  isGoogleConnected,
} from '../services/googleCalendarService'
import { useTypedAuth } from '../auth/RequireRole'
import type { PanelSummary } from '../types/api'

const BASE = '/psicologa'
const FONT = "font-['Plus_Jakarta_Sans',Inter,sans-serif]"
const SEARCH_MIN_LENGTH = 2
const SEARCH_MAX_LENGTH = 80

// ─── Navegação (mesma ordem do HTML de referência) ───────────────

interface NavItemConfig {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Exibe o badge de alunos com dúvida sinalizada. */
  showPendingBadge?: boolean
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: `${BASE}/perfil`, label: 'Perfil', icon: User },
  { to: BASE, label: 'Visão Geral', icon: LayoutDashboard, end: true },
  { to: `${BASE}/turmas`, label: 'Turmas', icon: Users },
  { to: `${BASE}/trilhas`, label: 'Trilhas', icon: RouteIcon },
  { to: `${BASE}/orientacoes`, label: 'Orientações', icon: Brain, showPendingBadge: true },
  { to: `${BASE}/agenda`, label: 'Agenda', icon: CalendarDays },
  { to: `${BASE}/relatorios`, label: 'Relatórios', icon: BarChart3 },
  { to: `${BASE}/conteudos`, label: 'Conteúdos', icon: BookOpen },
]

// ─── Helpers ─────────────────────────────────────────────────────

function initialsOf(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter((p) => !/^(dra?|sr|sra)\.?$/i.test(p))
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
}

const plural = (n: number, singular: string, pluralForm: string) => (n === 1 ? singular : pluralForm)

// ─── Dados do painel (badge "N pendentes") ───────────────────────

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

function usePendingGuidance(psychologistId: number | undefined) {
  const [state, setState] = useState<LoadState<number>>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!psychologistId) return
    const controller = new AbortController()
    setState({ status: 'loading' })

    api
      .get<PanelSummary>(`/psychologist-panel/${psychologistId}`, {
        signal: controller.signal,
        suppressGlobalError: true,
      })
      .then(({ data }) => setState({ status: 'success', data: data.inDoubtStudents }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: getErrorMessage(err) })
      })

    return () => controller.abort()
  }, [psychologistId, reloadKey])

  return { state, reload: () => setReloadKey((k) => k + 1) }
}

// ─── Status do Google Calendar ───────────────────────────────────

function useGoogleCalendarStatus(loginHint?: string) {
  const configured = isGoogleConfigured()
  const [connected, setConnected] = useState<boolean>(() => isGoogleConnected())
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // O token do Google vive só em memória e expira: reavalia periodicamente e ao voltar à aba
  useEffect(() => {
    if (!configured) return
    const sync = () => setConnected(isGoogleConnected())
    const interval = window.setInterval(sync, 30_000)
    window.addEventListener('focus', sync)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', sync)
    }
  }, [configured])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      await connectGoogle(loginHint)
      setConnected(isGoogleConnected())
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível conectar ao Google Calendar.'))
    } finally {
      setConnecting(false)
    }
  }, [loginHint])

  return { configured, connected, connecting, error, connect }
}

// ─── Componentes visuais ─────────────────────────────────────────

function BrandMark() {
  return (
    <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-3 shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm shrink-0">
        <InfinityIcon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-base text-[#0F172A] tracking-tight leading-tight">SyncCarreira</span>
        <span className="text-xs font-semibold text-[#7C3AED] leading-none mt-0.5">Orientação &amp; Psicologia</span>
      </div>
    </div>
  )
}

function PendingBadge({ state, onRetry }: { state: LoadState<number>; onRetry: () => void }) {
  if (state.status === 'loading') {
    return <span className="w-16 h-5 rounded-full bg-slate-100 animate-pulse" aria-label="Carregando pendências" />
  }
  if (state.status === 'error') {
    return (
      <span
        role="button"
        tabIndex={0}
        title={`${state.message} Clique para tentar novamente.`}
        onClick={(e) => {
          e.preventDefault()
          onRetry()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onRetry()
          }
        }}
        className="text-rose-500 hover:text-rose-600 p-0.5 rounded"
      >
        <AlertCircle className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Erro ao carregar pendências. Tentar novamente.</span>
      </span>
    )
  }
  if (state.data <= 0) return null
  return (
    <span className="bg-[#FEF3C7] text-[#D97706] font-semibold text-xs px-2 py-0.5 rounded-full border border-[#FDE68A] whitespace-nowrap">
      {state.data} {plural(state.data, 'pendente', 'pendentes')}
    </span>
  )
}

function SidebarNav({
  pending,
  onRetryPending,
  onNavigate,
}: {
  pending: LoadState<number>
  onRetryPending: () => void
  onNavigate: () => void
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navegação principal">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end, showPendingBadge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30',
              isActive
                ? 'rounded-r-xl bg-[#EDE9FE] text-[#6D28D9] font-bold border-l-4 border-[#6D28D9] shadow-xs'
                : 'rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <span className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-[#6D28D9]' : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{label}</span>
              </span>
              {showPendingBadge && <PendingBadge state={pending} onRetry={onRetryPending} />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarFooter({
  name,
  email,
  loggingOut,
  onLogout,
  onNavigate,
}: {
  name: string
  email: string
  loggingOut: boolean
  onLogout: () => void
  onNavigate: () => void
}) {
  return (
    <div className="bg-[#F8FAFC] border-t border-slate-200 p-4 space-y-3 shrink-0">
      <div className="bg-purple-50 text-purple-900 border border-purple-100 rounded-lg py-1.5 px-2.5 text-xs flex items-center gap-2 font-medium">
        <ShieldCheck className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
        <span>Ambiente Seguro LGPD</span>
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#EDE9FE] text-[#6D28D9] ring-2 ring-[#DDD6FE] flex items-center justify-center text-xs font-bold">
            {initialsOf(name)}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" aria-hidden="true" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-900 truncate" title={name}>{name}</span>
          <span className="text-[11px] text-slate-500 truncate" title={email}>Psicóloga • {email}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
        <NavLink
          to={`${BASE}/perfil`}
          onClick={onNavigate}
          className="text-slate-600 hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" aria-hidden="true" />
          Editar Perfil
        </NavLink>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 transition-colors disabled:opacity-60 disabled:cursor-wait"
        >
          {loggingOut ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </div>
  )
}

function SearchBox() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(() => searchParams.get('busca') ?? '')
  const [error, setError] = useState<string | null>(null)
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  // Atalho Ctrl+K / ⌘K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const term = query.trim()
    if (term.length < SEARCH_MIN_LENGTH) {
      setError(`Digite ao menos ${SEARCH_MIN_LENGTH} caracteres.`)
      return
    }
    setError(null)
    navigate(`${BASE}?busca=${encodeURIComponent(term)}`)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-96" noValidate>
      <label htmlFor="psychologist-search" className="sr-only">
        Buscar alunos, turmas ou avaliações
      </label>
      <Search
        className="w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        id="psychologist-search"
        ref={inputRef}
        type="search"
        value={query}
        maxLength={SEARCH_MAX_LENGTH}
        onChange={(e) => {
          setQuery(e.target.value)
          if (error) setError(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('')
            setError(null)
            e.currentTarget.blur()
          }
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'psychologist-search-error' : undefined}
        placeholder="Buscar alunos, turmas ou avaliações..."
        className={`w-full bg-[#F8FAFC] border rounded-xl pl-9 pr-14 py-2 text-sm placeholder:text-slate-400 text-slate-800 focus:outline-none focus:ring-2 transition-all ${
          error
            ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-slate-200 focus:ring-purple-500/20 focus:border-[#6D28D9]'
        }`}
      />
      <kbd className="hidden sm:block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-sans">
        {isMac ? '⌘K' : 'Ctrl+K'}
      </kbd>
      {error && (
        <p
          id="psychologist-search-error"
          role="alert"
          className="absolute left-0 top-full mt-1 text-[11px] font-medium text-rose-600 bg-white border border-rose-100 rounded-md px-2 py-0.5 shadow-sm"
        >
          {error}
        </p>
      )}
    </form>
  )
}

function CalendarStatusPill({ email }: { email: string }) {
  const { configured, connected, connecting, error, connect } = useGoogleCalendarStatus(email)
  if (!configured) return null

  if (connected) {
    return (
      <div className="hidden md:flex bg-[#ECFDF5] text-[#059669] border border-emerald-200 px-3 py-1.5 rounded-full text-xs font-semibold items-center gap-2 whitespace-nowrap">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
        </span>
        <span>Google Calendar Conectado</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={connecting}
      title={error ?? 'Conecte para criar sessões com link do Google Meet'}
      className={`hidden md:flex px-3 py-1.5 rounded-full text-xs font-semibold items-center gap-2 whitespace-nowrap border transition-colors disabled:cursor-wait ${
        error
          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
      }`}
    >
      {connecting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      ) : error ? (
        <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden="true" />
      )}
      <span>
        {connecting ? 'Conectando...' : error ? 'Falha ao conectar — tentar de novo' : 'Conectar Google Calendar'}
      </span>
    </button>
  )
}

// ─── Layout ──────────────────────────────────────────────────────

export default function PsychologistLayout() {
  const { user, logout } = useTypedAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { state: pending, reload: reloadPending } = usePendingGuidance(user?.id)

  const name = user?.nome || user?.name || 'Psicóloga'
  const email = user?.email ?? ''

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => setMobileOpen(false), [location.pathname])

  // Esc fecha o menu mobile
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
    <div className={`min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased ${FONT}`}>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={closeMobile} aria-hidden="true" />
      )}

      {/* 1. SIDEBAR ESQUERDA FIXA */}
      <aside
        id="psychologist-sidebar"
        className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen fixed left-0 top-0 z-40 shadow-sm transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
          <div className="relative">
            <BrandMark />
            <button
              type="button"
              onClick={closeMobile}
              className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <SidebarNav pending={pending} onRetryPending={reloadPending} onNavigate={closeMobile} />
        </div>
        <SidebarFooter
          name={name}
          email={email}
          loggingOut={loggingOut}
          onLogout={() => void handleLogout()}
          onNavigate={closeMobile}
        />
      </aside>

      {/* 2. TOP BAR FIXA */}
      <header className="h-16 bg-white border-b border-slate-200 fixed top-0 left-0 lg:left-64 right-0 z-20 px-4 lg:px-8 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-controls="psychologist-sidebar"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <SearchBox />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <CalendarStatusPill email={email} />
          <button
            type="button"
            onClick={() => navigate(`${BASE}/agenda?nova=1`)}
            className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-sm px-3 sm:px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <Plus className="w-[18px] h-[18px]" aria-hidden="true" />
            <span className="hidden sm:inline">Nova Orientação</span>
          </button>
        </div>
      </header>

      {/* 3. CONTEÚDO CENTRAL */}
      <main className="lg:ml-64 pt-16 min-h-screen bg-[#F8FAFC]">
        {/* HTML de referência: pt-20 (64px da top bar + 16px) e p-8 nas demais bordas */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-8 space-y-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

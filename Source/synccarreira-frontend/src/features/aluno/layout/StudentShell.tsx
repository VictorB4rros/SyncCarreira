/**
 * @file StudentShell.tsx
 * @description Layout do Espaço do Estudante: menu lateral roxo, cabeçalho com
 * status da jornada e próxima sessão, e a área de conteúdo (Outlet).
 */
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChartColumn,
  ChevronRight,
  Compass,
  HeartHandshake,
  LogOut,
  Menu,
  Route as RouteIcon,
  ShieldCheck,
  CalendarDays,
  Video,
  X,
} from 'lucide-react'
import { useStudent } from '../context/StudentContext'
import { displayName, useStudentAuth } from '../context/auth'
import { formatTime, relativeDayLabel } from '../lib/format'
import { initials } from '../lib/labels'
import { cn, type Icon } from '../components/ui'

interface NavItem {
  to: string
  label: string
  icon: Icon
  end?: boolean
}

export const STUDENT_NAV: NavItem[] = [
  { to: '/aluno', label: 'Minha Jornada', icon: Compass, end: true },
  { to: '/aluno/trilhas', label: 'Trilhas', icon: RouteIcon },
  { to: '/aluno/resultados', label: 'Resultados', icon: ChartColumn },
  { to: '/aluno/conteudos', label: 'Hub de Conteúdos', icon: BookOpen },
  { to: '/aluno/sessoes', label: 'Minhas Sessões', icon: CalendarDays },
  { to: '/aluno/feedbacks', label: 'Feedbacks', icon: HeartHandshake },
]

const EXTRA_TITLES: { prefix: string; label: string }[] = [{ prefix: '/aluno/afinidades', label: 'Minhas Afinidades' }]

export function pageTitleFor(pathname: string): string {
  const extra = EXTRA_TITLES.find(e => pathname.startsWith(e.prefix))
  if (extra) return extra.label
  const match = [...STUDENT_NAV]
    .sort((a, b) => b.to.length - a.to.length)
    .find(item => (item.end ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to)))
  return match?.label ?? 'Espaço do Estudante'
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useStudentAuth()
  const { unreadFeedbacks, profile } = useStudent()
  const navigate = useNavigate()
  const name = profile.name || displayName(user)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col justify-between bg-primary text-on-primary">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5 bg-primary-container/20 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-extrabold tracking-tight">SC</span>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">SyncCarreira</span>
            <span className="text-[11px] font-semibold text-primary-fixed-dim">Espaço do Estudante</span>
          </div>
        </div>

        <nav aria-label="Menu do estudante" className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          {STUDENT_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive ? 'bg-white text-primary shadow-sm' : 'text-primary-fixed hover:bg-primary-container hover:text-on-primary',
                )
              }
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </span>
              {item.to === '/aluno/feedbacks' && unreadFeedbacks > 0 && (
                <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-container">
                  {unreadFeedbacks} {unreadFeedbacks === 1 ? 'nova' : 'novas'}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 bg-inverse-surface p-4 text-inverse-on-surface">
        <div className="flex items-center gap-2 rounded-lg bg-white/10 p-2">
          <ShieldCheck className="h-5 w-5 text-primary-fixed" aria-hidden />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-primary-fixed">Ambiente Seguro</span>
            <span className="text-xs text-inverse-on-surface/80">LGPD &amp; Sigilo CFP</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold">{name}</span>
            <span className="truncate text-xs text-inverse-on-surface/70">{profile.email}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair da plataforma"
            aria-label="Sair da plataforma"
            className="rounded-lg p-1.5 text-inverse-on-surface/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentShell() {
  const { journey, nextSession, profile } = useStudent()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const title = pageTitleFor(pathname)

  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo?.({ top: 0 })
  }, [pathname])

  const journeyLabel = journey?.currentJourneyNumber
    ? `Jornada #${journey.currentJourneyNumber} • ${journey.currentJourneyConcluded ? 'Concluída' : 'Em andamento'}`
    : null

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <a href="#conteudo-aluno" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-primary">
        Pular para o conteúdo
      </a>

      {/* Menu lateral fixo (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 shadow-[0_1px_8px_rgba(0,0,0,0.08)] lg:block">
        <Sidebar />
      </aside>

      {/* Menu lateral em gaveta (mobile) */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-primary-deep/50" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-72 max-w-[85%] shadow-raised">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-5 z-10 rounded-lg p-1 text-on-primary hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <header className="sc-no-print fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-3 bg-white/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-64 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="rounded-lg p-1.5 text-primary hover:bg-surface-container-low lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <nav aria-label="Você está em" className="flex min-w-0 items-center gap-1 text-xs font-medium text-on-surface-variant">
            <span className="hidden font-semibold text-primary sm:inline">SyncCarreira</span>
            <ChevronRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
            <span className="hidden md:inline">Espaço do Estudante</span>
            <ChevronRight className="hidden h-3.5 w-3.5 md:block" aria-hidden />
            <span className="truncate font-semibold text-on-surface" aria-current="page">{title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {journeyLabel && (
            <span className="hidden items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-[11px] font-semibold text-primary md:flex">
              <span className={cn('h-2 w-2 rounded-full bg-primary', !journey?.currentJourneyConcluded && 'animate-pulse')} />
              {journeyLabel}
            </span>
          )}
          {nextSession && (
            <NavLink
              to="/aluno/sessoes"
              className="hidden items-center gap-2 rounded-xl bg-surface-container-low px-3 py-1.5 shadow-[0_2px_8px_-2px_rgba(91,44,111,0.08)] hover:bg-surface-container lg:flex"
            >
              <Video className="h-4 w-4 text-primary" aria-hidden />
              <span className="flex flex-col leading-tight">
                <span className="text-[11px] font-semibold text-on-surface">Próxima sessão</span>
                <span className="text-xs text-on-surface-variant">
                  {relativeDayLabel(nextSession.dateTime)} às {formatTime(nextSession.dateTime)}
                  {nextSession.meetLink ? ' (Meet)' : ''}
                </span>
              </span>
            </NavLink>
          )}
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
            title={profile.name}
            aria-hidden
          >
            {initials(profile.name)}
          </span>
        </div>
      </header>

      <main id="conteudo-aluno" className="min-h-screen pt-16 lg:pl-64">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 lg:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

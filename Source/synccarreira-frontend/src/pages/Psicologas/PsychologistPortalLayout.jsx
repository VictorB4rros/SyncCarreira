import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './PsychologistPortalLayout.css'

const navigation = [
  { to: '/psicologa', label: 'Visão geral', icon: 'dashboard', end: true },
  { to: '/psicologa/turmas', label: 'Turmas', icon: 'users' },
  { to: '/psicologa#pd-stages', label: 'Trilhas', icon: 'book', anchor: true },
  { to: '/psicologa#pd-guidance', label: 'Orientações', icon: 'shield', anchor: true },
  { to: '/psicologa#pd-reports', label: 'Relatórios', icon: 'chart', anchor: true },
  { to: '/psicologa/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/psicologa/conteudos', label: 'Conteúdos', icon: 'book' },
]

function PortalIcon({ name, size = 18 }) {
  const common = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...common}>{paths[name]}</svg>
}

function initials(name) {
  return (name || 'Psicóloga')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

function isActiveItem(item, location) {
  if (item.anchor) return location.pathname === '/psicologa' && location.hash === item.to.slice('/psicologa'.length)
  return undefined
}

export default function PsychologistPortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [globalQuery, setGlobalQuery] = useState(() => searchParams.get('busca') || '')

  const name = user?.nome || user?.name || 'Psicóloga'
  const pageTitle = location.pathname.endsWith('/agenda')
    ? 'Agenda'
    : location.pathname.endsWith('/turmas')
      ? 'Turmas'
    : location.pathname.endsWith('/conteudos')
      ? 'Conteúdos'
      : location.pathname.endsWith('/alunos') || location.pathname.includes('/alunos/')
        ? 'Alunos e turmas'
        : location.hash === '#pd-students'
          ? 'Turmas'
          : location.hash === '#pd-stages'
            ? 'Trilhas'
            : location.hash === '#pd-guidance'
              ? 'Orientações'
              : location.hash === '#pd-reports'
                ? 'Relatórios'
        : 'Visão geral'

  useEffect(() => setMenuOpen(false), [location.pathname, location.hash])
  useEffect(() => setGlobalQuery(searchParams.get('busca') || ''), [searchParams])

  useEffect(() => {
    if (!location.hash) return
    const targetId = location.hash.slice(1)
    requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }))
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  function handleSearch(event) {
    event.preventDefault()
    const query = globalQuery.trim()
    navigate(query ? `/psicologa?busca=${encodeURIComponent(query)}#pd-students` : '/psicologa#pd-students')
  }

  return (
    <div className="psy-portal">
      {menuOpen && (
        <button
          className="psy-portal__scrim"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside className={`psy-sidebar${menuOpen ? ' psy-sidebar--open' : ''}`} id="psychologist-sidebar">
        <div className="psy-sidebar__top">
          <Link className="psy-brand" to="/psicologa" aria-label="SyncCarreira, início da psicóloga">
            <span className="psy-brand__mark" aria-hidden="true">S</span>
            <span className="psy-brand__text"><strong>SyncCarreira</strong><small>Orientação &amp; Psicologia</small></span>
          </Link>
          <button className="psy-sidebar__close" type="button" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <PortalIcon name="close" size={20} />
          </button>
          <div className="psy-sidebar__divider" />
          <nav className="psy-nav" aria-label="Navegação da psicóloga">
            {navigation.map(({ to, label, icon, end, anchor }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) => {
                  const active = isActiveItem({ to, anchor }, location) ?? isActive
                  return `psy-nav__link${active ? ' psy-nav__link--active' : ''}`
                }}
              >
                <PortalIcon name={icon} size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="psy-sidebar__footer">
          <div className="psy-privacy"><PortalIcon name="shield" size={16} /><span>Ambiente seguro e confidencial</span></div>
          <div className="psy-account">
            <span className="psy-account__avatar" aria-hidden="true">{initials(name)}</span>
            <span className="psy-account__identity"><strong>{name}</strong><small>{user?.email || 'Psicóloga'}</small></span>
          </div>
          <button className="psy-logout" type="button" onClick={() => void handleLogout()} disabled={loggingOut}>
            <PortalIcon name="logout" size={16} />{loggingOut ? 'Saindo…' : 'Sair'}
          </button>
        </div>
      </aside>

      <div className="psy-workspace">
        <header className="psy-topbar">
          <button
            className="psy-topbar__menu"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="psychologist-sidebar"
          >
            <PortalIcon name="menu" size={21} />
          </button>
          <div className="psy-topbar__context"><span>SyncCarreira</span><span aria-hidden="true">/</span><strong>{pageTitle}</strong></div>
          <form className="psy-topbar__search" role="search" onSubmit={handleSearch}>
            <PortalIcon name="search" size={16} />
            <input value={globalQuery} onChange={event => setGlobalQuery(event.target.value)} placeholder="Buscar aluno ou turma" aria-label="Buscar aluno ou turma" />
            <span aria-hidden="true">Enter</span>
          </form>
          <button className="psy-topbar__action" type="button" onClick={() => navigate('/psicologa/agenda?nova=1')}>
            <PortalIcon name="plus" size={17} /><span>Nova orientação</span>
          </button>
        </header>
        <main className="psy-portal__main"><Outlet /></main>
      </div>
    </div>
  )
}

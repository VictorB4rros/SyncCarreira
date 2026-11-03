/**
 * @file AppHeader.jsx
 * @description Cabeçalho das páginas autenticadas, com navegação principal.
 *
 * @example
 * import AppHeader from '../../components/AppHeader/AppHeader.jsx'
 * <AppHeader />
 */

import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { isAdministrator, isPsychologist } from '../../utils/roles.js'
import './AppHeader.css'

function hasStudentRole(user) {
  const studentRoles = ['ROLE_USER', 'ROLE_STUDENT', 'ROLE_ALUNO']
  return user?.roles?.some(role => studentRoles.includes(role.authority))
    || studentRoles.includes(user?.perfil)
}

export default function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `sc-header__link${isActive ? ' sc-header__link--active' : ''}`

  // O admin é um usuário de sistema: sua "home" é a gestão, não o fluxo de aluno.
  const admin = isAdministrator(user)
  const psicologa = isPsychologist(user)
  let homePath = '/home'
  if (admin) homePath = '/gestao'
  else if (psicologa) homePath = '/painel-progresso'

  // Agendamentos existe só para aluno (RF-16) e psicóloga (RF-08) — nunca para o admin.
  const showAppointments = hasStudentRole(user) || psicologa

  return (
    <header className="sc-header">
      <div className="sc-header__brand">
        <span className="sc-header__mark" aria-hidden="true">S</span>
        <span className="sc-header__name">SyncCarreira</span>
      </div>

      <nav className="sc-header__nav" aria-label="Navegação principal">
        <NavLink to={homePath} className={linkClass}>Início</NavLink>
        {showAppointments && (
          <NavLink to="/agendamentos" className={linkClass}>Agendamentos</NavLink>
        )}
        {hasStudentRole(user) && (
          <>
            <NavLink to="/minha-jornada" className={linkClass}>Minha jornada</NavLink>
            <NavLink to="/perfil" className={linkClass}>Meu perfil</NavLink>
          </>
        )}
        {isAdministrator(user) && (
          <NavLink to="/gestao" className={linkClass}>Gestão</NavLink>
        )}
        {isPsychologist(user) && (
          <>
            <NavLink to="/curadoria-links" className={linkClass}>Curadoria de links</NavLink>
          </>
        )}
      </nav>

      <button className="sc-header__logout" onClick={handleLogout}>
        Sair
      </button>
    </header>
  )
}

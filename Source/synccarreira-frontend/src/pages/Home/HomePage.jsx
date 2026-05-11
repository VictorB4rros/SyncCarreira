import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './HomePage.css'

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
      <div className="hp-root">

        {/* ── Cabeçalho ── */}
        <header className="hp-header">
          <div className="hp-brand">
            <span className="hp-brand__mark" aria-hidden="true">S</span>
            <span className="hp-brand__name">SyncCarreira</span>
          </div>
          <button className="hp-logout" onClick={handleLogout}>
            Sair
          </button>
        </header>

        {/* ── Conteúdo ── */}
        <main className="hp-main">
          <div className="hp-card">

            {/* Avatar com inicial do nome */}
            <div className="hp-avatar" aria-hidden="true">
              {user?.nome?.charAt(0).toUpperCase() ?? '?'}
            </div>

            <h1 className="hp-title">
              Bem-vindo, <span>{user?.nome ?? 'Usuário'}</span>!
            </h1>

            <p className="hp-sub">
              Você está conectado ao SyncCarreira.
            </p>

            {/* Botão para cadastro */}
            <button
                className="hp-btn-cadastro"
                onClick={() => navigate('/cadastro')}
            >
              Cadastrar novo usuário
            </button>

          </div>
        </main>
      </div>
  )
}
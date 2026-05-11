/**
 * @file CadastroPage.jsx
 * @description Página de cadastro de novos usuários do SyncCarreira.
 *
 * Suporta dois perfis de usuário: Aluno e Psicóloga.
 * Os campos exibidos se adaptam ao perfil selecionado —
 * data de nascimento e dúvida vocacional aparecem apenas para alunos.
 *
 * Após cadastro bem-sucedido, redireciona para /login.
 *
 * Dependências:
 *  - authService.register(): envia os dados ao backend
 *  - React Router: useNavigate e Link
 *  - Footer: componente de rodapé reutilizável
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../services/authService'
import Footer from '../../components/Footer/Footer.jsx'
import './CadastroPage.css'

// ─── Constantes ───────────────────────────────────────────────

/** Perfis disponíveis para seleção no cadastro */
const PERFIS = [
  { id: 'aluno',     label: 'Aluno'     },
  { id: 'psicologa', label: 'Psicóloga' },
]

/** Opções do campo "maior dúvida" — exibido apenas para alunos */
const DUVIDAS = [
  'Escolha de curso superior',
  'Mudança de carreira',
  'Autoconhecimento',
  'Mercado de trabalho',
  'Outro',
]

// ─── Componente ───────────────────────────────────────────────

/**
 * CadastroPage
 * Formulário de registro com validação no frontend e envio via authService.
 *
 * @returns {JSX.Element}
 */
export default function CadastroPage() {
  const navigate = useNavigate()

  // ── Estados do formulário ──────────────────────────────────
  const [perfil, setPerfil]     = useState('aluno')
  const [nome, setNome]         = useState('')
  const [email, setEmail]       = useState('')
  const [nascimento, setNasc]   = useState('')
  const [duvida, setDuvida]     = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  // ── Estados de interface ───────────────────────────────────
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // ── Submissão do formulário ────────────────────────────────

  /**
   * Valida os campos, monta o payload e chama authService.register().
   *
   * O payload enviado varia conforme o perfil:
   *  - aluno:     { nome, email, senha, perfil, nascimento, duvida }
   *  - psicóloga: { nome, email, senha, perfil }
   *
   * @param {React.FormEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validação de campos obrigatórios
    if (!nome || !email || !password || !confirm) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }

    setLoading(true)

    try {
      // Monta o payload adaptado ao perfil selecionado
      // TODO: confirmar com o backend se o campo é "senha" ou "password"
      const payload = {
        nome,
        email,
        senha: password,
        perfil,
        // Campos extras apenas para aluno
        ...(perfil === 'aluno' && { nascimento, duvida }),
      }

      await register(payload)

      // TODO: se o backend retornar token no cadastro, salvar e ir para /home
      //       Se não, redirecionar para /login para o usuário fazer login
      navigate('/login')

    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Renderização ──────────────────────────────────────────
  return (
      <div className="cp-root">

        {/* ── Cabeçalho ── */}
        <header className="cp-header">
          <span className="cp-header__brand">SyncCarreira</span>
          <button className="cp-header__help" aria-label="Ajuda">?</button>
        </header>

        <main className="cp-main">

          {/* ── Hero ilustrado ── */}
          <div className="cp-hero">
            <div className="cp-hero__img" aria-hidden="true">
              <svg viewBox="0 0 200 120" width="200" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="120" rx="16" fill="#f3ede8"/>
                <ellipse cx="100" cy="85" rx="60" ry="10" fill="#e8ddd4"/>
                <rect x="40" y="70" width="120" height="28" rx="8" fill="#d4b8a8"/>
                <rect x="35" y="65" width="14" height="33" rx="5" fill="#c4a898"/>
                <rect x="151" y="65" width="14" height="33" rx="5" fill="#c4a898"/>
                <rect x="40" y="60" width="120" height="14" rx="6" fill="#c4a898"/>
                <circle cx="72" cy="52" r="9" fill="#a07850"/><rect x="63" y="61" width="18" height="22" rx="6" fill="#e8927c"/>
                <circle cx="100" cy="50" r="9" fill="#c09070"/><rect x="91" y="59" width="18" height="22" rx="6" fill="#7c6cb0"/>
                <circle cx="128" cy="52" r="9" fill="#806040"/><rect x="119" y="61" width="18" height="22" rx="6" fill="#5b8dd0"/>
              </svg>
            </div>
            <h2 className="cp-hero__title">
              Bem-vindo à sua<br />jornada de autodescoberta
            </h2>
            <p className="cp-hero__sub">
              O SyncCarreira ajuda você a encontrar seu caminho profissional com calma e segurança.
            </p>
          </div>

          {/* ── Card de formulário ── */}
          <div className="cp-card">

            {/* Seleção de perfil */}
            <div className="cp-perfis" role="group" aria-label="Tipo de conta">
              {PERFIS.map(p => (
                  <button
                      key={p.id}
                      type="button"
                      className={`cp-perfil${perfil === p.id ? ' cp-perfil--ativo' : ''}`}
                      onClick={() => setPerfil(p.id)}
                      aria-pressed={perfil === p.id}
                  >
                    <strong>{p.label}</strong>
                  </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Feedback de erro */}
              {error && (
                  <div className="cp-error" role="alert" aria-live="polite">
                    {error}
                  </div>
              )}

              {/* Nome completo */}
              <div className="cp-field">
                <label htmlFor="nome">Qual é o nome completo? *</label>
                <input
                    id="nome" type="text" value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Nome Completo"
                />
              </div>

              {/* E-mail */}
              <div className="cp-field">
                <label htmlFor="email">E-mail *</label>
                <input
                    id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                />
              </div>

              {/* Campos exclusivos do perfil Aluno */}
              {perfil === 'aluno' && (
                  <>
                    <div className="cp-field">
                      <label htmlFor="nasc">Qual é sua data de nascimento?</label>
                      <input
                          id="nasc" type="date" value={nascimento}
                          onChange={e => setNasc(e.target.value)}
                      />
                    </div>

                    <div className="cp-field">
                      <label htmlFor="duvida">Qual é a sua maior dúvida?</label>
                      <select
                          id="duvida" value={duvida}
                          onChange={e => setDuvida(e.target.value)}
                      >
                        <option value="">Selecione um tema</option>
                        {DUVIDAS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </>
              )}

              {/* Senha com toggle de visibilidade */}
              <div className="cp-field">
                <label htmlFor="password">Senha *</label>
                <div className="cp-field__wrap">
                  <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                  />
                  <button
                      type="button" className="cp-field__eye"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPass
                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirmação de senha */}
              <div className="cp-field">
                <label htmlFor="confirm">Confirmar senha *</label>
                <input
                    id="confirm" type="password" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                />
              </div>

              {/* Botão de submit */}
              <button type="submit" className="cp-btn" disabled={loading}>
                {loading ? <span className="cp-spinner" aria-label="Carregando" /> : 'Criar conta'}
              </button>
            </form>

            {/* Link para login */}
            <p className="cp-footer-text">
              Já tem uma conta?{' '}
              <Link to="/login" className="cp-link">Entrar</Link>
            </p>
          </div>
        </main>

        {/* Rodapé modular reutilizável */}
        <Footer />
      </div>
  )
}
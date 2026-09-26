import axios from 'axios'
import api from './api'

// ─── Credenciais OAuth2 ───────────────────────────────────────
const CLIENT_ID     = 'synccarreira-front-id'
const CLIENT_SECRET = 'synccarreira-project-2026'
const BASE_URL      = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// ─── Mapeamento de roleId ─────────────────────────────────────
const ROLE_MAP = {
  aluno:     1,
  psicologa: 2,
}

// ─── Login ────────────────────────────────────────────────────
//
// O login tem 2 etapas, e cada uma tem sua própria mensagem de erro
// (antes as duas caíam em "E-mail ou senha incorretos", escondendo a causa):
//   1. POST /oauth2/token → valida e-mail/senha e devolve o JWT
//   2. GET  /users/me     → carrega os dados e o perfil do usuário
//
// Os detalhes técnicos vão para o console do navegador (F12) para facilitar o debug.

/** Traduz o erro do POST /oauth2/token em uma mensagem para o usuário. */
function tokenErrorMessage(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
  }
  const { status, data } = error.response
  const code = data?.error ?? ''
  if (code === 'invalid_grant' || code === 'Invalid credentials' || status === 400) {
    return 'E-mail ou senha incorretos (ou a conta está sem perfil de acesso).'
  }
  if (status === 401 || code === 'invalid_client') {
    return 'Falha de configuração do login (client OAuth). Avise o suporte.'
  }
  return data?.error_description || code || `Erro ${status} ao fazer login.`
}

export const login = async (email, senha) => {
  // Etapa 1 — token
  let accessToken
  try {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)

    const body = new URLSearchParams()
    body.append('grant_type', 'password')
    body.append('username',   email)
    body.append('password',   senha)

    const response = await axios.post(`${BASE_URL}/oauth2/token`, body, {
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
    })
    accessToken = response.data.access_token
  } catch (error) {
    console.error('[Login] Falha no POST /oauth2/token:', error.response?.status, error.response?.data ?? error.message)
    throw new Error(tokenErrorMessage(error))
  }

  if (!accessToken) {
    throw new Error('O servidor não devolveu o token de acesso.')
  }
  localStorage.setItem('token', accessToken)

  // Etapa 2 — dados do usuário
  try {
    const { data } = await api.get('/users/me')
    const usuario = {
      id:     data.id,
      nome:   data.name,
      email:  data.email,
      perfil: data.roles?.[0]?.authority ?? 'aluno',
      roles:  data.roles,
    }
    return { token: accessToken, usuario }
  } catch (error) {
    console.error('[Login] Falha no GET /users/me:', error.response?.status, error.response?.data ?? error.message)
    localStorage.removeItem('token')
    const status  = error.response?.status
    const detalhe = error.response?.data?.error || error.response?.data?.message || error.message
    throw new Error(
      `Login aceito, mas não foi possível carregar seus dados (GET /users/me` +
      `${status ? ` → ${status}` : ''}${detalhe ? `: ${detalhe}` : ''}).`
    )
  }
}

// ─── Cadastro ─────────────────────────────────────────────────
//
// O backend possui endpoints separados por perfil:
//   POST /students      → aluno
//   POST /psychologists → psicóloga
//
export const register = async (dados) => {
  try {
    let response

    if (dados.perfil === 'psicologa') {
      // Payload para psicóloga
      const payload = {
        name:                   dados.nome,
        email:                  dados.email,
        password:               dados.password,
        roleId:                 ROLE_MAP.psicologa,
        crp:                    dados.crp,
        contractExpirationDate: dados.contractExpirationDate,
      }
      response = await api.post('/psychologists', payload)

    } else {
      // Payload para aluno (perfil padrão)
      const payload = {
        name:         dados.nome,
        email:        dados.email,
        password:     dados.password,
        roleId:       ROLE_MAP.aluno,
        schollarYear: dados.schollarYear,
        schoolType:   dados.schoolType,
      }
      response = await api.post('/students', payload)
    }

    return response.data

  } catch (error) {
    const validationErrors = error.response?.data?.errors
    if (validationErrors?.length) {
      const msgs = validationErrors.map(e => e.message).join(' ')
      throw new Error(msgs)
    }

    const mensagem = error.response?.data?.error
        || error.response?.data?.message
        || 'Erro ao criar a conta. Tente novamente.'
    throw new Error(mensagem)
  }
}

// ─── Usuário logado ───────────────────────────────────────────
// Erros (ex.: 401) são propagados para quem chamou — o AuthContext trata.
export const me = async () => {
  const response = await api.get('/users/me')
  const data = response.data

  return {
    id:     data.id,
    nome:   data.name,
    email:  data.email,
    perfil: data.roles?.[0]?.authority ?? 'aluno',
    roles:  data.roles,
  }
}

// ─── Logout ───────────────────────────────────────────────────
export const logout = async () => {
  try {
    // await api.post('/auth/logout')
  } finally {
    localStorage.removeItem('token')
  }
}
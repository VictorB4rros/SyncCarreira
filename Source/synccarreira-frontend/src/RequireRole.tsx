/**
 * @file RequireRole.tsx
 * @description Guardas de rota (RBAC) do SyncCarreira.
 *
 * Perfis reais do backend (ResourceServerConfig):
 *  - ROLE_ADMIN     → gestão (usuários, instituições, turmas, psicólogas, alunos)
 *  - ROLE_PSICOLOGA → painel de acompanhamento, agenda, feedbacks, curadoria de links
 *  - ROLE_USER      → aluno (jornada, trilhas, sínteses, resultados, sessões)
 *
 * Correções em relação ao AppRoutes.jsx / utils/roles.js antigos:
 *  1. `isStudent()` devolvia true para QUALQUER usuário que não fosse psicóloga — inclusive ADMIN.
 *     Agora aluno é exclusivamente quem tem ROLE_USER.
 *  2. Roles inexistentes no backend (ROLE_STUDENT, ROLE_ALUNO) eram aceitas. Removidas.
 *  3. `perfil = roles[0]` vinha de um Set Java (ordem não garantida). A decisão agora usa a lista
 *     completa de authorities, com precedência explícita ADMIN > PSICOLOGA > USER.
 *  4. Acesso negado redirecionava para /home, que levava ADMIN ao fluxo do aluno (403 em /students/me)
 *     e podia gerar loop. Agora vai para a home do próprio perfil.
 *  5. Usuário autenticado sem nenhum perfil reconhecido via tela própria (com "Sair"), sem loop.
 */

import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LogOut, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ROLES, type AuthUser, type RoleAuthority } from '../types/api'

// ─── Contexto de autenticação (AuthContext.jsx ainda é JS) ───────

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
}

/** `useAuth` tipado — remover o cast quando o AuthContext for migrado para TS. */
export function useTypedAuth(): AuthContextValue {
  return useAuth() as unknown as AuthContextValue
}

// ─── Helpers de perfil ───────────────────────────────────────────

const KNOWN_ROLES: readonly RoleAuthority[] = [ROLES.ADMIN, ROLES.PSICOLOGA, ROLES.USER]

/** Ordem de precedência quando o usuário acumula perfis. */
const ROLE_PRECEDENCE: readonly RoleAuthority[] = [ROLES.ADMIN, ROLES.PSICOLOGA, ROLES.USER]

export const HOME_PATH_BY_ROLE: Record<RoleAuthority, string> = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.PSICOLOGA]: '/psicologa',
  [ROLES.USER]: '/aluno',
}

function isKnownRole(value: unknown): value is RoleAuthority {
  return typeof value === 'string' && (KNOWN_ROLES as readonly string[]).includes(value)
}

/** Todas as authorities reconhecidas do usuário. */
export function getUserRoles(user: AuthUser | null | undefined): RoleAuthority[] {
  if (!user) return []
  const fromRoles = Array.isArray(user.roles) ? user.roles.map((r) => r?.authority) : []
  const source = fromRoles.length > 0 ? fromRoles : [user.perfil]
  return Array.from(new Set(source.filter(isKnownRole)))
}

export function hasAnyRole(
  user: AuthUser | null | undefined,
  allowed: readonly RoleAuthority[],
): boolean {
  const roles = getUserRoles(user)
  return allowed.some((role) => roles.includes(role))
}

/** Perfil principal (ADMIN > PSICOLOGA > USER) ou null se nenhum for reconhecido. */
export function getPrimaryRole(user: AuthUser | null | undefined): RoleAuthority | null {
  const roles = getUserRoles(user)
  return ROLE_PRECEDENCE.find((role) => roles.includes(role)) ?? null
}

export function getHomePath(user: AuthUser | null | undefined): string {
  const role = getPrimaryRole(user)
  return role ? HOME_PATH_BY_ROLE[role] : '/login'
}

export const isAdmin = (user: AuthUser | null | undefined) => hasAnyRole(user, [ROLES.ADMIN])
export const isPsychologist = (user: AuthUser | null | undefined) =>
  hasAnyRole(user, [ROLES.PSICOLOGA])
export const isStudent = (user: AuthUser | null | undefined) => hasAnyRole(user, [ROLES.USER])

// ─── Telas auxiliares ────────────────────────────────────────────

/** Usuário autenticado cujo token não traz nenhum perfil conhecido. */
function NoRoleScreen() {
  const { user, logout } = useTypedAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-['Plus_Jakarta_Sans',Inter,sans-serif]">
      <div
        role="alert"
        className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4"
      >
        <div className="mx-auto w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Perfil de acesso não encontrado</h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          A conta <strong className="text-slate-800">{user?.email}</strong> está autenticada, mas não
          possui um perfil válido (Administrador, Psicóloga ou Aluno). Procure a coordenação da sua
          instituição.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </div>
  )
}

// ─── Guardas ─────────────────────────────────────────────────────

interface RequireRoleProps {
  /** Perfis com acesso. Omitido = qualquer usuário autenticado com perfil válido. */
  allow?: readonly RoleAuthority[]
  /** Conteúdo protegido. Omitido = renderiza <Outlet /> (uso como layout route). */
  children?: ReactNode
}

/**
 * Protege rotas por perfil.
 *  - Não autenticado      → /login (guardando a rota de origem)
 *  - Sem perfil válido    → tela de orientação com "Sair"
 *  - Perfil não permitido → home do próprio perfil (state.forbiddenFrom informa a rota negada)
 */
export function RequireRole({ allow, children }: RequireRoleProps) {
  const { user } = useTypedAuth()
  const location = useLocation()

  if (!user) {
    const from = location.pathname + location.search
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace state={{ from }} />
  }

  const primaryRole = getPrimaryRole(user)
  if (!primaryRole) return <NoRoleScreen />

  if (allow && allow.length > 0 && !hasAnyRole(user, allow)) {
    return (
      <Navigate
        to={HOME_PATH_BY_ROLE[primaryRole]}
        replace
        state={{ forbiddenFrom: location.pathname }}
      />
    )
  }

  return children ? <>{children}</> : <Outlet />
}

/** Rotas só para visitantes (ex.: /login). Logado → home do próprio perfil. */
export function RequireGuest({ children }: { children?: ReactNode }) {
  const { user } = useTypedAuth()
  if (user && getPrimaryRole(user)) return <Navigate to={getHomePath(user)} replace />
  return children ? <>{children}</> : <Outlet />
}

/** Redireciona para a home do perfil atual (ou /login). */
export function RedirectToHome() {
  const { user } = useTypedAuth()
  if (user && !getPrimaryRole(user)) return <NoRoleScreen />
  return <Navigate to={getHomePath(user)} replace />
}

export default RequireRole

/**
 * @file auth.ts
 * @description Adaptador tipado para o AuthContext existente (context/AuthContext.jsx),
 * sem alterar o arquivo original.
 */
import { useAuth } from '../../../context/AuthContext.jsx'
import type { AuthUser } from '../types'

export interface StudentAuth {
  user: AuthUser | null
  logout: () => Promise<void>
}

export function useStudentAuth(): StudentAuth {
  return useAuth() as unknown as StudentAuth
}

export function authoritiesOf(user: AuthUser | null | undefined): string[] {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles.map(r => r.authority)
  return user.perfil ? [user.perfil] : []
}

/**
 * Aluno = ROLE_USER sem perfil de equipe (o backend não tem ROLE_ALUNO/ROLE_STUDENT).
 * Mesma regra do isStudentOnly() de routes/AppRoutes.jsx, para não haver redirecionamento em loop.
 */
export function isStudentUser(user: AuthUser | null | undefined): boolean {
  const roles = authoritiesOf(user)
  return roles.includes('ROLE_USER') && !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_PSICOLOGA')
}

export function displayName(user: AuthUser | null | undefined): string {
  return user?.nome ?? user?.name ?? ''
}

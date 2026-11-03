/**
 * @file roles.js
 * @description Helpers para identificar o perfil do usuário logado.
 *
 * Perfis:
 *  - ROLE_PSICOLOGA → psicóloga/orientadora (RF-08)
 *  - ROLE_USER      → aluno (RF-16)
 *  - ROLE_ADMIN     → administrador (não vê a tela de agendamentos da psicóloga)
 */

const PSYCHOLOGIST_ROLES = ['ROLE_PSICOLOGA']

const STUDENT_ROLES = ['ROLE_USER', 'ROLE_STUDENT', 'ROLE_ALUNO']

/** Lista de authorities do usuário (usa `roles` e, na falta, `perfil`). */
function authoritiesOf(user) {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length) {
    return user.roles.map(r => r.authority)
  }
  return user.perfil ? [user.perfil] : []
}

/** @returns {boolean} true se o usuário deve ver a visão de psicóloga/orientadora */
export function isPsychologist(user) {
  return authoritiesOf(user).some(a => PSYCHOLOGIST_ROLES.includes(a))
}

/** @returns {boolean} true se o usuário deve ter acesso às ferramentas administrativas */
export function isAdministrator(user) {
  return authoritiesOf(user).includes('ROLE_ADMIN')
}

/**
 * @returns {boolean} true se o usuário deve ver a visão de aluno.
 *
 * Aluno é EXCLUSIVAMENTE quem tem uma das STUDENT_ROLES. Antes, o fallback
 * `|| !isPsychologist(user)` fazia qualquer não-psicóloga (inclusive ADMIN)
 * cair no fluxo de aluno — gerando badge "Aluno" e 403 em /students/me.
 */
export function isStudent(user) {
  return authoritiesOf(user).some(a => STUDENT_ROLES.includes(a))
}
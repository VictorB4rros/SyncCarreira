/**
 * @file studentService.js
 * @description Consulta de alunos (usada para escolher os participantes de uma sessão).
 *
 * Endpoint utilizado:
 *  - GET /students?page=&size=  → Page<StudentDetailsDTO>
 */

import api from './api'

/**
 * Busca todos os alunos cadastrados (percorre todas as páginas).
 * @returns {Promise<Array<{id:number, name:string, email:string, className?:string, institutionName?:string}>>}
 */
export const getAllStudents = async () => {
  const size = 100
  let page = 0
  let all = []
  let last = false

  while (!last) {
    const { data } = await api.get('/students', { params: { page, size, sort: 'name,asc' } })
    // O backend retorna Page<...>; se um dia virar lista simples, também funciona
    const content = Array.isArray(data) ? data : (data.content ?? [])
    all = all.concat(content)
    last = Array.isArray(data) ? true : (data.last ?? true)
    page += 1
    if (page > 50) break // proteção contra loop infinito
  }

  return all
}
/**
 * @file questionBankService.js
 * @description UC05 — consulta (somente leitura) do banco de questões das trilhas pela psicóloga.
 *
 * Endpoints utilizados (GET liberado para ROLE_PSICOLOGA no ResourceServerConfig):
 *  - GET /trails     → trilhas, com a ordem sequencial
 *  - GET /questions  → todas as perguntas, com opções e pesos por área
 */

import api from './api'

function toError(error, fallback) {
  const data = error.response?.data
  const wrapped = new Error(data?.error || data?.message || fallback)
  wrapped.status = error.response?.status
  return wrapped
}

/** Carrega trilhas e perguntas em paralelo. */
export async function getQuestionBank() {
  try {
    const [trailsResponse, questionsResponse] = await Promise.all([
      api.get('/trails'),
      api.get('/questions'),
    ])
    return {
      trails: Array.isArray(trailsResponse.data) ? trailsResponse.data : [],
      questions: Array.isArray(questionsResponse.data) ? questionsResponse.data : [],
    }
  } catch (error) {
    throw toError(error, 'Não foi possível carregar o banco de questões.')
  }
}
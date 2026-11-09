/**
 * @file journeyDoubtService.js
 * @description RF-04 — o aluno sinaliza à psicóloga que concluiu a jornada com dúvida/indecisão.
 *
 * Endpoints (JourneyController):
 *  - GET  /journey/doubt → { studentId, inDoubt, doubtFlaggedAt }
 *  - POST /journey/doubt → sinaliza (409 se já sinalizou; 422 se a jornada não foi concluída)
 *  - DELETE /journey/doubt → desfaz a sinalização
 *
 * Ao sinalizar, o backend avisa por e-mail as psicólogas da instituição do aluno,
 * e o aluno aparece nos "Alertas de orientação" do painel da psicóloga.
 */

import api from './api'

export async function getMyDoubt() {
  const { data } = await api.get('/journey/doubt')
  return data
}

export async function flagMyDoubt() {
  try {
    const { data } = await api.post('/journey/doubt')
    return data
  } catch (error) {
    const data = error.response?.data
    const wrapped = new Error(data?.error || data?.message || 'Não foi possível avisar a psicóloga agora. Tente novamente.')
    wrapped.status = error.response?.status
    throw wrapped
  }
}

/** O aluno desfaz a própria sinalização (enviada por engano ou porque mudou de ideia). */
export async function unflagMyDoubt() {
  try {
    // 204 No Content: não há corpo; quem chama atualiza o estado localmente
    await api.delete('/journey/doubt')
  } catch (error) {
    const data = error.response?.data
    const wrapped = new Error(data?.error || data?.message || 'Não foi possível desfazer a sinalização agora. Tente novamente.')
    wrapped.status = error.response?.status
    throw wrapped
  }
}
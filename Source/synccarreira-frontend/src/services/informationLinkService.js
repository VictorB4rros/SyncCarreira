import api from './api'

/** Lista links para a tela de curadoria da psicóloga. */
export async function getManagedInformationLinks() {
  const { data } = await api.get('/information-links')
  return Array.isArray(data) ? data : []
}

/** Busca os links recomendados ao aluno na trilha de Informação. */
export async function getStudentInformationTrail() {
  const { data } = await api.get('/information-links/me')
  return data
}

// Limites do backend (InformationLinkInsertDTO).
const TOPIC_MAX_LENGTH = 255
const URL_MAX_LENGTH = 500
const URL_PATTERN = /^https?:\/\/\S+$/

/**
 * Cadastra um link de carreira ou de acesso à universidade.
 * Valida e normaliza o payload antes de enviar, conforme InformationLinkInsertDTO
 * (topic ≤ 255, url ≤ 500 e iniciada por http:// ou https://).
 */
export async function createInformationLink(link) {
  const topic = (link.topic ?? '').trim()
  const url = (link.url ?? '').trim()

  if (!topic) throw new Error('Informe o tópico ou nome da fonte.')
  if (topic.length > TOPIC_MAX_LENGTH) {
    throw new Error(`O tópico deve ter no máximo ${TOPIC_MAX_LENGTH} caracteres.`)
  }
  if (!URL_PATTERN.test(url)) {
    throw new Error('Informe uma URL válida iniciada por http:// ou https://.')
  }
  if (url.length > URL_MAX_LENGTH) {
    throw new Error(`A URL deve ter no máximo ${URL_MAX_LENGTH} caracteres.`)
  }

  const { data } = await api.post('/information-links', {
    topic,
    url,
    knowledgeArea: link.knowledgeArea ?? null,
  })
  return data
}

/** Exclui um link da curadoria. */
export async function deleteInformationLink(id) {
  await api.delete(`/information-links/${id}`)
}

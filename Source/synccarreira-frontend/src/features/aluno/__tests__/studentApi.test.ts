import { beforeEach, describe, expect, it, vi } from 'vitest'
import { httpError, trails } from '../test/fixtures'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
const downloadFile = vi.hoisted(() => vi.fn())

vi.mock('../../../services/api.js', () => ({ default: http }))
vi.mock('../../../utils/download.js', () => ({ downloadFile }))

import * as api from '../api/studentApi'

beforeEach(() => {
  Object.values(http).forEach(fn => fn.mockReset())
  downloadFile.mockReset()
})

describe('endpoints do aluno', () => {
  it('GET /trails devolve as trilhas ordenadas', async () => {
    http.get.mockResolvedValue({ data: trails })
    const result = await api.getTrails()
    expect(http.get).toHaveBeenCalledWith('/trails')
    expect(result.map(t => t.sequentialOrder)).toEqual([1, 2, 3, 4])
  })

  it('POST /trails/{id}/can-access converte para boolean', async () => {
    http.post.mockResolvedValue({ data: true })
    await expect(api.canAccessTrail(2)).resolves.toBe(true)
    expect(http.post).toHaveBeenCalledWith('/trails/2/can-access')
  })

  it('respostas usam o aluno do token: só trailId na query', async () => {
    http.get.mockResolvedValue({ data: [] })
    await api.getMyAnswers(5)
    expect(http.get).toHaveBeenCalledWith('/answers', { params: { trailId: 5 } })
  })

  it('marcar envia somente questionOptionId; desmarcar usa DELETE com query', async () => {
    http.post.mockResolvedValue({ data: { id: 1 } })
    http.delete.mockResolvedValue({ data: null })
    await api.checkOption(33)
    await api.uncheckOption(33)
    expect(http.post).toHaveBeenCalledWith('/answers', { questionOptionId: 33 })
    expect(http.delete).toHaveBeenCalledWith('/answers', { params: { questionOptionId: 33 } })
  })

  it('síntese é enviada sem espaços nas pontas', async () => {
    http.post.mockResolvedValue({ data: {} })
    await api.submitSynthesis({ trailId: 1, content: '  minha síntese  ' })
    expect(http.post).toHaveBeenCalledWith('/syntheses', { trailId: 1, content: 'minha síntese' })
  })

  it('afinidades vão no PUT /students/me/affinities', async () => {
    const dto = { humanities: 1, exactSciences: 2, biologicalSciences: 3, arts: 4 }
    http.put.mockResolvedValue({ data: {} })
    await api.updateMyAffinities(dto)
    expect(http.put).toHaveBeenCalledWith('/students/me/affinities', dto)
  })

  it('agenda do aluno usa o id do usuário logado', async () => {
    http.get.mockResolvedValue({ data: [] })
    await api.getMyAppointments(7)
    expect(http.get).toHaveBeenCalledWith('/appointments/student/7')
  })

  it('feedback lido usa PATCH /feedbacks/{id}/read', async () => {
    http.patch.mockResolvedValue({ data: { id: 9, read: true } })
    await api.markFeedbackAsRead(9)
    expect(http.patch).toHaveBeenCalledWith('/feedbacks/9/read')
  })

  it('trilha de informação ganha listas vazias quando o backend omite campos', async () => {
    http.get.mockResolvedValue({ data: { recommendedAreas: ['EXATAS'] } })
    const data = await api.getMyInformationTrail()
    expect(data).toEqual({ recommendedAreas: ['EXATAS'], score: null, areaScores: [], careerLinks: [], universityAccessLinks: [] })
  })

  it('PDF da jornada usa o helper de download com nome padrão', async () => {
    downloadFile.mockResolvedValue('jornada-1.pdf')
    await api.downloadJourneyPdf(11, 1)
    expect(downloadFile).toHaveBeenCalledWith(http, '/journeys/me/11/pdf', expect.objectContaining({ fallbackName: 'jornada-1.pdf' }))
  })
})

describe('tratamento de erros', () => {
  it('usa a mensagem do backend (CustomError.error)', () => {
    expect(api.getErrorMessage(httpError(409, 'A síntese já foi enviada.'))).toBe('A síntese já foi enviada.')
  })

  it('junta mensagens de validação (422) e expõe erros por campo', () => {
    const err = httpError(422, 'Dados inválidos', { errors: [{ fieldName: 'arts', message: 'A afinidade deve ser no máximo 5' }] })
    expect(api.getErrorMessage(err)).toBe('A afinidade deve ser no máximo 5')
    expect(api.getFieldErrors(err)).toEqual({ arts: 'A afinidade deve ser no máximo 5' })
  })

  it('sem resposta do servidor informa problema de conexão', () => {
    const err = Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined })
    expect(api.getErrorMessage(err)).toMatch(/conectar ao servidor/)
  })

  it('getHttpStatus lê o status do axios', () => {
    expect(api.getHttpStatus(httpError(403))).toBe(403)
    expect(api.getHttpStatus(new Error('x'))).toBeUndefined()
  })
})

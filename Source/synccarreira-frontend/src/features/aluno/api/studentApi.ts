/**
 * @file studentApi.ts
 * @description Chamadas HTTP da área do aluno (perfil ROLE_USER).
 *
 * Reaproveita a instância axios existente (services/api.js), que já injeta o Bearer token
 * e trata o 401. Nenhum endpoint de outro perfil é chamado aqui.
 */
import type { AxiosError, AxiosInstance } from 'axios'
import httpClient from '../../../services/api.js'
import { downloadFile } from '../../../utils/download.js'
import { sortTrails } from '../lib/journey'
import type {
  AnswerDTO,
  AppointmentDTO,
  CustomError,
  FeedbackDTO,
  InformationTrailDTO,
  JourneyDoubtDTO,
  JourneyRecordDTO,
  JourneyResultDTO,
  JourneyStatusDTO,
  QuestionDTO,
  StudentAffinityDTO,
  StudentProfileDTO,
  SynthesisDTO,
  SynthesisInsertDTO,
  TrailDTO,
} from '../types'

const api = httpClient as unknown as AxiosInstance

// ─── Perfil (RF-14) ─────────────────────────────────────────────

export async function getMyProfile(): Promise<StudentProfileDTO> {
  const { data } = await api.get<StudentProfileDTO>('/students/me')
  return data
}

export async function updateMyAffinities(dto: StudentAffinityDTO): Promise<StudentProfileDTO> {
  const { data } = await api.put<StudentProfileDTO>('/students/me/affinities', dto)
  return data
}

// ─── Trilhas, perguntas e respostas ────────────────────────────

export async function getTrails(): Promise<TrailDTO[]> {
  const { data } = await api.get<TrailDTO[]>('/trails')
  return sortTrails(data ?? [])
}

export async function canAccessTrail(trailId: number): Promise<boolean> {
  const { data } = await api.post<boolean>(`/trails/${trailId}/can-access`)
  return Boolean(data)
}

export async function getTrailQuestions(trailId: number): Promise<QuestionDTO[]> {
  const { data } = await api.get<QuestionDTO[]>(`/questions/trail/${trailId}`)
  return (data ?? []).map(q => ({ ...q, options: q.options ?? [] }))
}

/** Respostas do aluno logado (o backend usa o token, não um studentId). */
export async function getMyAnswers(trailId: number): Promise<AnswerDTO[]> {
  const { data } = await api.get<AnswerDTO[]>('/answers', { params: { trailId } })
  return data ?? []
}

/** Marca uma opção. Em MULTIPLA_ESCOLHA soma; nos demais tipos substitui a resposta anterior. */
export async function checkOption(questionOptionId: number): Promise<AnswerDTO> {
  const { data } = await api.post<AnswerDTO>('/answers', { questionOptionId })
  return data
}

/** Desmarca uma opção (somente MULTIPLA_ESCOLHA). */
export async function uncheckOption(questionOptionId: number): Promise<void> {
  await api.delete('/answers', { params: { questionOptionId } })
}

// ─── Sínteses (RF-11) ───────────────────────────────────────────

export async function getMySyntheses(): Promise<SynthesisDTO[]> {
  const { data } = await api.get<SynthesisDTO[]>('/syntheses/me')
  return Array.isArray(data) ? data : []
}

export async function submitSynthesis(dto: SynthesisInsertDTO): Promise<SynthesisDTO> {
  const { data } = await api.post<SynthesisDTO>('/syntheses', { ...dto, content: dto.content.trim() })
  return data
}

// ─── Trilha de informação / Hub de conteúdos ───────────────────

export async function getMyInformationTrail(): Promise<InformationTrailDTO> {
  const { data } = await api.get<InformationTrailDTO>('/information-links/me')
  return {
    recommendedAreas: data?.recommendedAreas ?? [],
    score: data?.score ?? null,
    areaScores: data?.areaScores ?? [],
    careerLinks: data?.careerLinks ?? [],
    universityAccessLinks: data?.universityAccessLinks ?? [],
  }
}

// ─── Jornada, resultado e histórico (RF-15) ────────────────────

export async function getCurrentJourney(): Promise<JourneyStatusDTO> {
  const { data } = await api.get<JourneyStatusDTO>('/journeys/me/current')
  return data
}

export async function getJourneyHistory(): Promise<JourneyRecordDTO[]> {
  const { data } = await api.get<JourneyRecordDTO[]>('/journeys/me')
  return data ?? []
}

export async function startNewJourney(): Promise<JourneyStatusDTO> {
  const { data } = await api.post<JourneyStatusDTO>('/journeys/me/new')
  return data
}

export async function getCurrentResult(): Promise<JourneyResultDTO> {
  const { data } = await api.get<JourneyResultDTO>('/journey/result')
  return data
}

export async function getJourneyResult(journeyId: number): Promise<JourneyResultDTO> {
  const { data } = await api.get<JourneyResultDTO>(`/journeys/me/${journeyId}/result`)
  return data
}

export function downloadJourneyPdf(journeyId: number, journeyNumber?: number): Promise<string> {
  return downloadFile(api, `/journeys/me/${journeyId}/pdf`, {
    fallbackName: `jornada-${journeyNumber ?? journeyId}.pdf`,
    errorMessage: 'Não foi possível gerar o PDF da jornada.',
    timeout: 60000,
  })
}

export async function getMyDoubt(): Promise<JourneyDoubtDTO> {
  const { data } = await api.get<JourneyDoubtDTO>('/journey/doubt')
  return data
}

export async function flagDoubt(): Promise<JourneyDoubtDTO> {
  const { data } = await api.post<JourneyDoubtDTO>('/journey/doubt')
  return data
}

// ─── Sessões e feedbacks ────────────────────────────────────────

/** O backend só permite consultar a própria agenda: studentId é o id do usuário logado. */
export async function getMyAppointments(studentId: number): Promise<AppointmentDTO[]> {
  const { data } = await api.get<AppointmentDTO[]>(`/appointments/student/${studentId}`)
  return data ?? []
}

export async function getMyFeedbacks(): Promise<FeedbackDTO[]> {
  const { data } = await api.get<FeedbackDTO[]>('/feedbacks/me')
  return data ?? []
}

export async function markFeedbackAsRead(feedbackId: number): Promise<FeedbackDTO> {
  const { data } = await api.patch<FeedbackDTO>(`/feedbacks/${feedbackId}/read`)
  return data
}

// ─── Erros ──────────────────────────────────────────────────────

function asAxiosError(error: unknown): AxiosError<CustomError> | null {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    return error as AxiosError<CustomError>
  }
  return null
}

export function getHttpStatus(error: unknown): number | undefined {
  return asAxiosError(error)?.response?.status
}

/** Mensagem pronta para o usuário: usa o texto do backend (CustomError.error) quando existe. */
export function getErrorMessage(error: unknown, fallback = 'Algo deu errado. Tente novamente.'): string {
  const axiosError = asAxiosError(error)
  if (axiosError) {
    if (!axiosError.response) {
      return axiosError.code === 'ECONNABORTED'
        ? 'O servidor demorou para responder. Tente novamente.'
        : 'Não foi possível conectar ao servidor. Verifique sua conexão.'
    }
    const data = axiosError.response.data
    const fieldMessages = data?.errors?.map(e => e.message).filter(Boolean) ?? []
    if (fieldMessages.length > 0) return fieldMessages.join(' ')
    if (typeof data?.error === 'string' && data.error.trim()) return data.error
    if (axiosError.response.status === 403) return 'Você não tem acesso a este recurso.'
    if (axiosError.response.status >= 500) return 'O servidor encontrou um erro. Tente novamente em instantes.'
    return fallback
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Erros por campo do ValidationError (HTTP 422). */
export function getFieldErrors(error: unknown): Record<string, string> {
  const errors = asAxiosError(error)?.response?.data?.errors ?? []
  return Object.fromEntries(errors.map(e => [e.fieldName, e.message]))
}

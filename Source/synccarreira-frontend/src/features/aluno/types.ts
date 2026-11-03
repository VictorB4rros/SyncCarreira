/**
 * @file types.ts
 * @description Contratos usados pela área do aluno, espelhando os DTOs do synccarreira-api.
 *
 * Serialização (Jackson):
 *  - Long / Integer / Double → number (wrappers podem vir null)
 *  - Instant        → string ISO com fuso ("2026-10-25T13:00:00Z")
 *  - LocalDateTime  → string ISO sem fuso ("2026-10-26T14:30:00"), no fuso da instituição
 *  - LocalDate      → "yyyy-MM-dd"
 *
 * Mantido dentro do módulo de propósito, para não depender de arquivos de outras etapas.
 */

export type RoleAuthority = 'ROLE_ADMIN' | 'ROLE_PSICOLOGA' | 'ROLE_USER'
export type KnowledgeArea = 'HUMANAS' | 'BIOLOGICAS' | 'EXATAS' | 'ARTES'
export type TrailName = 'AUTOCONHECIMENTO' | 'INFLUENCIAS' | 'PLANO_DE_FUTURO' | 'INFORMACAO'
export type QuestionType = 'MULTIPLA_ESCOLHA' | 'CHECKBOX' | 'LIKERT' | 'ABERTA'
export type ScheduleStatus = 'AGENDADA' | 'CANCELADA' | 'REALIZADA'
export type ScheduleType = 'INDIVIDUAL' | 'GRUPO'
export type FeedbackType = 'JORNADA' | 'SESSAO'

/** Usuário normalizado pelo AuthContext (services/authService.js). */
export interface AuthUser {
  id: number
  nome?: string
  name?: string
  email?: string
  perfil?: string
  roles?: { id?: number; authority: string }[]
}

export interface CustomError {
  timestamp?: string
  status?: number
  error?: string
  path?: string
  errors?: { fieldName: string; message: string }[]
}

// ─── Perfil ─────────────────────────────────────────────────────

export interface StudentAffinityDTO {
  humanities: number | null
  exactSciences: number | null
  biologicalSciences: number | null
  arts: number | null
}

export interface StudentScoreDTO {
  studentId: number
  humanitiesScore: number | null
  exactSciencesScore: number | null
  biologicalSciencesScore: number | null
  artsScore: number | null
}

export interface StudentProfileDTO {
  id: number
  name: string
  email: string
  profileCompleted: boolean
  profileCompletedAt: string | null
  affinities: StudentAffinityDTO
  score: StudentScoreDTO
}

// ─── Trilhas, perguntas, respostas, sínteses ───────────────────

export interface TrailDTO {
  id: number
  name: TrailName
  sequentialOrder: number | null
}

export interface QuestionOptionDTO {
  id: number
  optionText: string
  humanitiesWeight?: number | null
  biologicalSciencesWeight?: number | null
  exactSciencesWeight?: number | null
  artsWeight?: number | null
}

export interface QuestionDTO {
  id: number
  content: string
  questionType: QuestionType
  trailId: number | null
  options: QuestionOptionDTO[]
}

export interface AnswerDTO {
  id: number
  content?: string | null
  questionOptionDTO: QuestionOptionDTO | null
}

export interface SynthesisDTO {
  id: number
  content: string
  trailId: number
  trailName: TrailName
  trailSequentialOrder: number | null
  journeySynthesis: boolean
  createdAt: string
}

export interface SynthesisInsertDTO {
  trailId: number
  content: string
}

// ─── Jornada e resultado ───────────────────────────────────────

export interface JourneyStatusDTO {
  currentJourneyNumber: number | null
  currentJourneyStartedAt: string | null
  currentJourneyConcluded: boolean
  concludedJourneys: number
}

export interface JourneyRecordDTO {
  id: number
  journeyNumber: number
  startedAt: string | null
  concludedAt: string | null
  schoolClassName: string | null
  schoolYear: number | null
  institutionName: string | null
  humanitiesScore: number | null
  exactSciencesScore: number | null
  biologicalSciencesScore: number | null
  artsScore: number | null
  affinities: StudentAffinityDTO
  highestScoreAreas: KnowledgeArea[]
  inDoubt: boolean
  doubtFlaggedAt: string | null
}

export interface JourneyDoubtDTO {
  studentId: number
  inDoubt: boolean
  doubtFlaggedAt: string | null
}

export interface AreaScoreDTO {
  area: KnowledgeArea
  areaName: string
  score: number
  maxScore: number
  percentage: number
  highlighted: boolean
}

export interface SubareaDTO {
  id: number
  area: KnowledgeArea
  name: string
  description: string
  careers: string[]
}

export interface JourneyResultDTO {
  journeyId: number
  journeyNumber: number
  concludedAt: string | null
  scores: AreaScoreDTO[]
  highlightedAreas: KnowledgeArea[]
  suggestions: SubareaDTO[]
  disclaimer: string
}

// ─── Trilha de informação ──────────────────────────────────────

export interface InformationLinkDTO {
  id: number
  topic: string
  url: string
  knowledgeArea: KnowledgeArea | null
}

export interface InformationTrailDTO {
  recommendedAreas: KnowledgeArea[]
  score: StudentScoreDTO | null
  areaScores: AreaScoreDTO[]
  careerLinks: InformationLinkDTO[]
  universityAccessLinks: InformationLinkDTO[]
}

// ─── Sessões e feedbacks ───────────────────────────────────────

export interface AppointmentParticipantDTO {
  id: number
  name: string
  email: string
}

export interface AppointmentDTO {
  id: number
  title: string
  description: string | null
  dateTime: string
  durationMinutes: number
  scheduleType: ScheduleType
  scheduleStatus: ScheduleStatus
  psychologist: AppointmentParticipantDTO | null
  students: AppointmentParticipantDTO[]
  googleEventId?: string | null
  meetLink: string | null
  calendarLink: string | null
  cancelReason: string | null
}

export interface FeedbackDTO {
  id: number
  type: FeedbackType
  content: string
  studentId: number
  studentName: string
  psychologistId: number
  psychologistName: string
  journeyNumber: number | null
  appointmentId: number | null
  appointmentTitle: string | null
  appointmentDateTime: string | null
  createdAt: string
  readAt: string | null
  read: boolean
}

/** Limites de validação do backend (DTOs com @Size/@Min/@Max). */
export const LIMITS = {
  synthesisMaxLength: 5000,
  affinityMin: 0,
  affinityMax: 5,
} as const

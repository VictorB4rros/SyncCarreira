/**
 * @file api.ts
 * @description Contratos TypeScript espelhando os DTOs do synccarreira-api (Spring Boot).
 *
 * Convenções de serialização (Jackson):
 *  - `Long` / `Integer` / `Double`  → number
 *  - `Instant`                      → string ISO-8601 com fuso (ex.: "2026-10-25T13:00:00Z")
 *  - `LocalDateTime`                → string ISO-8601 sem fuso (ex.: "2026-10-26T14:30:00")
 *  - `LocalDate`                    → string "yyyy-MM-dd"
 *  - Campos de wrapper (Integer, Long, Double...) podem vir `null`; primitivos (int, boolean) nunca.
 *
 * ATENÇÃO: alguns nomes de campo reproduzem grafias do backend (`schollarYear` em StudentDTO /
 * StudentInsertDTO vs. `scholarYear` em StudentDetailsDTO). Não "corrija" aqui sem corrigir lá.
 */

// ════════════════════════════════════════════════════════════════
// Tipos utilitários
// ════════════════════════════════════════════════════════════════

/** org.springframework.data.domain.Page<T> (formato padrão do Spring Data). */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  /** Índice da página atual (base 0). */
  number: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

/** Parâmetros aceitos por endpoints com `Pageable`. */
export interface PageableParams {
  page?: number
  size?: number
  /** Ex.: "name,asc" */
  sort?: string
}

// ════════════════════════════════════════════════════════════════
// Enums (entities/enums)
// ════════════════════════════════════════════════════════════════

export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  PSICOLOGA: 'ROLE_PSICOLOGA',
  USER: 'ROLE_USER',
} as const
export type RoleAuthority = (typeof ROLES)[keyof typeof ROLES]

export type FeedbackType = 'JORNADA' | 'SESSAO'
export type InstitutionType = 'PUBLICA' | 'PARTICULAR' | 'ONG'
export type KnowledgeArea = 'HUMANAS' | 'BIOLOGICAS' | 'EXATAS' | 'ARTES'
export type ProgressStatus = 'NAO_INICIADA' | 'EM_ANDAMENTO' | 'CONCLUIDA'
export type QuestionType = 'MULTIPLA_ESCOLHA' | 'CHECKBOX' | 'LIKERT' | 'ABERTA'
export type ScheduleStatus = 'AGENDADA' | 'CANCELADA' | 'REALIZADA'
export type ScheduleType = 'INDIVIDUAL' | 'GRUPO'
export type TrailName = 'AUTOCONHECIMENTO' | 'INFLUENCIAS' | 'INFORMACAO' | 'PLANO_DE_FUTURO'

/** Rótulos de exibição (pt-BR) para os enums mais usados na UI. */
export const TRAIL_LABELS: Record<TrailName, string> = {
  AUTOCONHECIMENTO: 'Autoconhecimento',
  INFLUENCIAS: 'Influências Externas',
  INFORMACAO: 'Informação Profissional',
  PLANO_DE_FUTURO: 'Projeto de Futuro',
}

export const KNOWLEDGE_AREA_LABELS: Record<KnowledgeArea, string> = {
  HUMANAS: 'Ciências Humanas & Sociais',
  BIOLOGICAS: 'Ciências Biológicas & Saúde',
  EXATAS: 'Ciências Exatas & Tecnologia',
  ARTES: 'Artes, Design & Comunicação',
}

export const PROGRESS_STATUS_LABELS: Record<ProgressStatus, string> = {
  NAO_INICIADA: 'Não iniciada',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
}

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  AGENDADA: 'Agendada',
  CANCELADA: 'Cancelada',
  REALIZADA: 'Realizada',
}

// ════════════════════════════════════════════════════════════════
// Limites de validação (constantes dos DTOs Java)
// ════════════════════════════════════════════════════════════════

export const VALIDATION_LIMITS = {
  /** UserInsertDTO.password / NewPasswordDTO.password — @Size(min = 8) */
  PASSWORD_MIN_LENGTH: 8,
  /** StudentAffinityDTO.MIN / MAX */
  AFFINITY_MIN: 0,
  AFFINITY_MAX: 5,
  /** SynthesisInsertDTO.MAX_CONTENT_LENGTH */
  SYNTHESIS_MAX_LENGTH: 5000,
  /** FeedbackDTO.MAX_CONTENT_LENGTH */
  FEEDBACK_MAX_LENGTH: 5000,
  /** InformationLinkInsertDTO */
  LINK_TOPIC_MAX_LENGTH: 255,
  LINK_URL_MAX_LENGTH: 500,
  /** InformationLinkInsertDTO.url — @Pattern */
  LINK_URL_PATTERN: /^\s*https?:\/\/\S+\s*$/,
} as const

// ════════════════════════════════════════════════════════════════
// Erros (dto/CustomError, dto/ValidationError, dto/FieldMessage)
// ════════════════════════════════════════════════════════════════

/** Corpo padrão de erro do ControllerExceptionHandler. */
export interface CustomError {
  timestamp: string
  status: number
  /** Mensagem legível (ex.: "Dados inválidos", "Recurso não encontrado"). */
  error: string
  path: string
}

export interface FieldMessage {
  fieldName: string
  message: string
}

/** 422 de Bean Validation (MethodArgumentNotValidException). */
export interface ValidationError extends CustomError {
  errors: FieldMessage[]
}

/** Erro do Authorization Server (POST /oauth2/token) — formato OAuth2, não CustomError. */
export interface OAuthErrorResponse {
  error: string
  error_description?: string
}

// ════════════════════════════════════════════════════════════════
// AUTH — /oauth2/token, /auth, /users/me
// ════════════════════════════════════════════════════════════════

/** Body form-urlencoded de POST /oauth2/token (grant customizado "password"). */
export interface OAuthPasswordGrantRequest {
  grant_type: 'password'
  username: string
  password: string
}

/** Resposta de POST /oauth2/token. */
export interface OAuthTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  scope?: string
}

/** Claims do JWT emitido (AuthorizationServerConfig.tokenCustomizer). */
export interface JwtClaims {
  sub: string
  username: string
  authorities: RoleAuthority[]
  exp: number
  iat: number
  iss?: string
}

/** dto/RoleDTO */
export interface RoleDTO {
  id: number
  authority: RoleAuthority
}

/** dto/UserDTO — também retornado por GET /users/me. */
export interface UserDTO {
  id: number
  name: string
  email: string
  roles: RoleDTO[]
}

/** PUT /auth/new-password (público — primeiro acesso / recuperação). */
export interface NewPasswordDTO {
  token: string
  password: string
}

/**
 * Usuário de sessão como o AuthContext o mantém hoje (authService.me()).
 * `nome`/`perfil` são aliases legados; prefira `name`/`roles`.
 */
export interface AuthUser {
  id: number
  nome: string
  name?: string
  email: string
  /** Legado: primeira authority do Set (ordem NÃO garantida). Não usar para RBAC. */
  perfil?: string
  roles: RoleDTO[]
}

// ════════════════════════════════════════════════════════════════
// ADMIN — usuários, psicólogas, alunos, instituições, turmas, trilhas, perguntas
// ════════════════════════════════════════════════════════════════

/** POST /users */
export interface UserInsertDTO {
  name: string
  email: string
  roleId: number
  password: string
}

/** PUT /users/{id} */
export interface UserUpdateDTO {
  name: string
  email: string
  roleId: number
}

/** dto/PsychologistDTO — GET /psychologists, /psychologists/{id} */
export interface PsychologistDTO {
  id: number
  name: string
  email: string
  crp: string
  contractExpirationDate: string
  institutionId: number | null
  institutionName: string | null
  isContractValid: boolean
  roles: RoleDTO[]
}

/** POST /psychologists e PUT /psychologists/{id} */
export interface PsychologistInsertDTO {
  name: string
  email: string
  crp: string
  institutionId?: number | null
  contractExpirationDate: string
}

/** dto/StudentDTO — GET /students/{id}, retorno de POST/PUT /students */
export interface StudentDTO {
  id: number
  name: string
  email: string
  roles: RoleDTO[]
  /** Grafia do backend: "schollarYear". */
  schollarYear: string | null
  schoolType: string | null
  race: string | null
}

/** dto/StudentDetailsDTO — itens de GET /students (Page) */
export interface StudentDetailsDTO {
  id: number
  name: string
  email: string
  scholarYear: string | null
  schoolType: string | null
  race: string | null
  className: string | null
  institutionName: string | null
}

/** POST /students e PUT /students/{id} */
export interface StudentInsertDTO {
  name: string
  email: string
  /** Grafia do backend: "schollarYear". */
  schollarYear?: string | null
  schoolType?: string | null
  race?: string | null
}

/** dto/InstitutionDTO */
export interface InstitutionDTO {
  id: number
  legalName: string
  tradeName: string | null
  cnpj: string
  type: InstitutionType
  active: boolean
  classCount: number
  createdAt: string
}

/** POST /institutions */
export interface InstitutionInsertDTO {
  legalName: string
  tradeName?: string | null
  cnpj: string
  type: InstitutionType
}

/** PUT /institutions/{id} */
export interface InstitutionUpdateDTO extends InstitutionInsertDTO {
  active: boolean
}

/** dto/SchoolClassDTO */
export interface SchoolClassDTO {
  id: number
  name: string
  schoolYear: number
  institutionId: number
  institutionName: string
  createdAt: string
}

/** POST /classes */
export interface SchoolClassInsertDTO {
  name: string
  schoolYear: number
  institutionId: number
}

/** PUT /classes/{id} */
export interface SchoolClassUpdateDTO {
  name: string
  schoolYear: number
}

/** dto/TrailDTO — GET /trails (público), POST /trails */
export interface TrailDTO {
  id: number
  name: TrailName
  sequentialOrder: number | null
}

/** PUT /trails/{id} */
export interface TrailUpdateDTO {
  name: TrailName
  sequentialOrder?: number | null
}

/** dto/QuestionOptionDTO */
export interface QuestionOptionDTO {
  id: number
  optionText: string
  humanitiesWeight: number | null
  biologicalSciencesWeight: number | null
  exactSciencesWeight: number | null
  artsWeight: number | null
}

/** dto/QuestionDTO — leitura e escrita (POST/PUT /questions). */
export interface QuestionDTO {
  id: number | null
  content: string
  questionType: QuestionType
  trailId: number
  options: QuestionOptionDTO[]
}

// ════════════════════════════════════════════════════════════════
// PSICÓLOGA — painel, relatórios, agenda, feedbacks, curadoria de links
// ════════════════════════════════════════════════════════════════

/** PanelDTOs.TrailProgress */
export interface TrailProgress {
  trailId: number
  trailName: TrailName
  sequentialOrder: number | null
  answeredQuestions: number
  totalQuestions: number
  progressPercentage: number
  synthesisSubmitted: boolean
  status: ProgressStatus
}

/** PanelDTOs.StudentStatus */
export interface StudentStatus {
  studentId: number
  studentName: string
  schoolClassId: number | null
  schoolClassName: string | null
  answeredQuestions: number
  totalQuestions: number
  progressPercentage: number
  concludedTrails: number
  totalTrails: number
  currentTrail: TrailName | null
  finalSynthesisSubmitted: boolean
  journeyStatus: ProgressStatus
  inDoubt: boolean
  doubtFlaggedAt: string | null
  trails: TrailProgress[]
}

/** PanelDTOs.PanelSummary — GET /psychologist-panel/{psychologistId} */
export interface PanelSummary {
  totalStudents: number
  notStartedStudents: number
  inProgressStudents: number
  concludedStudents: number
  inDoubtStudents: number
  students: StudentStatus[]
}

/** ReportDTOs.StudentReport (base dos .xlsx) */
export interface StudentReport {
  studentId: number
  name: string
  email: string
  scholarYear: string | null
  schoolType: string | null
  race: string | null
  schoolClassName: string | null
  schoolYear: number | null
  institutionName: string | null
  humanitiesScore: number | null
  exactSciencesScore: number | null
  biologicalSciencesScore: number | null
  artsScore: number | null
  highestScoreAreas: KnowledgeArea[]
  status: StudentStatus
  syntheses: SynthesisDTO[]
}

/** ReportDTOs.ClassReport */
export interface ClassReport {
  schoolClassId: number
  schoolClassName: string
  schoolYear: number | null
  institutionName: string | null
  totalStudents: number
  notStartedStudents: number
  inProgressStudents: number
  concludedStudents: number
  inDoubtStudents: number
  students: StudentReport[]
}

/** MIME dos relatórios (ReportFile.XLSX_MEDIA_TYPE). */
export const XLSX_MEDIA_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** dto/AppointmentParticipantDTO */
export interface AppointmentParticipantDTO {
  id: number
  name: string
  email: string
}

/** dto/AppointmentDTO */
export interface AppointmentDTO {
  id: number
  title: string
  description: string | null
  dateTime: string
  durationMinutes: number
  scheduleType: ScheduleType
  scheduleStatus: ScheduleStatus
  psychologist: AppointmentParticipantDTO
  students: AppointmentParticipantDTO[]
  googleEventId: string | null
  meetLink: string | null
  calendarLink: string | null
  feedback: string | null
  feedbackDate: string | null
  cancelReason: string | null
}

/** POST /appointments e PUT /appointments/{id} */
export interface AppointmentInsertDTO {
  title: string
  description?: string | null
  /** Deve estar no futuro (@Future). */
  dateTime: string
  /** > 0 (@Positive). */
  durationMinutes: number
  scheduleType: ScheduleType
  psychologistId: number
  /** Ao menos um aluno (@NotEmpty). */
  studentIds: number[]
  googleEventId?: string | null
  meetLink?: string | null
  calendarLink?: string | null
}

/** PATCH /appointments/{id}/cancel */
export interface AppointmentCancelDTO {
  cancelReason: string
}

/** PUT /appointments/{id}/feedback */
export interface AppointmentFeedbackDTO {
  feedback: string
}

/** dto/feedback/FeedbackDTO */
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

/** POST /feedbacks/journey */
export interface JourneyFeedbackInsertDTO {
  studentId: number
  journeyNumber?: number | null
  content: string
}

/** POST /feedbacks/session */
export interface SessionFeedbackInsertDTO {
  appointmentId: number
  studentId: number
  content: string
}

/** GET /feedbacks/panel/{psychologistId} */
export interface StudentFeedbackStatusDTO {
  studentId: number
  studentName: string
  schoolClassName: string | null
  concludedJourneys: number
  lastConcludedJourneyNumber: number | null
  journeyFeedbackSent: boolean
  sessionFeedbacksSent: number
}

/** dto/InformationLinkDTO */
export interface InformationLinkDTO {
  id: number
  topic: string
  url: string
  knowledgeArea: KnowledgeArea | null
}

/** POST /information-links */
export interface InformationLinkInsertDTO {
  topic: string
  url: string
  knowledgeArea?: KnowledgeArea | null
}

// ════════════════════════════════════════════════════════════════
// ALUNO — perfil, trilhas, respostas, sínteses, jornada, resultado
// ════════════════════════════════════════════════════════════════

/** dto/StudentAffinityDTO — PUT /students/me/affinities (cada valor entre 0 e 5). */
export interface StudentAffinityDTO {
  humanities: number
  exactSciences: number
  biologicalSciences: number
  arts: number
}

/** dto/StudentScoreDTO — GET /students/{id}/score */
export interface StudentScoreDTO {
  studentId: number
  humanitiesScore: number | null
  exactSciencesScore: number | null
  biologicalSciencesScore: number | null
  artsScore: number | null
}

/** dto/StudentProfileDTO — GET /students/me */
export interface StudentProfileDTO {
  id: number
  name: string
  email: string
  profileCompleted: boolean
  profileCompletedAt: string | null
  affinities: StudentAffinityDTO | null
  score: StudentScoreDTO | null
}

/** dto/AnswerDTO — GET /answers */
export interface AnswerDTO {
  id: number
  content: string | null
  student: StudentDTO
  questionOptionDTO: QuestionOptionDTO
}

/** POST /answers */
export interface AnswerInsertDTO {
  questionOptionId: number
}

/** dto/SynthesisDTO — GET /syntheses/me */
export interface SynthesisDTO {
  id: number
  content: string
  trailId: number | null
  trailName: TrailName | null
  trailSequentialOrder: number | null
  journeySynthesis: boolean
  createdAt: string
}

/** POST /syntheses (content ≤ 5000). */
export interface SynthesisInsertDTO {
  trailId: number
  content: string
}

/** GET|POST /journey/doubt */
export interface JourneyDoubtDTO {
  studentId: number
  inDoubt: boolean
  doubtFlaggedAt: string | null
}

/** GET /journeys/me/current, POST /journeys/me/new */
export interface JourneyStatusDTO {
  currentJourneyNumber: number | null
  currentJourneyStartedAt: string | null
  currentJourneyConcluded: boolean
  concludedJourneys: number
}

/** GET /journeys/me (histórico) */
export interface JourneyRecordDTO {
  id: number
  journeyNumber: number
  startedAt: string
  concludedAt: string | null
  schoolClassName: string | null
  schoolYear: number | null
  institutionName: string | null
  humanitiesScore: number | null
  exactSciencesScore: number | null
  biologicalSciencesScore: number | null
  artsScore: number | null
  affinities: StudentAffinityDTO | null
  highestScoreAreas: KnowledgeArea[]
  inDoubt: boolean
  doubtFlaggedAt: string | null
}

/** JourneyContent.AnswerContent */
export interface JourneyAnswerContent {
  question: string
  questionType: QuestionType
  answer: string
}

/** JourneyContent.TrailContent */
export interface JourneyTrailContent {
  trailName: TrailName
  sequentialOrder: number | null
  answers: JourneyAnswerContent[]
  synthesis: string | null
  synthesisCreatedAt: string | null
}

/** JourneyContent.LinkContent */
export interface JourneyLinkContent {
  topic: string
  url: string
  knowledgeArea: KnowledgeArea | null
}

/** dto/journey/JourneyContent */
export interface JourneyContent {
  trails: JourneyTrailContent[]
  links: JourneyLinkContent[]
}

/** dto/result/AreaScoreDTO */
export interface AreaScoreDTO {
  area: KnowledgeArea
  areaName: string
  score: number
  maxScore: number
  percentage: number
  highlighted: boolean
}

/** dto/result/SubareaDTO */
export interface SubareaDTO {
  id: number
  area: KnowledgeArea
  name: string
  description: string | null
  careers: string[]
}

/** GET /journey/result e GET /journeys/me/{journeyId}/result */
export interface JourneyResultDTO {
  journeyId: number
  journeyNumber: number
  concludedAt: string | null
  scores: AreaScoreDTO[]
  highlightedAreas: KnowledgeArea[]
  suggestions: SubareaDTO[]
  disclaimer: string
}

/** GET /information-links/me — Pilar 03 (Informação Profissional). */
export interface InformationTrailDTO {
  recommendedAreas: KnowledgeArea[]
  score: StudentScoreDTO | null
  areaScores: AreaScoreDTO[]
  careerLinks: InformationLinkDTO[]
  universityAccessLinks: InformationLinkDTO[]
}

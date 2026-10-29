/**
 * Fábricas de dados no formato exato dos DTOs do backend, para os testes.
 */
import type {
  AnswerDTO,
  AppointmentDTO,
  AuthUser,
  FeedbackDTO,
  JourneyResultDTO,
  JourneyStatusDTO,
  QuestionDTO,
  StudentProfileDTO,
  SynthesisDTO,
  TrailDTO,
} from '../types'

export const studentUser: AuthUser = {
  id: 7,
  nome: 'Ana Clara Souza',
  email: 'ana@escola.com',
  perfil: 'ROLE_USER',
  roles: [{ id: 1, authority: 'ROLE_USER' }],
}

export function makeProfile(overrides: Partial<StudentProfileDTO> = {}): StudentProfileDTO {
  return {
    id: 7,
    name: 'Ana Clara Souza',
    email: 'ana@escola.com',
    profileCompleted: true,
    profileCompletedAt: '2026-03-10T12:00:00Z',
    affinities: { humanities: 4, exactSciences: 5, biologicalSciences: 2, arts: 3 },
    score: { studentId: 7, humanitiesScore: 10, exactSciencesScore: 12, biologicalSciencesScore: 4, artsScore: 6 },
    ...overrides,
  }
}

export const journeyInProgress: JourneyStatusDTO = {
  currentJourneyNumber: 1,
  currentJourneyStartedAt: '2026-03-10T12:00:00Z',
  currentJourneyConcluded: false,
  concludedJourneys: 0,
}

export const trails: TrailDTO[] = [
  { id: 3, name: 'PLANO_DE_FUTURO', sequentialOrder: 3 },
  { id: 1, name: 'AUTOCONHECIMENTO', sequentialOrder: 1 },
  { id: 4, name: 'INFORMACAO', sequentialOrder: 4 },
  { id: 2, name: 'INFLUENCIAS', sequentialOrder: 2 },
]

export function makeQuestion(id: number, type: QuestionDTO['questionType'], optionIds: number[], trailId = 1): QuestionDTO {
  return {
    id,
    content: `Pergunta ${id}?`,
    questionType: type,
    trailId,
    options: optionIds.map((optionId, i) => ({ id: optionId, optionText: `Opção ${i + 1}` })),
  }
}

export function makeLikert(id: number, firstOptionId: number, withNeutral = true): QuestionDTO {
  const texts = withNeutral
    ? ['Discordo totalmente', 'Discordo', 'Neutro', 'Concordo', 'Concordo totalmente']
    : ['Discordo totalmente', 'Discordo', 'Concordo', 'Concordo totalmente']
  return {
    id,
    content: `Afirmação ${id}`,
    questionType: 'LIKERT',
    trailId: 1,
    options: texts.map((optionText, i) => ({ id: firstOptionId + i, optionText })),
  }
}

export function answerFor(optionId: number, id = optionId * 10): AnswerDTO {
  return { id, content: null, questionOptionDTO: { id: optionId, optionText: '' } }
}

export function makeSynthesis(trail: TrailDTO, overrides: Partial<SynthesisDTO> = {}): SynthesisDTO {
  return {
    id: trail.id * 100,
    content: `Minha síntese do pilar ${trail.sequentialOrder}`,
    trailId: trail.id,
    trailName: trail.name,
    trailSequentialOrder: trail.sequentialOrder,
    journeySynthesis: trail.name === 'INFORMACAO',
    createdAt: '2026-10-14T13:00:00Z',
    ...overrides,
  }
}

export function makeAppointment(overrides: Partial<AppointmentDTO> = {}): AppointmentDTO {
  return {
    id: 1,
    title: 'Conversa sobre influências',
    description: 'Discussão do Pilar 02',
    dateTime: '2026-10-30T14:30:00',
    durationMinutes: 45,
    scheduleType: 'INDIVIDUAL',
    scheduleStatus: 'AGENDADA',
    psychologist: { id: 3, name: 'Dra. Camila Ramos', email: 'camila@escola.com' },
    students: [{ id: 7, name: 'Ana Clara Souza', email: 'ana@escola.com' }],
    meetLink: 'https://meet.google.com/abc-defg-hij',
    calendarLink: 'https://calendar.google.com/event?eid=1',
    cancelReason: null,
    ...overrides,
  }
}

export function makeFeedback(overrides: Partial<FeedbackDTO> = {}): FeedbackDTO {
  return {
    id: 1,
    type: 'JORNADA',
    content: 'Parabéns pela conclusão dos 4 pilares!',
    studentId: 7,
    studentName: 'Ana Clara Souza',
    psychologistId: 3,
    psychologistName: 'Dra. Camila Ramos',
    journeyNumber: 1,
    appointmentId: null,
    appointmentTitle: null,
    appointmentDateTime: null,
    createdAt: '2026-10-24T13:15:00Z',
    readAt: null,
    read: false,
    ...overrides,
  }
}

export function makeResult(overrides: Partial<JourneyResultDTO> = {}): JourneyResultDTO {
  return {
    journeyId: 11,
    journeyNumber: 1,
    concludedAt: '2026-10-22T15:00:00Z',
    scores: [
      { area: 'HUMANAS', areaName: 'Humanas', score: 78, maxScore: 100, percentage: 78, highlighted: false },
      { area: 'EXATAS', areaName: 'Exatas', score: 92, maxScore: 100, percentage: 92, highlighted: true },
      { area: 'ARTES', areaName: 'Artes', score: 65, maxScore: 100, percentage: 65, highlighted: false },
      { area: 'BIOLOGICAS', areaName: 'Biológicas', score: 42, maxScore: 100, percentage: 42, highlighted: false },
    ],
    highlightedAreas: ['EXATAS'],
    suggestions: [
      { id: 1, area: 'EXATAS', name: 'Desenvolvimento de Software', description: 'Sistemas e IA.', careers: ['Engenharia de Software', 'Ciência de Dados'] },
    ],
    disclaimer: 'O resultado é um ponto de partida para o diálogo com a psicologia escolar.',
    ...overrides,
  }
}

/** Erro no formato que o axios rejeita, com CustomError do backend. */
export function httpError(status: number, error = 'Erro', extra: Record<string, unknown> = {}) {
  return Object.assign(new Error(error), {
    isAxiosError: true,
    response: { status, data: { status, error, ...extra } },
  })
}

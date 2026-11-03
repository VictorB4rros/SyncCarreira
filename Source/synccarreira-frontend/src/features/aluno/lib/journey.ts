/**
 * @file journey.ts
 * @description Regras puras da jornada do aluno (sem chamadas HTTP), espelhando o backend:
 *
 *  - TrailService.canAccess: a 1ª trilha exige o perfil preenchido; as demais exigem a anterior concluída.
 *  - Trilha concluída = todas as perguntas respondidas + síntese enviada.
 *  - MULTIPLA_ESCOLHA aceita várias opções (POST marca, DELETE desmarca).
 *    CHECKBOX, LIKERT e os demais tipos têm uma resposta por pergunta (POST substitui).
 */
import type {
  AnswerDTO,
  AppointmentDTO,
  QuestionDTO,
  QuestionOptionDTO,
  SynthesisDTO,
  TrailDTO,
} from '../types'
import { clampPercent, isUpcoming } from './format'

export type TrailStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'CONCLUDED'

export interface TrailProgressInfo {
  trail: TrailDTO
  status: TrailStatus
  accessible: boolean
  totalQuestions: number
  answeredQuestions: number
  percentage: number
  synthesis: SynthesisDTO | null
  /** Primeira pergunta ainda sem resposta (para "Próxima pergunta: ..."). */
  nextQuestion: QuestionDTO | null
}

export interface JourneySummary {
  totalTrails: number
  concludedTrails: number
  percentage: number
  /** Trilha em que o aluno está (primeira não concluída e liberada). */
  current: TrailProgressInfo | null
  allConcluded: boolean
}

/** Ordena trilhas pela ordem sequencial (as sem ordem vão para o fim). */
export function sortTrails(trails: TrailDTO[]): TrailDTO[] {
  return [...trails].sort(
    (a, b) => (a.sequentialOrder ?? Number.MAX_SAFE_INTEGER) - (b.sequentialOrder ?? Number.MAX_SAFE_INTEGER),
  )
}

export function isMultipleChoice(question: Pick<QuestionDTO, 'questionType'>): boolean {
  return question.questionType === 'MULTIPLA_ESCOLHA'
}

/** Mapa questionId → ids das opções marcadas, a partir das respostas da API. */
export function buildSelections(questions: QuestionDTO[], answers: AnswerDTO[]): Record<number, number[]> {
  const optionToQuestion = new Map<number, number>()
  questions.forEach(q => q.options.forEach(o => optionToQuestion.set(o.id, q.id)))

  const selections: Record<number, number[]> = {}
  questions.forEach(q => {
    selections[q.id] = []
  })

  answers.forEach(answer => {
    const optionId = answer.questionOptionDTO?.id
    if (optionId === undefined || optionId === null) return
    const questionId = optionToQuestion.get(optionId)
    if (questionId === undefined) return
    if (!selections[questionId].includes(optionId)) selections[questionId].push(optionId)
  })

  // Tipos de resposta única: se o banco tiver sobras, vale só a última
  questions.forEach(q => {
    if (!isMultipleChoice(q) && selections[q.id].length > 1) {
      selections[q.id] = selections[q.id].slice(-1)
    }
  })
  return selections
}

export function countAnswered(questions: QuestionDTO[], selections: Record<number, number[]>): number {
  return questions.filter(q => (selections[q.id]?.length ?? 0) > 0).length
}

export function deriveTrailProgress(
  trail: TrailDTO,
  input: {
    accessible: boolean
    questions?: QuestionDTO[]
    answers?: AnswerDTO[]
    synthesis?: SynthesisDTO | null
  },
): TrailProgressInfo {
  const questions = input.questions ?? []
  const synthesis = input.synthesis ?? null
  const selections = buildSelections(questions, input.answers ?? [])
  const answeredQuestions = countAnswered(questions, selections)
  const totalQuestions = questions.length
  const allAnswered = answeredQuestions === totalQuestions

  let status: TrailStatus
  if (!input.accessible) status = 'LOCKED'
  else if (allAnswered && synthesis) status = 'CONCLUDED'
  else if (answeredQuestions > 0) status = 'IN_PROGRESS'
  else status = 'AVAILABLE'

  const percentage =
    status === 'CONCLUDED'
      ? 100
      : totalQuestions > 0
        ? clampPercent((answeredQuestions / totalQuestions) * 100)
        : 0

  return {
    trail,
    status,
    accessible: input.accessible,
    totalQuestions,
    answeredQuestions,
    percentage,
    synthesis,
    nextQuestion: questions.find(q => (selections[q.id]?.length ?? 0) === 0) ?? null,
  }
}

export function summarizeJourney(progress: TrailProgressInfo[]): JourneySummary {
  const totalTrails = progress.length
  const concludedTrails = progress.filter(p => p.status === 'CONCLUDED').length
  const current = progress.find(p => p.status !== 'CONCLUDED' && p.accessible) ?? null
  return {
    totalTrails,
    concludedTrails,
    percentage: totalTrails > 0 ? clampPercent((concludedTrails / totalTrails) * 100) : 0,
    current,
    allConcluded: totalTrails > 0 && concludedTrails === totalTrails,
  }
}

/**
 * Opções exibidas na escala Likert: quatro posições, sem a alternativa neutra
 * (mesma regra do TrailPage.jsx, pois o banco ainda tem cinco opções em algumas perguntas).
 */
export function likertOptions(options: QuestionOptionDTO[]): QuestionOptionDTO[] {
  const neutralIndex = options.findIndex(o => /^neutr[oa]\.?$/i.test((o.optionText ?? '').trim()))
  if (neutralIndex >= 0) return options.filter((_, i) => i !== neutralIndex).slice(0, 4)
  if (options.length === 5) return options.filter((_, i) => i !== 2)
  return options.slice(0, 4)
}

/** Próxima sessão agendada que ainda não terminou. */
export function nextAppointment(appointments: AppointmentDTO[], now: Date = new Date()): AppointmentDTO | null {
  return (
    [...appointments]
      .filter(a => a.scheduleStatus === 'AGENDADA' && isUpcoming(a.dateTime, a.durationMinutes, now))
      .sort((a, b) => a.dateTime.localeCompare(b.dateTime))[0] ?? null
  )
}

/** Agrupa sessões nas abas da tela "Minhas Sessões". */
export function groupAppointments(appointments: AppointmentDTO[], now: Date = new Date()) {
  const upcoming: AppointmentDTO[] = []
  const past: AppointmentDTO[] = []
  const canceled: AppointmentDTO[] = []
  appointments.forEach(a => {
    if (a.scheduleStatus === 'CANCELADA') canceled.push(a)
    else if (a.scheduleStatus === 'AGENDADA' && isUpcoming(a.dateTime, a.durationMinutes, now)) upcoming.push(a)
    else past.push(a)
  })
  upcoming.sort((a, b) => a.dateTime.localeCompare(b.dateTime))
  past.sort((a, b) => b.dateTime.localeCompare(a.dateTime))
  canceled.sort((a, b) => b.dateTime.localeCompare(a.dateTime))
  return { upcoming, past, canceled }
}

/** Nível textual de afinidade a partir do percentual da área. */
export function affinityLevel(percentage: number, highlighted: boolean): string {
  if (highlighted) return 'Maior afinidade'
  if (percentage >= 70) return 'Alta afinidade'
  if (percentage >= 40) return 'Afinidade moderada'
  return 'Baixa afinidade'
}

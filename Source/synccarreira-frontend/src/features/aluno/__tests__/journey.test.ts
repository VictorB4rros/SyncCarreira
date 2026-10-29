import { describe, expect, it } from 'vitest'
import {
  affinityLevel,
  buildSelections,
  deriveTrailProgress,
  groupAppointments,
  likertOptions,
  nextAppointment,
  sortTrails,
  summarizeJourney,
} from '../lib/journey'
import { answerFor, makeAppointment, makeLikert, makeQuestion, makeSynthesis, trails } from '../test/fixtures'

const [plano, auto, info, influencias] = trails

describe('sortTrails', () => {
  it('ordena pela ordem sequencial do backend (Plano de Futuro = 3, Informação = 4)', () => {
    expect(sortTrails(trails).map(t => t.name)).toEqual(['AUTOCONHECIMENTO', 'INFLUENCIAS', 'PLANO_DE_FUTURO', 'INFORMACAO'])
  })
})

describe('buildSelections', () => {
  const single = makeQuestion(1, 'CHECKBOX', [11, 12])
  const multiple = makeQuestion(2, 'MULTIPLA_ESCOLHA', [21, 22, 23])

  it('mapeia cada resposta para a pergunta dona da opção', () => {
    const selections = buildSelections([single, multiple], [answerFor(12), answerFor(21), answerFor(23)])
    expect(selections).toEqual({ 1: [12], 2: [21, 23] })
  })

  it('em perguntas de resposta única mantém só a última opção', () => {
    expect(buildSelections([single], [answerFor(11), answerFor(12)])[1]).toEqual([12])
  })

  it('ignora respostas de opções desconhecidas ou sem opção', () => {
    const selections = buildSelections([single], [answerFor(999), { id: 1, questionOptionDTO: null }])
    expect(selections[1]).toEqual([])
  })
})

describe('deriveTrailProgress', () => {
  const questions = [makeQuestion(1, 'CHECKBOX', [11, 12]), makeQuestion(2, 'LIKERT', [21, 22])]

  it('trilha sem acesso fica bloqueada', () => {
    expect(deriveTrailProgress(influencias, { accessible: false }).status).toBe('LOCKED')
  })

  it('liberada e sem respostas fica disponível', () => {
    const info1 = deriveTrailProgress(auto, { accessible: true, questions, answers: [] })
    expect(info1.status).toBe('AVAILABLE')
    expect(info1.nextQuestion?.id).toBe(1)
  })

  it('calcula o percentual de perguntas respondidas', () => {
    const p = deriveTrailProgress(auto, { accessible: true, questions, answers: [answerFor(11)] })
    expect(p).toMatchObject({ status: 'IN_PROGRESS', answeredQuestions: 1, totalQuestions: 2, percentage: 50 })
    expect(p.nextQuestion?.id).toBe(2)
  })

  it('só conclui com todas respondidas E síntese enviada', () => {
    const answers = [answerFor(11), answerFor(21)]
    expect(deriveTrailProgress(auto, { accessible: true, questions, answers }).status).toBe('IN_PROGRESS')
    const done = deriveTrailProgress(auto, { accessible: true, questions, answers, synthesis: makeSynthesis(auto) })
    expect(done).toMatchObject({ status: 'CONCLUDED', percentage: 100 })
  })

  it('trilha de Informação (sem perguntas) conclui só com a síntese final', () => {
    expect(deriveTrailProgress(info, { accessible: true, questions: [] }).status).toBe('AVAILABLE')
    expect(deriveTrailProgress(info, { accessible: true, questions: [], synthesis: makeSynthesis(info) }).status).toBe('CONCLUDED')
  })
})

describe('summarizeJourney', () => {
  it('aponta a primeira trilha liberada e não concluída como atual', () => {
    const progress = [
      deriveTrailProgress(auto, { accessible: true, synthesis: makeSynthesis(auto) }),
      deriveTrailProgress(influencias, { accessible: true }),
      deriveTrailProgress(plano, { accessible: false }),
      deriveTrailProgress(info, { accessible: false }),
    ]
    const summary = summarizeJourney(progress)
    expect(summary).toMatchObject({ totalTrails: 4, concludedTrails: 1, percentage: 25, allConcluded: false })
    expect(summary.current?.trail.name).toBe('INFLUENCIAS')
  })

  it('lista vazia não é considerada concluída', () => {
    expect(summarizeJourney([]).allConcluded).toBe(false)
  })
})

describe('likertOptions', () => {
  it('remove a opção "Neutro" e mantém 4 posições', () => {
    const options = likertOptions(makeLikert(1, 100).options)
    expect(options.map(o => o.optionText)).toEqual(['Discordo totalmente', 'Discordo', 'Concordo', 'Concordo totalmente'])
  })

  it('com 5 opções sem rótulo neutro, remove a do meio', () => {
    const q = makeQuestion(1, 'LIKERT', [1, 2, 3, 4, 5])
    expect(likertOptions(q.options).map(o => o.id)).toEqual([1, 2, 4, 5])
  })

  it('escala já com 4 opções fica igual', () => {
    expect(likertOptions(makeLikert(1, 200, false).options)).toHaveLength(4)
  })
})

describe('sessões', () => {
  // 29/10/2026 12:00 em São Paulo (UTC-3)
  const now = new Date('2026-10-29T15:00:00Z')
  const upcoming = makeAppointment({ id: 1, dateTime: '2026-10-30T14:30:00' })
  const later = makeAppointment({ id: 2, dateTime: '2026-11-05T09:00:00' })
  const past = makeAppointment({ id: 3, dateTime: '2026-10-20T10:00:00', scheduleStatus: 'REALIZADA' })
  const pastNotRegistered = makeAppointment({ id: 4, dateTime: '2026-10-28T10:00:00' })
  const canceled = makeAppointment({ id: 5, scheduleStatus: 'CANCELADA', cancelReason: 'Feriado' })

  it('nextAppointment devolve a sessão agendada futura mais próxima', () => {
    expect(nextAppointment([later, past, upcoming, canceled], now)?.id).toBe(1)
  })

  it('sessão em andamento (dentro da duração) ainda conta como próxima', () => {
    const ongoing = makeAppointment({ id: 9, dateTime: '2026-10-29T11:40:00', durationMinutes: 45 })
    expect(nextAppointment([ongoing], now)?.id).toBe(9)
  })

  it('groupAppointments separa próximas, anteriores e canceladas', () => {
    const groups = groupAppointments([later, past, upcoming, canceled, pastNotRegistered], now)
    expect(groups.upcoming.map(a => a.id)).toEqual([1, 2])
    expect(groups.past.map(a => a.id)).toEqual([4, 3])
    expect(groups.canceled.map(a => a.id)).toEqual([5])
  })
})

describe('affinityLevel', () => {
  it.each([
    [92, true, 'Maior afinidade'],
    [78, false, 'Alta afinidade'],
    [65, false, 'Afinidade moderada'],
    [20, false, 'Baixa afinidade'],
  ])('%i%% (destaque=%s) → %s', (pct, highlighted, label) => {
    expect(affinityLevel(pct, highlighted)).toBe(label)
  })
})

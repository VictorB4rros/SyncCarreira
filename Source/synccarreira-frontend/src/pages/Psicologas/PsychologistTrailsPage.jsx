/**
 * @file PsychologistTrailsPage.jsx
 * @description — psico consulta o banco de questões das trilhas (somente leitura).
 */

import { useEffect, useMemo, useState } from 'react'
import { getQuestionBank } from '../../services/questionBankService.js'
import './PsychologistTrailsPage.css'

const TRAIL_LABELS = {
  AUTOCONHECIMENTO: 'Autoconhecimento',
  INFLUENCIAS: 'Influências',
  PLANO_DE_FUTURO: 'Projeto de futuro',
  INFORMACAO: 'Informação',
}

const TRAIL_DESCRIPTIONS = {
  AUTOCONHECIMENTO: 'Interesses, habilidades e valores do aluno.',
  INFLUENCIAS: 'Família, escola, amigos e referências que pesam na escolha.',
  PLANO_DE_FUTURO: 'Expectativas, rotina desejada e próximos passos.',
  INFORMACAO: 'Etapa final: o aluno recebe links curados e escreve a síntese da jornada.',
}

const TYPE_LABELS = {
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  CHECKBOX: 'Várias opções',
  LIKERT: 'Escala Likert',
  ABERTA: 'Resposta aberta',
}

const TYPE_HINTS = {
  MULTIPLA_ESCOLHA: 'O aluno marca uma opção.',
  CHECKBOX: 'O aluno pode marcar mais de uma opção.',
  LIKERT: 'O aluno marca um ponto da escala.',
  ABERTA: 'O aluno responde com texto livre.',
}

/** Ordem igual à do resultado do aluno; field = nome do peso no QuestionOptionDTO. */
const AREAS = [
  { key: 'HUMANAS', label: 'Humanas', field: 'humanitiesWeight' },
  { key: 'EXATAS', label: 'Exatas', field: 'exactSciencesWeight' },
  { key: 'BIOLOGICAS', label: 'Biológicas', field: 'biologicalSciencesWeight' },
  { key: 'ARTES', label: 'Artes', field: 'artsWeight' },
]

const ALL = 'ALL'
const NO_TRAIL = 'NO_TRAIL'

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

function trailLabel(trail) {
  return TRAIL_LABELS[trail?.name] ?? trail?.name ?? 'Sem trilha'
}

function normalize(text) {
  return String(text ?? '')
    .normalize('NFD').replaceAll(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt-BR')
}

/** Mesmo critério usado na tela do aluno (features/aluno/lib/journey.ts → maxSelections). */
function selectionLimit(question) {
  if (question.questionType !== 'CHECKBOX') return null
  const match = /(?:no\s+m[aá]ximo|at[eé])\s+(\d+)/i.exec(question.content ?? '')
  return match ? Number(match[1]) : null
}

function matchesQuery(question, query) {
  if (!query) return true
  if (normalize(question.content).includes(query)) return true
  return (question.options ?? []).some(option => normalize(option.optionText).includes(query))
}

/** Agrupa as perguntas por trilha, na ordem sequencial; perguntas sem trilha vão para o fim. */
function groupByTrail(trails, questions) {
  const ordered = [...trails].sort(
    (first, second) => (first.sequentialOrder ?? Number.MAX_SAFE_INTEGER) - (second.sequentialOrder ?? Number.MAX_SAFE_INTEGER),
  )
  const byTrail = new Map(ordered.map(trail => [trail.id, []]))
  const orphans = []

  ;[...questions]
    .sort((first, second) => (first.id ?? 0) - (second.id ?? 0))
    .forEach(question => {
      const list = byTrail.get(question.trailId)
      if (list) list.push(question)
      else orphans.push(question)
    })

  const groups = ordered.map((trail, index) => ({
    key: String(trail.id),
    trail,
    step: index + 1,
    questions: byTrail.get(trail.id) ?? [],
  }))
  if (orphans.length) groups.push({ key: NO_TRAIL, trail: null, step: null, questions: orphans })
  return groups
}

function OptionWeights({ option }) {
  const weights = AREAS
    .map(area => ({ ...area, value: Number(option[area.field] ?? 0) }))
    .filter(area => area.value !== 0)

  const chips = weights.length
    ? weights.map(area => (
      <span key={area.key} className={`psy-qb-weight psy-qb-weight--${area.key.toLowerCase()}`}>
        {area.label} {numberFormat.format(area.value)}
      </span>
    ))
    : [<span key="none" className="psy-qb-weight psy-qb-weight--none">Sem peso</span>]

  return <>{chips}</>
}

function QuestionCard({ question, number }) {
  const options = question.options ?? []
  const limit = selectionLimit(question)
  const limitUnit = limit === 1 ? 'opção' : 'opções'
  const limitText = limit ? ` Limite: ${limit} ${limitUnit}.` : ''
  const emptyText = question.questionType === 'ABERTA'
    ? 'Pergunta aberta: não tem opções nem peso por área.'
    : 'Nenhuma opção cadastrada.'

  return (
    <article className="psy-qb-question">
      <header className="psy-qb-question__head">
        <span className="psy-qb-question__number" aria-hidden="true">P{number}</span>
        <div className="psy-qb-question__meta">
          <span className="psy-qb-type">{TYPE_LABELS[question.questionType] ?? question.questionType}</span>
          <span className="psy-qb-question__hint">
            {TYPE_HINTS[question.questionType] ?? ''}
            {limitText}
          </span>
        </div>
      </header>
      <h3 className="psy-qb-question__content">
        <span className="psy-sr-only">Pergunta {number}: </span>{question.content}
      </h3>

      {options.length > 0 ? (
        <ol className="psy-qb-options" aria-label={`Opções da pergunta ${number}`}>
          {options.map(option => (
            <li key={option.id} className="psy-qb-option">
              <span className="psy-qb-option__text">{option.optionText}</span>
              <span className="psy-qb-option__weights" aria-label="Pesos por área">
                <OptionWeights option={option} />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="psy-qb-question__empty">
          {emptyText}
        </p>
      )}
    </article>
  )
}

function TrailSection({ group }) {
  const { trail, step, questions } = group
  const title = trail ? trailLabel(trail) : 'Perguntas sem trilha'
  const headingId = `psy-qb-trail-${group.key}`

  return (
    <section className="psy-qb-trail" aria-labelledby={headingId}>
      <header className="psy-qb-trail__head">
        {step && <span className="psy-qb-trail__step">ETAPA {String(step).padStart(2, '0')}</span>}
        <div className="psy-qb-trail__title">
          <h2 id={headingId}>{title}</h2>
          {trail && TRAIL_DESCRIPTIONS[trail.name] && <p>{TRAIL_DESCRIPTIONS[trail.name]}</p>}
        </div>
        <span className="psy-qb-trail__count">{questions.length} {questions.length === 1 ? 'pergunta' : 'perguntas'}</span>
      </header>

      {questions.length > 0 ? (
        <div className="psy-qb-questions">
          {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} number={question.displayNumber ?? index + 1} />
          ))}
        </div>
      ) : (
        <p className="psy-qb-trail__empty">
          {trail?.name === 'INFORMACAO'
            ? 'Esta etapa não tem perguntas: o aluno consulta os conteúdos indicados e escreve a síntese final da jornada.'
            : 'Nenhuma pergunta cadastrada nesta trilha.'}
        </p>
      )}
    </section>
  )
}

export default function PsychologistTrailsPage() {
  const [bank, setBank] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState(ALL)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getQuestionBank()
      .then(data => { if (active) setBank(data) })
      .catch(loadError => { if (active) setError(loadError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attempt])

  const groups = useMemo(() => groupByTrail(bank?.trails ?? [], bank?.questions ?? []), [bank])
  const normalizedQuery = normalize(query.trim())

  // Filtra pela trilha escolhida e pela busca, mantendo a numeração original (P1, P2…) de cada pergunta
  const visibleGroups = useMemo(() => groups
    .filter(group => selected === ALL || group.key === selected)
    .map(group => ({
      ...group,
      questions: group.questions
        .map((question, index) => ({ ...question, displayNumber: index + 1 }))
        .filter(question => matchesQuery(question, normalizedQuery)),
    }))
    .filter(group => !normalizedQuery || group.questions.length > 0), [groups, selected, normalizedQuery])

  const totalQuestions = bank?.questions.length ?? 0
  const totalOptions = (bank?.questions ?? []).reduce((total, question) => total + (question.options?.length ?? 0), 0)
  const visibleCount = visibleGroups.reduce((total, group) => total + group.questions.length, 0)

  return (
    <div className="psy-qb-page">
      <header className="psy-qb-hero">
        <div>
          <span className="psy-qb-eyebrow">BANCO DE QUESTÕES · SOMENTE LEITURA</span>
          <h1>Questões das trilhas</h1>
          <p>
            Consulte os enunciados, os tipos de resposta e o peso que cada opção soma para cada área do conhecimento.
            É a base para validar as questões aplicadas aos alunos (RN-06 e RN-09).
          </p>
        </div>
        <dl className="psy-qb-total">
          <div><dt>Perguntas</dt><dd>{loading ? '—' : totalQuestions}</dd></div>
          <div><dt>Opções</dt><dd>{loading ? '—' : totalOptions}</dd></div>
          <div><dt>Trilhas</dt><dd>{loading ? '—' : (bank?.trails.length ?? 0)}</dd></div>
        </dl>
      </header>

      <p className="psy-qb-readonly" role="note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        <span>
          <strong>Visualização somente leitura.</strong> Se alguma questão ou peso precisar de ajuste,
          registre a validação e encaminhe à administração do sistema, responsável pelo cadastro.
        </span>
      </p>

      {loading && <output className="psy-qb-state">Carregando o banco de questões…</output>}
      {!loading && error && (
        <div className="psy-qb-state psy-qb-state--error" role="alert">
          <strong>Não foi possível carregar as questões</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>
        </div>
      )}

      {!loading && !error && bank && (
        <>
          <section className="psy-qb-toolbar" aria-label="Filtros do banco de questões">
            <fieldset className="psy-qb-tabs">
              <legend className="psy-sr-only">Filtrar por trilha</legend>
              <button type="button" aria-pressed={selected === ALL} onClick={() => setSelected(ALL)}>
                Todas <span>{totalQuestions}</span>
              </button>
              {groups.map(group => (
                <button key={group.key} type="button" aria-pressed={selected === group.key} onClick={() => setSelected(group.key)}>
                  {group.trail ? trailLabel(group.trail) : 'Sem trilha'} <span>{group.questions.length}</span>
                </button>
              ))}
            </fieldset>
            <label className="psy-qb-search">
              <span className="psy-sr-only">Buscar no enunciado ou nas opções</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Buscar no enunciado ou nas opções..."
              />
            </label>
          </section>

          <div className="psy-qb-legend" aria-label="Legenda dos pesos">
            <span>Peso por área:</span>
            {AREAS.map(area => (
              <span key={area.key} className={`psy-qb-weight psy-qb-weight--${area.key.toLowerCase()}`}>{area.label}</span>
            ))}
            <small>Somente pesos diferentes de zero são exibidos.</small>
          </div>

          {normalizedQuery && (
            <output className="psy-qb-results">
              {visibleCount} {visibleCount === 1 ? 'pergunta encontrada' : 'perguntas encontradas'} para “{query.trim()}”.
            </output>
          )}

          {visibleGroups.length > 0
            ? visibleGroups.map(group => <TrailSection key={group.key} group={group} />)
            : <div className="psy-qb-state">Nenhuma pergunta corresponde à busca.</div>}
        </>
      )}
    </div>
  )
}
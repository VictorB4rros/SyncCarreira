/**
 * @file TrailPage.jsx
 * @description Tela de uma trilha — exibe perguntas, permite responder e editar.
 *
 * Fluxo:
 *  1. Lê trailId da URL (/trail/:trailId)
 *  2. Busca dados da trilha, perguntas e respostas já salvas em paralelo
 *  3. Mapeia respostas existentes por questionOptionId para pré-selecionar
 *  4. Ao selecionar uma opção, faz POST /answers (backend substitui a anterior)
 *  5. Calcula progresso em tempo real (respostas únicas por questão)
 *
 * Tipos de pergunta suportados:
 *  - CHECKBOX  → opções clicáveis (radio visual — 1 seleção por vez)
 *  - LIKERT    → escala 1-5 com labels Discordo / Concordo
 *
 * @requires trailService, AuthContext, React Router
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  getTrailById,
  getQuestionsByTrail,
  getAnswers,
  postAnswer,
} from '../../services/trailService'
import './TrailPage.css'

// ─── Constantes ───────────────────────────────────────────────

/** Delay em ms para debounce do salvamento (evita múltiplas chamadas rápidas) */
const SAVE_DEBOUNCE = 300

/** Labels da escala Likert */
const LIKERT_LABELS = ['Discordo totalmente', 'Concordo totalmente']
const LIKERT_VALUES = [1, 2, 3, 4, 5]

// ─── Sub-componentes ──────────────────────────────────────────

/**
 * Feedback de salvamento exibido abaixo de cada pergunta.
 */
function SaveFeedback({ status }) {
  if (!status) return <div className="tp-question__save-feedback" />

  if (status === 'saving')
    return (
      <div className="tp-question__save-feedback tp-question__save-feedback--saving">
        <span className="tp-save-spinner" />
        Salvando…
      </div>
    )

  if (status === 'saved')
    return (
      <div className="tp-question__save-feedback tp-question__save-feedback--saved">
        <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
        </svg>
        Resposta salva
      </div>
    )

  return (
    <div className="tp-question__save-feedback tp-question__save-feedback--error">
      Erro ao salvar. Tente novamente.
    </div>
  )
}

/**
 * Pergunta do tipo CHECKBOX — opções como botões radio visuais.
 */
function CheckboxQuestion({ question, selectedOptionId, onSelect, saveStatus }) {
  return (
    <div className={`tp-question${selectedOptionId ? ' tp-question--answered' : ''}`}>
      <div className="tp-question__meta">
        <span className="tp-question__num">Pergunta {question.index}</span>
        <span className={`tp-question__badge${selectedOptionId ? ' tp-question__badge--done' : ''}`}>
          {selectedOptionId ? '✓ Respondida' : 'Múltipla escolha'}
        </span>
      </div>

      <p className="tp-question__content">{question.content}</p>

      <div className="tp-options">
        {question.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`tp-option${selectedOptionId === opt.id ? ' tp-option--selected' : ''}`}
            onClick={() => onSelect(question.id, opt.id, opt.optionText)}
            aria-pressed={selectedOptionId === opt.id}
          >
            <span className="tp-option__dot">
              <span className="tp-option__dot-inner" />
            </span>
            <span className="tp-option__text">{opt.optionText}</span>
          </button>
        ))}
      </div>

      <SaveFeedback status={saveStatus} />
    </div>
  )
}

/**
 * Pergunta do tipo LIKERT — escala 1 a 5.
 * Usa a primeira opção do array como referência para o questionOptionId
 * (LIKERT normalmente tem uma opção por valor numérico ou usa o valor direto).
 *
 * Estratégia adotada: opções do array são mapeadas 1-1 com os botões 1-5.
 * Se o backend enviar exatamente 5 opções, cada botão corresponde a options[valor-1].
 * Se não tiver opções, usa o índice como fallback.
 */
function LikertQuestion({ question, selectedOptionId, onSelect, saveStatus }) {
  // Determina qual valor (1-5) está selecionado baseando-se no optionId
  const selectedValue = question.options.findIndex(o => o.id === selectedOptionId) + 1 || null

  function handleClick(value) {
    const opt = question.options[value - 1]
    if (opt) {
      onSelect(question.id, opt.id, opt.optionText || String(value))
    } else {
      onSelect(question.id, null, String(value))
    }
  }

  return (
    <div className={`tp-question${selectedOptionId ? ' tp-question--answered' : ''}`}>
      <div className="tp-question__meta">
        <span className="tp-question__num">Pergunta {question.index}</span>
        <span className={`tp-question__badge${selectedOptionId ? ' tp-question__badge--done' : ''}`}>
          {selectedOptionId ? '✓ Respondida' : 'Escala Likert'}
        </span>
      </div>

      <p className="tp-question__content">{question.content}</p>

      <div className="tp-likert">
        <div className="tp-likert__labels">
          {LIKERT_LABELS.map((label, i) => (
            <span key={i} className="tp-likert__label">{label}</span>
          ))}
        </div>
        <div className="tp-likert__scale">
          {LIKERT_VALUES.map((val) => (
            <button
              key={val}
              type="button"
              className={`tp-likert__btn${selectedValue === val ? ' tp-likert__btn--selected' : ''}`}
              onClick={() => handleClick(val)}
              aria-label={`${val} — ${val === 1 ? LIKERT_LABELS[0] : val === 5 ? LIKERT_LABELS[1] : ''}`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <SaveFeedback status={saveStatus} />
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────

export default function TrailPage() {
  const { trailId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Estados de dados ───────────────────────────────────────
  const [trail, setTrail]         = useState(null)
  const [questions, setQuestions] = useState([])   // array com index injetado
  const [answers, setAnswers]     = useState({})   // { questionId: optionId }

  // ── Estados de UI ──────────────────────────────────────────
  const [loadingPage, setLoadingPage] = useState(true)
  const [pageError, setPageError]     = useState('')
  const [saveStatus, setSaveStatus]   = useState({}) // { questionId: 'saving'|'saved'|'error' }

  // ── Carregamento inicial ───────────────────────────────────
  useEffect(() => {
    // trailId vem da URL como string — converte para número
    const numericTrailId = Number(trailId)

    if (!numericTrailId || !user?.id) {
      console.warn('[TrailPage] trailId ou user.id inválido:', { trailId, userId: user?.id })
      return
    }

    async function load() {
      setLoadingPage(true)
      setPageError('')

      try {
        console.log('[TrailPage] Carregando trilha', numericTrailId, 'para usuário', user.id)

        // Carrega trilha e perguntas em paralelo — obrigatórios
        const [trailData, questionsData] = await Promise.all([
          getTrailById(numericTrailId),
          getQuestionsByTrail(numericTrailId),
        ])

        console.log('[TrailPage] Trilha:', trailData)
        console.log('[TrailPage] Perguntas:', questionsData?.length)

        setTrail(trailData)

        // Injeta índice visual em cada pergunta (1-based)
        const numbered = (questionsData ?? []).map((q, i) => ({ ...q, index: i + 1 }))
        setQuestions(numbered)

        // Respostas são opcionais — não quebra se falhar (aluno pode não ter respondido nada)
        let answersData = []
        try {
          answersData = await getAnswers(user.id, numericTrailId)
          console.log('[TrailPage] Respostas carregadas:', answersData?.length)
        } catch (answersErr) {
          console.warn('[TrailPage] Não foi possível carregar respostas (pode ser normal):', answersErr?.response?.status)
          // Continua sem respostas — o aluno começa do zero
        }

        // Monta mapa de respostas: { [questionId]: optionId }
        const answerMap = {}
        for (const ans of answersData) {
          const optId = ans.questionOptionDTO?.id
          if (!optId) continue

          const matchingQuestion = questionsData.find(q =>
            q.options?.some(o => o.id === optId)
          )
          if (matchingQuestion) {
            answerMap[matchingQuestion.id] = optId
          }
        }

        setAnswers(answerMap)

      } catch (err) {
        console.error('[TrailPage] Erro ao carregar trilha/perguntas:', err)
        setPageError('Não foi possível carregar a trilha. Verifique sua conexão.')
      } finally {
        setLoadingPage(false)
      }
    }

    load()
  }, [trailId, user?.id])

  // ── Seleção de resposta ────────────────────────────────────

  /**
   * Chamado quando o aluno clica em uma opção.
   * Atualiza o estado local imediatamente (otimista) e salva no backend.
   *
   * @param {number} questionId     - id da pergunta
   * @param {number|null} optionId  - id da opção escolhida (null = sem opção mapeada)
   * @param {string} [content='']  - conteúdo textual (fallback LIKERT sem options)
   */
  const handleSelect = useCallback(async (questionId, optionId, content = '') => {
    // Atualização otimista
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
    setSaveStatus(prev => ({ ...prev, [questionId]: 'saving' }))

    try {
      await postAnswer({
        content,
        studentId: user.id,
        questionOptionId: optionId,
      })
      setSaveStatus(prev => ({ ...prev, [questionId]: 'saved' }))

      // Limpa o feedback após 2.5s
      setTimeout(() => {
        setSaveStatus(prev => {
          const next = { ...prev }
          delete next[questionId]
          return next
        })
      }, 2500)

    } catch (err) {
      console.error('[TrailPage] Erro ao salvar resposta:', err)
      setSaveStatus(prev => ({ ...prev, [questionId]: 'error' }))
    }
  }, [user?.id])

  // ── Cálculo de progresso ───────────────────────────────────
  const totalQuestions   = questions.length
  const answeredCount    = Object.keys(answers).filter(qId =>
    answers[qId] !== null && answers[qId] !== undefined
  ).length
  const progressPct      = totalQuestions > 0
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0
  const isComplete       = answeredCount === totalQuestions && totalQuestions > 0

  // ── Renderização ──────────────────────────────────────────

  if (loadingPage) {
    return (
      <div className="tp-root">
        <PageHeader trail={null} progressPct={0} onBack={() => navigate('/home')} />
        <div className="tp-loading">
          <div className="tp-loading__spinner" />
          Carregando trilha…
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="tp-root">
        <PageHeader trail={null} progressPct={0} onBack={() => navigate('/home')} />
        <div className="tp-error-state">
          <p>{pageError}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tp-root">
      <PageHeader
        trail={trail}
        progressPct={progressPct}
        onBack={() => navigate('/home')}
      />

      <main className="tp-main">

        {/* ── Hero da trilha ── */}
        <div className="tp-hero">
          <div className="tp-hero__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="26" height="26">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" strokeLinecap="round"/>
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="tp-hero__info">
            <h1>{trail?.name ?? 'Trilha de Autoconhecimento'}</h1>
            <p>{trail?.description ?? 'Responda as perguntas para descobrir seu perfil vocacional.'}</p>
          </div>
          <div className="tp-hero__stats">
            <span className="tp-hero__stat">
              <strong>{answeredCount}</strong> / {totalQuestions} respondidas
            </span>
            <span className="tp-hero__stat">
              <strong>{progressPct}%</strong> concluído
            </span>
          </div>
        </div>

        {/* ── Barra de progresso ── */}
        <div className="tp-progress-card">
          <div className="tp-progress-card__header">
            <span className="tp-progress-card__label">Seu progresso</span>
            <span className="tp-progress-card__count">
              {answeredCount} de {totalQuestions} perguntas
            </span>
          </div>
          <div className="tp-progress-card__bar">
            <div
              className="tp-progress-card__fill"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* ── Lista de perguntas ── */}
        {questions.map((question) => {
          const type = question.questionType?.toUpperCase()
          const selectedOptionId = answers[question.id] ?? null
          const status = saveStatus[question.id] ?? null

          if (type === 'LIKERT') {
            return (
              <LikertQuestion
                key={question.id}
                question={question}
                selectedOptionId={selectedOptionId}
                onSelect={handleSelect}
                saveStatus={status}
              />
            )
          }

          // CHECKBOX e qualquer outro tipo → opções clicáveis
          return (
            <CheckboxQuestion
              key={question.id}
              question={question}
              selectedOptionId={selectedOptionId}
              onSelect={handleSelect}
              saveStatus={status}
            />
          )
        })}

        {/* ── Banner de conclusão ── */}
        {isComplete && (
          <div className="tp-done">
            <div className="tp-done__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="28" height="28">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Trilha concluída! 🎉</h2>
            <p>Você respondeu todas as perguntas. Seus dados foram salvos e seu perfil vocacional está sendo calculado.</p>
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Header reutilizável da trilha ────────────────────────────

function PageHeader({ trail, progressPct, onBack }) {
  return (
    <header className="tp-header">
      <div className="tp-header__left">
        <button className="tp-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="15 18 9 12 15 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar
        </button>
        <span className="tp-header__title">
          {trail?.name ?? 'Trilha'}
        </span>
      </div>

      <div className="tp-header__progress">
        <span className="tp-header__pct">{progressPct}%</span>
        <div className="tp-progbar">
          <div className="tp-progbar__fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </header>
  )
}

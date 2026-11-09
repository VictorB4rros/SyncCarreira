/**
 * @file DoubtSignal.jsx
 * @description RF-04 — o aluno avisa a psicóloga que concluiu as trilhas com dúvida ou indecisão.
 *
 * Só fica disponível depois que a jornada atual é concluída (regra do backend).
 * A sinalização é feita uma vez por jornada: a psicóloga recebe um e-mail e o aluno
 * passa a aparecer nos "Alertas de orientação" do painel dela.
 * 
 * O aluno pode desfazer a sinalização a qualquer momento: ele tem autonomia sobre a própria sinalização e deixa
 * de aparecer como prioritário para a psicóloga. Depois de desfazer, pode sinalizar de novo.
 */


import { useEffect, useState } from 'react'
import { getMyDoubt, flagMyDoubt, unflagMyDoubt } from '../../../services/journeyDoubtService.js'

function formatDateTime(instant) {
  return new Date(instant).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
}

/**
 * @param {Object}   props
 * @param {boolean}  props.journeyConcluded - a jornada atual foi concluída?
 * @param {Function} props.onOpenSchedule   - abre a aba de agendamentos
 */
export default function DoubtSignal({ journeyConcluded, onOpenSchedule }) {
  const [doubt, setDoubt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [confirmingUndo, setConfirmingUndo] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    getMyDoubt()
      .then(data => { if (active) setDoubt(data) })
      .catch(() => { if (active) setDoubt({ inDoubt: false }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function handleUnflag() {
    setSending(true)
    setError('')
    try {
      await unflagMyDoubt()
      setDoubt(prev => ({ ...prev, inDoubt: false, doubtFlaggedAt: null }))
      setConfirmingUndo(false)
      setNotice('Sinalização desfeita. Se precisar, você pode avisar a psicóloga novamente por aqui.')
    } catch (unflagError) {
      setError(unflagError.message)
    } finally {
      setSending(false)
    }
  }

  async function handleFlag() {
    setSending(true)
    setError('')
    setNotice('')
    try {
      setDoubt(await flagMyDoubt())
      setConfirming(false)
    } catch (flagError) {
      if (flagError.status === 409) {
        // Já estava sinalizado (por exemplo, em outra aba): mostra a situação atual
        setDoubt(await getMyDoubt().catch(() => ({ inDoubt: true })))
        setConfirming(false)
      } else {
        setError(flagError.message)
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return null

  if (doubt?.inDoubt) {
    return (
      <section className="sp-doubt sp-doubt--sent" aria-labelledby="sp-doubt-title">
        <div className="sp-doubt__icon" aria-hidden="true">✓</div>
        <div className="sp-doubt__body">
          <h2 id="sp-doubt-title">Sua orientadora já sabe que você está com dúvida</h2>
          <p>
            Você avisou{doubt.doubtFlaggedAt ? ` em ${formatDateTime(doubt.doubtFlaggedAt)}` : ''}. Ela recebeu um e-mail e
            pode marcar uma conversa com você. As sessões aparecem em “Agendamentos”.
          </p>
          {confirmingUndo && (
            <div className="sp-doubt__confirm">
              <span>
                Ao desfazer, você deixa de aparecer nos alertas de orientação da psicóloga. Você pode sinalizar
                de novo quando quiser. Desfazer a sinalização?
              </span>
              <div>
                <button type="button" className="sp-doubt__action" onClick={handleUnflag} disabled={sending}>
                  {sending ? 'Desfazendo…' : 'Sim, desfazer'}
                </button>
                <button type="button" className="sp-doubt__action sp-doubt__action--ghost" onClick={() => setConfirmingUndo(false)} disabled={sending}>
                  Manter sinalização
                </button>
              </div>
            </div>
          )}
          {error && <p className="sp-message sp-message--error" role="alert">{error}</p>}
        </div>
        {!confirmingUndo && (
          <div className="sp-doubt__actions">
            <button type="button" className="sp-doubt__action sp-doubt__action--ghost" onClick={onOpenSchedule}>
              Ver agendamentos
            </button>
            <button type="button" className="sp-doubt__action sp-doubt__action--ghost" onClick={() => { setError(''); setConfirmingUndo(true) }}>
              Desfazer sinalização
            </button>
          </div>
        )}
      </section>
    )
  }

  if (!journeyConcluded) {
    return (
      <section className="sp-doubt sp-doubt--locked" aria-labelledby="sp-doubt-title">
        <div className="sp-doubt__icon" aria-hidden="true">?</div>
        <div className="sp-doubt__body">
          <h2 id="sp-doubt-title">Ficou com dúvida sobre a sua escolha?</h2>
          <p>Quando você concluir a jornada (todas as trilhas e sínteses), poderá avisar a psicóloga por aqui.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="sp-doubt" aria-labelledby="sp-doubt-title">
      <div className="sp-doubt__icon" aria-hidden="true">?</div>
      <div className="sp-doubt__body">
        <h2 id="sp-doubt-title">Ficou com dúvida ou indecisão sobre a sua escolha?</h2>
        <p>
          Tudo bem não ter certeza. Avise a psicóloga e ela poderá marcar uma conversa para ajudar você a
          entender melhor o seu resultado.
        </p>
        {confirming && (
          <div className="sp-doubt__confirm">
            <span>A psicóloga da sua escola vai receber um e-mail. Você só precisa avisar uma vez. Confirmar?</span>
            <div>
              <button type="button" className="sp-doubt__action" onClick={handleFlag} disabled={sending}>
                {sending ? 'Avisando…' : 'Sim, avisar a psicóloga'}
              </button>
              <button type="button" className="sp-doubt__action sp-doubt__action--ghost" onClick={() => setConfirming(false)} disabled={sending}>
                Agora não
              </button>
            </div>
          </div>
        )}
        {notice && !confirming && <output className="sp-message sp-message--success">{notice}</output>}
        {error && <p className="sp-message sp-message--error" role="alert">{error}</p>}
      </div>
      {!confirming && (
        <button type="button" className="sp-doubt__action" onClick={() => setConfirming(true)}>
          Sinalizar dúvida para a psicóloga
        </button>
      )}
    </section>
  )
}
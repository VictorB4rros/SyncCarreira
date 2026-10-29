/**
 * @file ResultsPage.tsx
 * @description Resultado da jornada (atual ou do histórico), sinalização de dúvida,
 * download do PDF, nova jornada e histórico de ciclos (RF-15).
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Cpu,
  Dna,
  Download,
  Eye,
  HeartHandshake,
  CalendarCheck,
  Layers,
  MessageCircle,
  Palette,
  RefreshCw,
  Shield,
  Star,
  Users,
} from 'lucide-react'
import {
  downloadJourneyPdf,
  flagDoubt,
  getCurrentResult,
  getErrorMessage,
  getHttpStatus,
  getJourneyHistory,
  getJourneyResult,
  getMyDoubt,
  startNewJourney,
} from '../api/studentApi'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  ProgressBar,
  Skeleton,
  cn,
  useToast,
  type Icon,
} from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync, type AsyncState } from '../hooks/useAsync'
import { formatDate, formatLongDate, formatNumber } from '../lib/format'
import { affinityLevel } from '../lib/journey'
import { AREA_LABELS, AREA_SHORT_LABELS } from '../lib/labels'
import type { JourneyDoubtDTO, JourneyRecordDTO, JourneyResultDTO, KnowledgeArea } from '../types'

const AREA_ICONS: Record<KnowledgeArea, Icon> = {
  EXATAS: Cpu,
  HUMANAS: Users,
  ARTES: Palette,
  BIOLOGICAS: Dna,
}

/** Resultado atual: 422 significa "jornada ainda não concluída" (não é erro para o aluno). */
async function loadCurrentResult(): Promise<JourneyResultDTO | null> {
  try {
    return await getCurrentResult()
  } catch (err) {
    if (getHttpStatus(err) === 422) return null
    throw err
  }
}

export default function ResultsPage() {
  const params = useParams()
  const historyId = params.journeyId ? Number(params.journeyId) : null
  const viewingHistory = historyId !== null && Number.isInteger(historyId) && historyId > 0

  const result = useAsync(() => (viewingHistory ? getJourneyResult(historyId as number) : loadCurrentResult()), [historyId])
  const history = useAsync(getJourneyHistory, [])

  return (
    <>
      <PageHeader
        eyebrow="Relatório de orientação vocacional"
        title={viewingHistory ? 'Resultado de uma jornada anterior' : 'Meus resultados'}
        description="Um panorama das suas afinidades construído a partir das suas reflexões nos 4 pilares."
        actions={
          viewingHistory && (
            <ButtonLink to="/aluno/resultados" variant="outline" icon={ArrowLeft}>
              Voltar ao resultado atual
            </ButtonLink>
          )
        }
      />

      {result.loading && !result.data ? (
        <div className="flex flex-col gap-4" aria-label="Carregando resultado">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      ) : result.error ? (
        <ErrorState
          message={getErrorMessage(result.error, 'Não foi possível carregar o resultado.')}
          onRetry={result.reload}
        />
      ) : result.data ? (
        <ResultView result={result.data} current={!viewingHistory} />
      ) : (
        <EmptyState
          icon={Layers}
          title="Seu resultado aparece ao concluir os 4 pilares"
          description="Responda as perguntas e envie a síntese de cada pilar. Ao enviar a síntese final, o seu panorama vocacional fica disponível aqui."
          action={<ButtonLink to="/aluno/trilhas" iconRight={ArrowRight}>Continuar minha jornada</ButtonLink>}
        />
      )}

      <HistoryTable state={history} activeId={viewingHistory ? historyId : result.data?.journeyId ?? null} />
    </>
  )
}

function ResultView({ result, current }: { result: JourneyResultDTO; current: boolean }) {
  const toast = useToast()
  const [downloading, setDownloading] = useState(false)
  const scores = [...result.scores].sort((a, b) => b.percentage - a.percentage)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadJourneyPdf(result.journeyId, result.journeyNumber)
      toast.success('PDF gerado', 'O download do relatório foi iniciado.')
    } catch (err) {
      toast.error('Não foi possível baixar o PDF', getErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <div className="flex items-start gap-3 rounded-2xl border border-secondary-container bg-surface-container-low p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Instrumento orientativo</span>
            <p className="leading-relaxed text-on-surface-variant">
              <strong className="text-on-surface">Importante: este resultado não é um diagnóstico fechado.</strong>{' '}
              {result.disclaimer}
            </p>
          </div>
        </div>

        <Card className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight text-on-surface">Panorama vocacional — Jornada #{result.journeyNumber}</h2>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <CircleCheck className="h-4 w-4 text-primary" aria-hidden />
                Concluída em {formatLongDate(result.concludedAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" icon={Download} loading={downloading} onClick={handleDownload}>
                Baixar relatório em PDF
              </Button>
              {current && <NewJourneyButton />}
            </div>
          </div>
        </Card>

        <section aria-labelledby="distribuicao-areas" className="flex flex-col gap-3">
          <h2 id="distribuicao-areas" className="text-lg font-bold text-on-surface">Distribuição de afinidade por área</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {scores.map(score => {
              const AreaIcon = AREA_ICONS[score.area] ?? Layers
              return (
                <article
                  key={score.area}
                  className={cn(
                    'flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card',
                    score.highlighted && 'ring-2 ring-primary/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        score.highlighted ? 'bg-primary text-on-primary' : 'bg-surface-container text-primary',
                      )}
                    >
                      <AreaIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <Badge tone={score.highlighted ? 'primary' : 'soft'} icon={score.highlighted ? Star : undefined}>
                      {affinityLevel(score.percentage, score.highlighted)}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-on-surface">{score.areaName || AREA_LABELS[score.area]}</h3>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-primary">{formatNumber(score.percentage, 0)}%</span>
                    <span className="text-xs text-muted">
                      {formatNumber(score.score)} / {formatNumber(score.maxScore)} pts
                    </span>
                  </div>
                  <ProgressBar value={score.percentage} label={`Afinidade com ${score.areaName || AREA_LABELS[score.area]}`} />
                </article>
              )
            })}
          </div>
        </section>

        <section aria-labelledby="subareas" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="subareas" className="text-lg font-bold text-on-surface">Subáreas em destaque &amp; leque de carreiras</h2>
              <p className="text-sm text-muted">Caminhos para investigar a partir das suas áreas de maior afinidade.</p>
            </div>
            {result.suggestions.length > 0 && <Badge tone="soft">{result.suggestions.length} sugestões</Badge>}
          </div>
          {result.suggestions.length === 0 ? (
            <EmptyState icon={Layers} title="Sem sugestões de subáreas" description="Converse com a sua psicóloga para explorar caminhos possíveis." />
          ) : (
            <div className="flex flex-col gap-4">
              {result.suggestions.map((sub, i) => (
                <article key={sub.id} className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-secondary">{AREA_LABELS[sub.area]}</span>
                    {i === 0 && <Badge tone="primary">Mais alinhada</Badge>}
                  </div>
                  <h3 className="text-base font-bold text-on-surface">{sub.name}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{sub.description}</p>
                  {sub.careers.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-muted">Carreiras e formações para investigar:</span>
                      <ul className="flex flex-wrap gap-2">
                        {sub.careers.map(career => (
                          <li key={career} className="rounded-lg bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-primary">
                            {career}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:col-span-4">
        {current && <DoubtCard />}
        <Card className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-on-surface">Sigilo ético profissional</span>
            <p className="text-xs leading-relaxed text-muted">
              Suas reflexões só são acessadas pelo serviço de psicologia da sua escola, protegidas pela LGPD e pelo código de ética profissional.
            </p>
          </div>
        </Card>
      </aside>
    </div>
  )
}

function DoubtCard() {
  const toast = useToast()
  const { data, error, loading, reload, setData } = useAsync<JourneyDoubtDTO>(getMyDoubt, [])
  const [sending, setSending] = useState(false)

  async function handleFlag() {
    setSending(true)
    try {
      setData(await flagDoubt())
      toast.success('Notificação enviada com sucesso', 'A psicóloga foi avisada e vai entrar em contato para uma conversa acolhedora.')
    } catch (err) {
      if (getHttpStatus(err) === 409) {
        await reload()
        toast.info('Você já sinalizou dúvida', 'A psicóloga já foi avisada.')
      } else {
        toast.error('Não foi possível enviar a sinalização', getErrorMessage(err))
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3 bg-gradient-to-br from-white to-surface-container-low">
      <CardTitle icon={HeartHandshake}>Apoio emocional</CardTitle>
      <h2 className="text-base font-bold text-on-surface">Sentindo indecisão ou insegurança?</h2>
      <p className="text-sm text-muted">
        Hesitar entre duas áreas ou sentir pressão com as escolhas é <strong className="text-on-surface">completamente normal</strong>. Nenhuma decisão precisa ser solitária ou definitiva agora.
      </p>
      {loading && !data ? (
        <Skeleton className="h-10" />
      ) : error ? (
        <Alert tone="danger">{getErrorMessage(error, 'Não foi possível verificar a sinalização.')}</Alert>
      ) : data?.inDoubt ? (
        <Alert tone="success" title="Dúvida sinalizada">
          Você avisou a psicóloga em {formatDate(data.doubtFlaggedAt)}. Ela vai combinar uma conversa com você.
        </Alert>
      ) : (
        <>
          <Button icon={MessageCircle} loading={sending} onClick={handleFlag}>
            Sinalizar dúvida para a psicóloga
          </Button>
          <p className="text-[11px] text-muted">As psicólogas da sua escola recebem um aviso por e-mail para agendar uma conversa.</p>
        </>
      )}
    </Card>
  )
}

function NewJourneyButton() {
  const [open, setOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const { refreshJourney } = useStudent()
  const toast = useToast()
  const navigate = useNavigate()

  async function handleStart() {
    setStarting(true)
    setError('')
    try {
      await startNewJourney()
      await refreshJourney()
      setOpen(false)
      toast.success('Nova jornada iniciada', 'Sua jornada anterior continua salva no histórico.')
      navigate('/aluno')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível iniciar uma nova jornada.'))
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      <Button icon={RefreshCw} onClick={() => setOpen(true)}>
        Iniciar nova jornada
      </Button>
      <Modal
        open={open}
        onClose={() => !starting && setOpen(false)}
        title="Iniciar uma nova jornada?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={starting}>
              Cancelar
            </Button>
            <Button icon={RefreshCw} loading={starting} onClick={handleStart}>
              Sim, iniciar nova jornada
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p>
            A jornada concluída continua no seu histórico, com resultado e PDF. Na nova jornada, as respostas e sínteses
            atuais são apagadas e os 4 pilares recomeçam do início.
          </p>
          {error && <Alert tone="danger">{error}</Alert>}
        </div>
      </Modal>
    </>
  )
}

function HistoryTable({ state, activeId }: { state: AsyncState<JourneyRecordDTO[]>; activeId: number | null }) {
  const toast = useToast()
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const journeys = [...(state.data ?? [])].sort((a, b) => b.journeyNumber - a.journeyNumber)

  async function handleDownload(journey: JourneyRecordDTO) {
    setDownloadingId(journey.id)
    try {
      await downloadJourneyPdf(journey.id, journey.journeyNumber)
    } catch (err) {
      toast.error('Não foi possível baixar o PDF', getErrorMessage(err))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <Card as="section" className="flex flex-col gap-4">
      <CardTitle icon={CalendarCheck} aside={journeys.length > 0 && <Badge tone="soft">{journeys.length} concluída(s)</Badge>}>
        Histórico de ciclos de orientação
      </CardTitle>

      {state.loading && !state.data ? (
        <Skeleton className="h-24" />
      ) : state.error ? (
        <Alert tone="danger">{getErrorMessage(state.error, 'Não foi possível carregar o histórico.')}</Alert>
      ) : journeys.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma jornada concluída ainda. Ao concluir, ela fica registrada aqui com resultado e PDF.</p>
      ) : (
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-2 font-semibold">Ciclo</th>
                <th scope="col" className="px-4 py-2 font-semibold">Finalização</th>
                <th scope="col" className="px-4 py-2 font-semibold">Área predominante</th>
                <th scope="col" className="px-4 py-2 font-semibold">Status</th>
                <th scope="col" className="px-4 py-2 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {journeys.map(j => (
                <tr key={j.id} className={cn('border-b border-outline-variant/60 last:border-0', activeId === j.id && 'bg-surface-container-low')}>
                  <td className="px-4 py-3 font-semibold text-on-surface">
                    Jornada #{j.journeyNumber}
                    {j.schoolClassName && <span className="block text-xs font-normal text-muted">{j.schoolClassName}</span>}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{formatLongDate(j.concludedAt)}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {j.highestScoreAreas.length > 0 ? j.highestScoreAreas.map(a => AREA_SHORT_LABELS[a]).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={activeId === j.id ? 'primary' : 'soft'}>{activeId === j.id ? 'Visualizando' : 'Concluída'}</Badge>
                      {j.inDoubt && <Badge tone="strong">Dúvida sinalizada</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/aluno/resultados/${j.id}`}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-low"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden /> Ver resultado
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownload(j)}
                        disabled={downloadingId === j.id}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container-low disabled:opacity-60"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden /> {downloadingId === j.id ? 'Gerando…' : 'PDF'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/**
 * @file TrailsPage.tsx
 * @description "Minhas Trilhas Vocacionais": visão geral dos 4 pilares com o perfil do aluno.
 */
import { CalendarDays, Footprints, HeartHandshake, MessageCircle, ShieldCheck } from 'lucide-react'
import { loadJourneyProgress } from '../api/loadJourneyProgress'
import { getErrorMessage } from '../api/studentApi'
import { ButtonLink, Card, ErrorState, PageHeader, ProgressBar } from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync } from '../hooks/useAsync'
import { initials, pillarCode } from '../lib/labels'
import { PillarTimeline, TimelineSkeleton } from './HomePage'

export default function TrailsPage() {
  const { profile, journey } = useStudent()
  const { data, error, loading, reload } = useAsync(loadJourneyProgress, [])
  const summary = data?.summary
  const concluded = journey?.currentJourneyConcluded || summary?.allConcluded

  return (
    <>
      <PageHeader
        eyebrow="Trilha ativa"
        title="Minhas trilhas vocacionais"
        description="Acompanhe a sua evolução reflexiva nos 4 pilares do método SyncCarreira. A progressão é sequencial para garantir uma autodescoberta genuína."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <aside className="order-last flex flex-col gap-4 lg:order-first lg:col-span-4">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-base font-bold text-on-primary">
                {initials(profile.name)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-base font-bold text-on-surface">{profile.name}</span>
                <span className="text-xs text-muted">
                  {journey?.currentJourneyNumber ? `Jornada #${journey.currentJourneyNumber}` : 'Orientanda(o) ativa(o)'}
                  {journey && journey.concludedJourneys > 0 ? ` • ${journey.concludedJourneys} concluída(s)` : ''}
                </span>
              </div>
            </div>
            {summary && (
              <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">{summary.percentage}% concluído</span>
                  <span className="text-muted">
                    {summary.concludedTrails} de {summary.totalTrails} pilares finalizados
                  </span>
                </div>
                <ProgressBar value={summary.percentage} label="Progresso da jornada" />
              </div>
            )}
            {summary?.current && !concluded && (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Footprints className="h-4 w-4 text-primary" aria-hidden />
                Próximo passo: {pillarCode(summary.current.trail.sequentialOrder)}
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-3 bg-gradient-to-br from-surface-container-low to-surface-container">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <HeartHandshake className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-base font-bold text-on-surface">Precisa de acolhimento nesta etapa?</h2>
            <p className="text-sm text-muted">
              Ficou com dúvidas ou sentiu insegurança em algum pilar? Converse com a sua psicóloga nas sessões de orientação.
            </p>
            {concluded ? (
              <ButtonLink to="/aluno/resultados" icon={MessageCircle} size="sm" className="self-start">
                Sinalizar dúvida à psicóloga
              </ButtonLink>
            ) : (
              <ButtonLink to="/aluno/sessoes" variant="outline" icon={CalendarDays} size="sm" className="self-start">
                Ver minhas sessões
              </ButtonLink>
            )}
          </Card>

          <div className="flex items-start gap-2.5 rounded-2xl bg-inverse-surface p-4 text-inverse-on-surface">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary-fixed" aria-hidden />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-primary-fixed">Diretriz ética &amp; sigilo CFP</span>
              <p className="text-xs leading-relaxed text-inverse-on-surface/80">
                Suas respostas e reflexões são confidenciais e protegidas pelas resoluções do Conselho Federal de Psicologia e pela LGPD.
              </p>
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-4 lg:col-span-8" aria-label="Etapas da jornada">
          {loading && !data ? (
            <TimelineSkeleton />
          ) : error ? (
            <ErrorState message={getErrorMessage(error, 'Não foi possível carregar suas trilhas.')} onRetry={reload} />
          ) : data ? (
            <PillarTimeline progress={data} />
          ) : null}
        </section>
      </div>
    </>
  )
}

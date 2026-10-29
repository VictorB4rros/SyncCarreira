/**
 * @file HomePage.tsx
 * @description "Minha Jornada": saudação, progresso dos 4 pilares e resumo lateral.
 */
import { ArrowRight, ChartColumn, LockOpen, Timer, Waypoints } from 'lucide-react'
import { loadJourneyProgress } from '../api/loadJourneyProgress'
import { getErrorMessage } from '../api/studentApi'
import { PillarCard } from '../components/PillarCard'
import { AffinitiesCard, LatestSynthesesCard, NextSessionCard } from '../components/JourneyWidgets'
import { Badge, ButtonLink, ErrorState, ProgressBar, Skeleton } from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useAsync } from '../hooks/useAsync'
import { formatDate } from '../lib/format'
import { firstName, pillarCode, trailLabel } from '../lib/labels'
import type { JourneyProgress } from '../api/loadJourneyProgress'

function Hero({ progress }: { progress: JourneyProgress | null }) {
  const { profile, journey } = useStudent()
  const summary = progress?.summary
  const current = summary?.current
  const concluded = journey?.currentJourneyConcluded || summary?.allConcluded

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-deep via-primary to-primary-container p-5 text-white shadow-raised sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-secondary-container/20" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 right-40 h-64 w-64 rounded-full bg-primary-fixed-dim/15" aria-hidden />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="flex max-w-2xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {journey?.currentJourneyNumber && (
              <Badge tone="white">
                <span className="h-2 w-2 rounded-full bg-secondary-container" aria-hidden /> Jornada {concluded ? 'concluída' : 'ativa'} #{journey.currentJourneyNumber}
              </Badge>
            )}
            {journey?.currentJourneyStartedAt && (
              <span className="text-xs font-medium text-primary-fixed/80">• Iniciada em {formatDate(journey.currentJourneyStartedAt)}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">
            Olá, {firstName(profile.name) || 'estudante'} <span aria-hidden>👋</span>
          </h1>
          <p className="text-sm leading-relaxed text-primary-fixed sm:text-base">
            {!summary ? (
              'Carregando o seu progresso…'
            ) : concluded ? (
              <>Você concluiu os {summary.totalTrails} pilares. Seu panorama vocacional está pronto para conversar com a sua psicóloga.</>
            ) : current ? (
              <>
                Você está no <strong className="font-semibold text-white">{pillarCode(current.trail.sequentialOrder)}: {trailLabel(current.trail.name)}</strong>.
                Prossiga na sua trilha reflexiva com acolhimento e clareza.
              </>
            ) : (
              'Sua jornada está pronta para começar.'
            )}
          </p>
          {summary && (
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-primary-fixed">
                <span className="font-medium">Progresso da jornada vocacional</span>
                <span className="font-bold">
                  {summary.percentage}% concluído <span className="font-normal opacity-80">({summary.concludedTrails} de {summary.totalTrails} pilares)</span>
                </span>
              </div>
              <ProgressBar value={summary.percentage} tone="light" className="h-2.5" label="Progresso da jornada vocacional" />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
          {concluded ? (
            <ButtonLink to="/aluno/resultados" variant="light" size="lg" iconRight={ChartColumn}>
              Ver meu resultado
            </ButtonLink>
          ) : current ? (
            <ButtonLink to={`/aluno/trilhas/${current.trail.id}`} variant="light" size="lg" iconRight={ArrowRight}>
              Continuar {pillarCode(current.trail.sequentialOrder)}
            </ButtonLink>
          ) : null}
          {current && current.totalQuestions > 0 && !concluded && (
            <span className="flex items-center gap-1 text-xs text-primary-fixed/80">
              <Timer className="h-4 w-4" aria-hidden /> Faltam {current.totalQuestions - current.answeredQuestions} perguntas neste pilar
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

export function PillarTimeline({ progress, compact = false }: { progress: JourneyProgress; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {progress.trails.map((info, i) => (
        <PillarCard key={info.trail.id} info={info} previous={i > 0 ? progress.trails[i - 1] : undefined} compact={compact} />
      ))}
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Carregando pilares">
      {[0, 1, 2, 3].map(i => (
        <Skeleton key={i} className="h-36" />
      ))}
    </div>
  )
}

export default function HomePage() {
  const { profile, nextSession } = useStudent()
  const { data, error, loading, reload } = useAsync(loadJourneyProgress, [])

  return (
    <>
      <Hero progress={data} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-8" aria-labelledby="trilha-sequencial">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
                <Waypoints className="h-5 w-5" aria-hidden />
              </span>
              <div className="flex flex-col">
                <h2 id="trilha-sequencial" className="text-lg font-bold tracking-tight text-on-surface lg:text-xl">
                  Trilha sequencial dos 4 pilares vocacionais
                </h2>
                <span className="text-xs text-muted">Etapas orientadas pela metodologia reflexiva SyncCarreira</span>
              </div>
            </div>
            <span className="hidden sm:block">
              <Badge tone="soft" icon={LockOpen}>Passo a passo guiado</Badge>
            </span>
          </div>

          {loading && !data ? (
            <TimelineSkeleton />
          ) : error ? (
            <ErrorState message={getErrorMessage(error, 'Não foi possível carregar seus pilares.')} onRetry={reload} />
          ) : data ? (
            <PillarTimeline progress={data} />
          ) : null}
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <NextSessionCard session={nextSession} />
          <AffinitiesCard affinities={profile.affinities} />
          {data && <LatestSynthesesCard syntheses={data.syntheses} />}
        </aside>
      </div>
    </>
  )
}

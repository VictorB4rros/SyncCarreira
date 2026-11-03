/**
 * @file ContentHubPage.tsx
 * @description Hub de Conteúdos do aluno: links da trilha de informação recomendados
 * para as suas áreas de maior afinidade e links de acesso à universidade.
 * GET /information-links/me (403 enquanto as trilhas anteriores não forem concluídas).
 */
import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, GraduationCap, Lock, Search, Sparkles } from 'lucide-react'
import { getErrorMessage, getHttpStatus, getMyInformationTrail } from '../api/studentApi'
import { LinkCard } from '../components/LinkCard'
import { Badge, ButtonLink, Card, CardTitle, EmptyState, ErrorState, PageHeader, ProgressBar, Skeleton, cn } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { formatNumber } from '../lib/format'
import { AREA_LABELS, AREA_SHORT_LABELS } from '../lib/labels'
import type { InformationLinkDTO, KnowledgeArea } from '../types'

type Filter = 'TODOS' | 'UNIVERSIDADE' | KnowledgeArea

function normalize(text: string) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function filterLinks(links: InformationLinkDTO[], filter: Filter, query: string): InformationLinkDTO[] {
  const q = normalize(query.trim())
  return links.filter(link => {
    if (filter === 'UNIVERSIDADE' && link.knowledgeArea !== null) return false
    if (filter !== 'TODOS' && filter !== 'UNIVERSIDADE' && link.knowledgeArea !== filter) return false
    if (!q) return true
    return normalize(`${link.topic} ${link.url}`).includes(q)
  })
}

export default function ContentHubPage() {
  const { data, error, loading, reload } = useAsync(getMyInformationTrail, [])
  const [filter, setFilter] = useState<Filter>('TODOS')
  const [query, setQuery] = useState('')

  const allLinks = useMemo(() => (data ? [...data.careerLinks, ...data.universityAccessLinks] : []), [data])
  const visible = useMemo(() => filterLinks(allLinks, filter, query), [allLinks, filter, query])

  const header = (
    <PageHeader
      eyebrow="Conteúdos & recursos"
      title="Hub de Conteúdos"
      description="Materiais selecionados pela equipe de psicologia para as suas áreas de maior afinidade, além de guias de acesso à universidade (Enem, Sisu, ProUni)."
    />
  )

  if (loading && !data) {
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        {header}
        {getHttpStatus(error) === 403 ? (
          <EmptyState
            icon={Lock}
            title="O Hub é liberado no pilar de Informação"
            description={getErrorMessage(error, 'Conclua os pilares anteriores para acessar os conteúdos recomendados para você.')}
            action={<ButtonLink to="/aluno/trilhas" iconRight={ArrowRight}>Ver minhas trilhas</ButtonLink>}
          />
        ) : (
          <ErrorState message={getErrorMessage(error, 'Não foi possível carregar os conteúdos.')} onRetry={reload} />
        )}
      </>
    )
  }

  if (!data) return header

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'TODOS', label: 'Todos', count: allLinks.length },
    ...data.recommendedAreas.map(area => ({
      key: area as Filter,
      label: AREA_SHORT_LABELS[area],
      count: data.careerLinks.filter(l => l.knowledgeArea === area).length,
    })),
    { key: 'UNIVERSIDADE', label: 'Acesso à universidade', count: data.universityAccessLinks.length },
  ]

  return (
    <>
      {header}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-4 lg:col-span-8" aria-label="Materiais disponíveis">
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card">
            <label className="relative block">
              <span className="sr-only">Buscar conteúdos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar guias, profissões, vestibulares…"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low/50 py-2.5 pl-9 pr-3 text-sm placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    filter === f.key ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-primary hover:bg-surface-container',
                  )}
                >
                  {f.label}
                  <span className={cn('rounded-full px-1.5 text-[10px]', filter === f.key ? 'bg-white/20' : 'bg-white')}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          {allLinks.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Ainda não há materiais para você"
              description="A equipe de psicologia ainda não cadastrou links para as suas áreas. Volte em breve!"
            />
          ) : visible.length === 0 ? (
            <EmptyState icon={Search} title="Nenhum conteúdo encontrado" description="Tente outro termo ou limpe os filtros." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(link => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <Card className="flex flex-col gap-3">
            <CardTitle icon={Sparkles}>Por que estes conteúdos?</CardTitle>
            <p className="text-xs text-muted">Os links de carreira seguem as áreas em que você tem maior score na jornada:</p>
            {data.recommendedAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.recommendedAreas.map(area => (
                  <Badge key={area} tone="primary">{AREA_LABELS[area]}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Suas áreas em destaque aparecem conforme você responde os pilares.</p>
            )}
            {data.areaScores.length > 0 && (
              <ul className="flex flex-col gap-2.5 pt-1">
                {[...data.areaScores]
                  .sort((a, b) => b.percentage - a.percentage)
                  .map(score => (
                    <li key={score.area} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-on-surface-variant">{score.areaName || AREA_LABELS[score.area]}</span>
                        <span className="font-bold text-primary">{formatNumber(score.percentage, 0)}%</span>
                      </div>
                      <ProgressBar value={score.percentage} label={`Score em ${score.areaName || AREA_LABELS[score.area]}`} />
                    </li>
                  ))}
              </ul>
            )}
          </Card>
          <Card className="flex items-start gap-3 bg-gradient-to-br from-surface-container-low to-surface-container">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-on-surface-variant">
              Os guias de <strong>acesso à universidade</strong> valem para qualquer área: Enem, Sisu, ProUni, Fies e vestibulares específicos.
            </p>
          </Card>
        </aside>
      </div>
    </>
  )
}

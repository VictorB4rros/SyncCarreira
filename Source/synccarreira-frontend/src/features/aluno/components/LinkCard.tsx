/**
 * @file LinkCard.tsx
 * @description Card de um link da trilha de informação (InformationLinkDTO).
 */
import { ExternalLink, GraduationCap, Link2 } from 'lucide-react'
import type { InformationLinkDTO } from '../types'
import { hostnameOf, safeExternalUrl } from '../lib/format'
import { AREA_SHORT_LABELS } from '../lib/labels'
import { Badge } from './ui'

export function LinkCard({ link }: { link: InformationLinkDTO }) {
  const university = link.knowledgeArea === null
  const href = safeExternalUrl(link.url)
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={university ? 'strong' : 'soft'} icon={university ? GraduationCap : undefined}>
          {university ? 'Acesso à universidade' : `Área: ${AREA_SHORT_LABELS[link.knowledgeArea as keyof typeof AREA_SHORT_LABELS] ?? link.knowledgeArea}`}
        </Badge>
        <span className="whitespace-nowrap text-[11px] text-subtle">Link externo</span>
      </div>
      <h3 className="text-sm font-bold leading-snug text-on-surface">{link.topic}</h3>
      <span className="flex items-center gap-1.5 truncate text-xs text-muted">
        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{hostnameOf(link.url)}</span>
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 self-start rounded-lg bg-surface-container px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-surface-container-highest"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Acessar link
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      ) : (
        <span className="mt-auto text-xs text-subtle">Link indisponível</span>
      )}
    </article>
  )
}

/**
 * @file labels.ts
 * @description Textos fixos da área do aluno (nomes de pilares, áreas e status).
 * Os dados vêm da API; aqui ficam só os rótulos e descrições pedagógicas.
 */
import type { FeedbackType, KnowledgeArea, ScheduleStatus, ScheduleType, TrailName } from '../types'

export interface TrailMeta {
  label: string
  description: string
}

export const TRAIL_META: Record<TrailName, TrailMeta> = {
  AUTOCONHECIMENTO: {
    label: 'Autoconhecimento',
    description:
      'Mapeamento das suas forças, valores pessoais inegociáveis, estilos de aprendizagem e talentos naturais.',
  },
  INFLUENCIAS: {
    label: 'Influências Externas & Família',
    description:
      'Reflexão sobre expectativas familiares, pressões sociais e como separar o seu desejo das opiniões de outras pessoas.',
  },
  PLANO_DE_FUTURO: {
    label: 'Plano de Futuro & Projeto de Vida',
    description:
      'Construção do seu plano de ação: vestibulares, caminhos acadêmicos, rotina de estudos e um plano B acolhedor.',
  },
  INFORMACAO: {
    label: 'Informação Profissional & Mercado',
    description:
      'Exploração de carreiras ligadas às suas áreas de maior afinidade, acesso à universidade e a síntese final da jornada.',
  },
}

export function trailLabel(name: TrailName | string | null | undefined): string {
  if (!name) return 'Pilar'
  return TRAIL_META[name as TrailName]?.label ?? String(name)
}

export const AREA_LABELS: Record<KnowledgeArea, string> = {
  EXATAS: 'Ciências Exatas & Tecnologia',
  HUMANAS: 'Ciências Humanas & Sociais',
  ARTES: 'Artes, Design & Comunicação',
  BIOLOGICAS: 'Ciências Biológicas & Saúde',
}

export const AREA_SHORT_LABELS: Record<KnowledgeArea, string> = {
  EXATAS: 'Exatas',
  HUMANAS: 'Humanas',
  ARTES: 'Artes',
  BIOLOGICAS: 'Biológicas',
}

/** Ordem de exibição das afinidades e o campo correspondente em StudentAffinityDTO. */
export const AFFINITY_FIELDS = [
  { field: 'exactSciences', area: 'EXATAS' },
  { field: 'humanities', area: 'HUMANAS' },
  { field: 'arts', area: 'ARTES' },
  { field: 'biologicalSciences', area: 'BIOLOGICAS' },
] as const

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  AGENDADA: 'Agendada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
}

export const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  INDIVIDUAL: 'Individual 1:1',
  GRUPO: 'Em grupo',
}

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  JORNADA: 'Devolutiva de jornada',
  SESSAO: 'Feedback de sessão',
}

/** "Pilar 01" a partir da ordem sequencial. */
export function pillarCode(order: number | null | undefined): string {
  return `Pilar ${String(order ?? 0).padStart(2, '0')}`
}

/** Primeiro nome para saudações. */
export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? ''
}

/** Iniciais para avatar ("Ana Clara Souza" → "AS"). */
export function initials(fullName: string | null | undefined): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

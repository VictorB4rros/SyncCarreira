/**
 * @file loadJourneyProgress.ts
 * @description Monta o progresso dos 4 pilares a partir da API.
 *
 * Fluxo (respeita as regras do backend):
 *  1. GET /trails + GET /syntheses/me
 *  2. POST /trails/{id}/can-access para cada trilha
 *  3. Somente para trilhas liberadas: GET /questions/trail/{id} + GET /answers?trailId=
 *     (para trilhas bloqueadas esses endpoints devolvem 403, então nem são chamados)
 */
import { deriveTrailProgress, summarizeJourney, type JourneySummary, type TrailProgressInfo } from '../lib/journey'
import type { SynthesisDTO } from '../types'
import { canAccessTrail, getMyAnswers, getMySyntheses, getTrailQuestions, getTrails } from './studentApi'

export interface JourneyProgress {
  trails: TrailProgressInfo[]
  summary: JourneySummary
  syntheses: SynthesisDTO[]
}

export async function loadJourneyProgress(): Promise<JourneyProgress> {
  const [trails, syntheses] = await Promise.all([getTrails(), getMySyntheses()])

  const progress = await Promise.all(
    trails.map(async trail => {
      const accessible = await canAccessTrail(trail.id)
      const synthesis = syntheses.find(s => s.trailId === trail.id) ?? null
      if (!accessible) return deriveTrailProgress(trail, { accessible, synthesis })

      const [questions, answers] = await Promise.all([getTrailQuestions(trail.id), getMyAnswers(trail.id)])
      return deriveTrailProgress(trail, { accessible, questions, answers, synthesis })
    }),
  )

  return { trails: progress, summary: summarizeJourney(progress), syntheses }
}

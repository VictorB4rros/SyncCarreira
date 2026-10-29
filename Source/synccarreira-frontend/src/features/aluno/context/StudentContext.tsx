/**
 * @file StudentContext.tsx
 * @description Dados compartilhados pela área do aluno: perfil, jornada atual,
 * feedbacks não lidos e próxima sessão. Carregados uma vez e atualizados sob demanda.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import {
  getCurrentJourney,
  getErrorMessage,
  getMyAppointments,
  getMyFeedbacks,
  getMyProfile,
} from '../api/studentApi'
import { nextAppointment } from '../lib/journey'
import type { AppointmentDTO, AuthUser, JourneyStatusDTO, StudentProfileDTO } from '../types'
import { ErrorState } from '../components/ui'

export interface StudentContextValue {
  user: AuthUser
  profile: StudentProfileDTO
  journey: JourneyStatusDTO | null
  unreadFeedbacks: number
  nextSession: AppointmentDTO | null
  setProfile: (profile: StudentProfileDTO) => void
  setUnreadFeedbacks: (updater: number | ((current: number) => number)) => void
  refreshJourney: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshSidebar: () => Promise<void>
}

export const StudentContext = createContext<StudentContextValue | null>(null)

export function useStudent(): StudentContextValue {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent deve ser usado dentro de <StudentProvider>')
  return ctx
}

export function StudentProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  const [profile, setProfile] = useState<StudentProfileDTO | null>(null)
  const [journey, setJourney] = useState<JourneyStatusDTO | null>(null)
  const [unreadFeedbacks, setUnreadFeedbacks] = useState(0)
  const [nextSession, setNextSession] = useState<AppointmentDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const refreshProfile = useCallback(async () => {
    setProfile(await getMyProfile())
  }, [])

  const refreshJourney = useCallback(async () => {
    try {
      setJourney(await getCurrentJourney())
    } catch {
      // O status da jornada é complementar (cabeçalho); a tela continua funcionando sem ele.
      setJourney(null)
    }
  }, [])

  /** Badge de feedbacks e próxima sessão: falhas aqui não bloqueiam a área do aluno. */
  const refreshSidebar = useCallback(async () => {
    const [feedbacks, appointments] = await Promise.allSettled([getMyFeedbacks(), getMyAppointments(user.id)])
    if (feedbacks.status === 'fulfilled') setUnreadFeedbacks(feedbacks.value.filter(f => !f.read).length)
    if (appointments.status === 'fulfilled') setNextSession(nextAppointment(appointments.value))
  }, [user.id])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshProfile(), refreshJourney()])
      void refreshSidebar()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [refreshProfile, refreshJourney, refreshSidebar])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const value = useMemo<StudentContextValue | null>(
    () =>
      profile
        ? {
            user,
            profile,
            journey,
            unreadFeedbacks,
            nextSession,
            setProfile,
            setUnreadFeedbacks,
            refreshJourney,
            refreshProfile,
            refreshSidebar,
          }
        : null,
    [user, profile, journey, unreadFeedbacks, nextSession, refreshJourney, refreshProfile, refreshSidebar],
  )

  if (loading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-muted" role="status">
        <LoaderCircle className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <span className="ml-3 text-sm font-medium">Carregando seu espaço…</span>
      </div>
    )
  }

  if (error || !value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <ErrorState
          title="Não foi possível abrir o Espaço do Estudante"
          message={getErrorMessage(error, 'Não conseguimos carregar o seu perfil.')}
          onRetry={loadAll}
        />
      </div>
    )
  }

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

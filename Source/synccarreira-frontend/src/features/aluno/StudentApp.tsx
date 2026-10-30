/**
 * @file StudentApp.tsx
 * @description Ponto de entrada da área do aluno, montado em /aluno/* pelo routes/AppRoutes.jsx.
 *
 * Guardas:
 *  1. Sem sessão → /login
 *  2. Sem ROLE_USER (psicóloga/admin) → /home (cada perfil segue o seu fluxo atual)
 *  3. Perfil sem afinidades (RF-14) → /aluno/boas-vindas
 */
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Compass, SearchX } from 'lucide-react'
import './aluno.css'
import { ButtonLink, EmptyState, ToastProvider } from './components/ui'
import { StudentProvider, useStudent } from './context/StudentContext'
import { isStudentUser, useStudentAuth } from './context/auth'
import StudentShell from './layout/StudentShell'
import ContentHubPage from './pages/ContentHubPage'
import FeedbacksPage from './pages/FeedbacksPage'
import HomePage from './pages/HomePage'
import { AffinitiesPage, OnboardingPage } from './pages/OnboardingPage'
import ResultsPage from './pages/ResultsPage'
import SessionsPage from './pages/SessionsPage'
import TrailRunPage from './pages/TrailRunPage'
import TrailsPage from './pages/TrailsPage'

/** Exige as afinidades preenchidas antes de qualquer tela da jornada. */
export function ProfileGate() {
  const { profile } = useStudent()
  const location = useLocation()
  if (!profile.profileCompleted) return <Navigate to="/aluno/boas-vindas" replace state={{ from: location }} />
  return <Outlet />
}

function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Página não encontrada"
      description="Este endereço não existe no Espaço do Estudante."
      action={
        <ButtonLink to="/aluno" icon={Compass}>
          Ir para Minha Jornada
        </ButtonLink>
      }
    />
  )
}

export function StudentRoutes() {
  return (
    <Routes>
      <Route path="boas-vindas" element={<OnboardingPage />} />
      <Route element={<ProfileGate />}>
        <Route element={<StudentShell />}>
          <Route index element={<HomePage />} />
          <Route path="trilhas" element={<TrailsPage />} />
          <Route path="trilhas/:trailId" element={<TrailRunPage />} />
          <Route path="resultados" element={<ResultsPage />} />
          <Route path="resultados/:journeyId" element={<ResultsPage />} />
          <Route path="conteudos" element={<ContentHubPage />} />
          <Route path="sessoes" element={<SessionsPage />} />
          <Route path="feedbacks" element={<FeedbacksPage />} />
          <Route path="afinidades" element={<AffinitiesPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default function StudentApp() {
  const { user } = useStudentAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isStudentUser(user)) return <Navigate to="/home" replace />

  return (
    <div className="sc-aluno min-h-screen bg-surface font-sans text-on-surface antialiased">
      <ToastProvider>
        <StudentProvider user={user}>
          <StudentRoutes />
        </StudentProvider>
      </ToastProvider>
    </div>
  )
}

/**
 * @file AppRoutes.tsx
 * @description Mapa de rotas com RBAC por perfil e layouts dedicados.
 *
 *  /login, /new-password        → públicas
 *  /admin/*                     → ROLE_ADMIN
 *  /psicologa/*                 → ROLE_PSICOLOGA  (PsychologistLayout)
 *  /aluno/*                     → ROLE_USER       (StudentLayout)
 *
 * As rotas antigas (/home, /trail/:id, /agendamentos, /painel-progresso...) continuam funcionando
 * via redirecionamento por perfil, porque as páginas legadas ainda navegam para elas.
 * Remova o bloco "Rotas legadas" quando todas as páginas tiverem sido migradas.
 */

import { Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Compass, Construction, Loader2 } from 'lucide-react'
import {
  RedirectToHome,
  RequireGuest,
  RequireRole,
  getHomePath,
  getPrimaryRole,
  useTypedAuth,
} from '../auth/RequireRole'
import PsychologistLayout from '../layouts/PsychologistLayout'
import StudentLayout from '../layouts/StudentLayout'
import { ROLES, type AuthUser } from '../types/api'

// ─── Páginas (lazy: cada perfil só baixa o próprio código) ───────
// As páginas ainda são JSX; o cast evita depender da inferência de tipos de arquivos .jsx.

type AnyComponent = ComponentType<Record<string, unknown>>
const page = (loader: () => Promise<unknown>) =>
  lazy(loader as () => Promise<{ default: AnyComponent }>)

const LoginPage = page(() => import('../pages/Login/LoginPage.jsx'))
const NewPasswordPage = page(() => import('../pages/NewPassword/NewPasswordPage.jsx'))

// Admin
const AccountManagementPage = page(() => import('../pages/Psicologas/AccountManagementPage.jsx'))
const StudentFormPage = page(() => import('../pages/Psicologas/studentformPage.jsx'))

// Psicóloga + Admin
const StudentDetailPage = page(() => import('../pages/Psicologas/studentdetailPage.jsx'))

// Psicóloga
const ProgressDashboardPage = page(() => import('../pages/Psicologas/ProgressDashboardPage.jsx'))
const InformationLinkManagementPage = page(
  () => import('../pages/Psicologas/InformationLinkManagementPage.jsx'),
)

// Psicóloga + Aluno (a página decide a visão pelo perfil)
const AgendamentosPage = page(() => import('../pages/Agendamentos/AgendamentosPage.jsx'))

// Aluno
const StudentProfileGate = page(() => import('../pages/Perfil/StudentProfileGate.jsx'))
const StudentProfilePage = page(() => import('../pages/Perfil/StudentProfilePage.jsx'))
const JourneyPanoramaPage = page(() => import('../pages/Jornada/JourneyPanoramaPage.jsx'))
const JourneyResultPage = page(() => import('../pages/ResultadoJornada/JourneyResultPage.jsx'))
const TrailsHomePage = page(() => import('../pages/Home/HomePage.jsx'))
const TrailPage = page(() => import('../pages/Trilha/TrailPage.jsx'))

// ─── Estados de carregamento e fallback ──────────────────────────

function PageLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 text-slate-500 text-sm font-medium font-['Plus_Jakarta_Sans',Inter,sans-serif] ${
        fullScreen ? 'min-h-screen bg-[#F8FAFC]' : 'py-24'
      }`}
    >
      <Loader2 className="w-5 h-5 animate-spin text-[#6D28D9]" aria-hidden="true" />
      Carregando...
    </div>
  )
}

/** Envolve cada tela lazy com seu próprio Suspense (o layout continua visível). */
function Lazy({ children, fullScreen }: { children: ReactNode; fullScreen?: boolean }) {
  return <Suspense fallback={<PageLoader fullScreen={fullScreen} />}>{children}</Suspense>
}

/** Telas dos itens de menu que ainda serão migradas nas próximas etapas. */
function ComingSoon({ title }: { title: string }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-10 shadow-sm text-center space-y-3 max-w-xl mx-auto mt-10">
      <div className="mx-auto w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
        <Construction className="w-6 h-6" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-500">Esta área está em construção e chega nas próximas etapas.</p>
    </section>
  )
}

function NotFound() {
  const { user } = useTypedAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 font-['Plus_Jakarta_Sans',Inter,sans-serif]">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center">
          <Compass className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-slate-900">Página não encontrada</h1>
        <p className="text-sm text-slate-600">O endereço acessado não existe ou foi movido.</p>
        <Link
          to={user ? getHomePath(user) : '/login'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {user ? 'Voltar ao início' : 'Ir para o login'}
        </Link>
      </div>
    </div>
  )
}

// ─── Redirecionamento de rotas legadas por perfil ────────────────

type LegacyTargets = Partial<Record<'ADMIN' | 'PSICOLOGA' | 'USER', string>>

/**
 * Converte uma rota antiga na equivalente do perfil, preservando a query string
 * (ex.: /agendamentos?nova=1 → /psicologa/agenda?nova=1). `:param` é substituído pelos params da URL.
 */
function LegacyRedirect({ targets }: { targets: LegacyTargets }) {
  const { user } = useTypedAuth()
  const params = useParams()
  const { search } = useLocation()

  if (!user) return <Navigate to="/login" replace />

  const key = roleKey(user)
  const template = key ? targets[key] : undefined
  if (!template) return <RedirectToHome />

  const path = template.replace(/:(\w+)/g, (_, name: string) => encodeURIComponent(params[name] ?? ''))
  return <Navigate to={path + search} replace />
}

function roleKey(user: AuthUser): keyof LegacyTargets | null {
  switch (getPrimaryRole(user)) {
    case ROLES.ADMIN:
      return 'ADMIN'
    case ROLES.PSICOLOGA:
      return 'PSICOLOGA'
    case ROLES.USER:
      return 'USER'
    default:
      return null
  }
}

/** Páginas do aluno que exigem o perfil de afinidades preenchido. */
function WithProfileGate({ children }: { children: ReactNode }) {
  return <StudentProfileGate>{children}</StudentProfileGate>
}

// ─── Rotas ───────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Lazy fullScreen><LoginPage /></Lazy>} />
      </Route>
      <Route path="/new-password" element={<Lazy fullScreen><NewPasswordPage /></Lazy>} />
      <Route path="/" element={<RedirectToHome />} />

      {/* ADMIN */}
      <Route path="/admin" element={<RequireRole allow={[ROLES.ADMIN]} />}>
        <Route index element={<Navigate to="gestao" replace />} />
        <Route path="gestao" element={<Lazy fullScreen><AccountManagementPage /></Lazy>} />
        <Route path="alunos/:id" element={<Lazy fullScreen><StudentDetailPage /></Lazy>} />
        {/* PUT /students/{id} é exclusivo de ROLE_ADMIN no backend */}
        <Route path="alunos/:id/editar" element={<Lazy fullScreen><StudentFormPage /></Lazy>} />
      </Route>

      {/* PSICÓLOGA */}
      <Route
        path="/psicologa"
        element={
          <RequireRole allow={[ROLES.PSICOLOGA]}>
            <PsychologistLayout />
          </RequireRole>
        }
      >
        <Route index element={<Lazy><ProgressDashboardPage /></Lazy>} />
        <Route path="perfil" element={<ComingSoon title="Meu Perfil" />} />
        <Route path="turmas" element={<ComingSoon title="Turmas" />} />
        <Route path="trilhas" element={<ComingSoon title="Trilhas" />} />
        <Route path="orientacoes" element={<ComingSoon title="Orientações" />} />
        <Route path="agenda" element={<Lazy><AgendamentosPage /></Lazy>} />
        <Route path="relatorios" element={<ComingSoon title="Relatórios" />} />
        <Route path="conteudos" element={<Lazy><InformationLinkManagementPage /></Lazy>} />
        <Route path="alunos/:id" element={<Lazy><StudentDetailPage /></Lazy>} />
      </Route>

      {/* ALUNO */}
      <Route
        path="/aluno"
        element={
          <RequireRole allow={[ROLES.USER]}>
            <StudentLayout />
          </RequireRole>
        }
      >
        <Route index element={<Lazy><WithProfileGate><JourneyPanoramaPage /></WithProfileGate></Lazy>} />
        <Route path="trilhas" element={<Lazy><WithProfileGate><TrailsHomePage /></WithProfileGate></Lazy>} />
        <Route path="trilha/:trailId" element={<Lazy><WithProfileGate><TrailPage /></WithProfileGate></Lazy>} />
        <Route path="resultados" element={<Lazy><WithProfileGate><JourneyResultPage /></WithProfileGate></Lazy>} />
        <Route path="conteudos" element={<ComingSoon title="Hub de Conteúdos" />} />
        <Route path="sessoes" element={<Lazy><AgendamentosPage /></Lazy>} />
        <Route path="feedbacks" element={<ComingSoon title="Feedbacks" />} />
        <Route path="perfil" element={<Lazy><StudentProfilePage /></Lazy>} />
      </Route>

      {/* Rotas legadas — ainda usadas pelas páginas JSX via navigate()/Link */}
      <Route path="/home" element={<RedirectToHome />} />
      <Route path="/gestao" element={<LegacyRedirect targets={{ ADMIN: '/admin/gestao' }} />} />
      <Route path="/painel-progresso" element={<LegacyRedirect targets={{ PSICOLOGA: '/psicologa' }} />} />
      <Route path="/curadoria-links" element={<LegacyRedirect targets={{ PSICOLOGA: '/psicologa/conteudos' }} />} />
      <Route
        path="/agendamentos"
        element={<LegacyRedirect targets={{ PSICOLOGA: '/psicologa/agenda', USER: '/aluno/sessoes' }} />}
      />
      <Route path="/alunos" element={<LegacyRedirect targets={{ ADMIN: '/admin/gestao' }} />} />
      <Route
        path="/alunos/:id"
        element={<LegacyRedirect targets={{ ADMIN: '/admin/alunos/:id', PSICOLOGA: '/psicologa/alunos/:id' }} />}
      />
      <Route path="/alunos/:id/editar" element={<LegacyRedirect targets={{ ADMIN: '/admin/alunos/:id/editar' }} />} />
      <Route path="/perfil" element={<LegacyRedirect targets={{ USER: '/aluno/perfil' }} />} />
      <Route path="/minha-jornada" element={<LegacyRedirect targets={{ USER: '/aluno' }} />} />
      <Route path="/resultado-jornada" element={<LegacyRedirect targets={{ USER: '/aluno/resultados' }} />} />
      <Route path="/trail/:trailId" element={<LegacyRedirect targets={{ USER: '/aluno/trilha/:trailId' }} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage    from '../pages/Login/LoginPage.jsx'
import NewPasswordPage from '../pages/NewPassword/NewPasswordPage.jsx'
import HomePage     from '../pages/Home/HomePage.jsx'
import TrailPage    from '../pages/Trilha/TrailPage.jsx'
import AccountManagementPage from '../pages/Psicologas/AccountManagementPage.jsx'
import StudentDetailPage from '../pages/Psicologas/studentdetailPage.jsx'
import StudentFormPage from '../pages/Psicologas/studentformPage.jsx'
import AgendamentosPage from '../pages/Agendamentos/AgendamentosPage.jsx'
import InformationLinkManagementPage from '../pages/Psicologas/InformationLinkManagementPage.jsx'
import JourneyResultPage from '../pages/ResultadoJornada/JourneyResultPage.jsx'
import StudentProfilePage from '../pages/Perfil/StudentProfilePage.jsx'
import StudentProfileGate from '../pages/Perfil/StudentProfileGate.jsx'
import ProgressDashboardPage from '../pages/Psicologas/ProgressDashboardPage.jsx'
import JourneyPanoramaPage from '../pages/Jornada/JourneyPanoramaPage.jsx'
import { isAdministrator, isPsychologist } from '../utils/roles.js'

// Área do aluno (React + TypeScript + Tailwind), carregada sob demanda em /aluno/*
const StudentApp = lazy(() => import('../features/aluno/StudentApp'))

/** Aluno = ROLE_USER sem perfil de equipe (mesma regra de src/features/aluno/context/auth.ts). */
function isStudentOnly(user) {
    return Boolean(user?.roles?.some(role => role.authority === 'ROLE_USER'))
        && !isPsychologist(user) && !isAdministrator(user)
}

function PrivateRoute({ children }) {
    const { user } = useAuth()
    return user ? children : <Navigate to="/login" replace />
}

function StaffRoute({ children }) {
    const { user } = useAuth()
    return user && (isAdministrator(user) || isPsychologist(user))
        ? children
        : <Navigate to="/home" replace />
}

function AdminRoute({ children }) {
    const { user } = useAuth()
    return user && isAdministrator(user)
        ? children
        : <Navigate to={user ? "/home" : "/login"} replace />
}

function PsychologistRoute({ children }) {
    const { user } = useAuth()
    return user && isPsychologist(user)
        ? children
        : <Navigate to={user ? "/home" : "/login"} replace />
}

function HomeRoute() {
    const { user } = useAuth()
    if (isPsychologist(user)) return <Navigate to="/painel-progresso" replace />
    if (isStudentOnly(user)) return <Navigate to="/aluno" replace />
    return <StudentProfileGate><HomePage /></StudentProfileGate>
}

function StudentRoute({ children }) {
    const { user } = useAuth()
    const studentRoles = ['ROLE_USER', 'ROLE_STUDENT', 'ROLE_ALUNO']
    const isStudent = user?.roles?.some(role => studentRoles.includes(role.authority))
        || studentRoles.includes(user?.perfil)
    return user && isStudent
        ? children
        : <Navigate to={user ? "/home" : "/login"} replace />
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/aluno/*" element={
                <PrivateRoute><Suspense fallback={null}><StudentApp /></Suspense></PrivateRoute>
            } />
            <Route path="/new-password" element={<NewPasswordPage />} />
            <Route path="/home" element={
                <PrivateRoute><HomeRoute /></PrivateRoute>
            } />
            <Route path="/trail/:trailId" element={
                <PrivateRoute><StudentProfileGate><TrailPage /></StudentProfileGate></PrivateRoute>
            } />
            <Route path="/perfil" element={
                <PrivateRoute><StudentRoute><StudentProfilePage /></StudentRoute></PrivateRoute>
            } />
            <Route path="/minha-jornada" element={
                <PrivateRoute><StudentRoute><StudentProfileGate><JourneyPanoramaPage /></StudentProfileGate></StudentRoute></PrivateRoute>
            } />
            <Route path="/resultado-jornada" element={
                <PrivateRoute><StudentRoute><StudentProfileGate><JourneyResultPage /></StudentProfileGate></StudentRoute></PrivateRoute>
            } />

            <Route path="/gestao" element={
                <AdminRoute><AccountManagementPage /></AdminRoute>
            } />
            <Route path="/curadoria-links" element={
                <PrivateRoute><PsychologistRoute><InformationLinkManagementPage /></PsychologistRoute></PrivateRoute>
            } />
            <Route path="/painel-progresso" element={
                <PrivateRoute><PsychologistRoute><ProgressDashboardPage /></PsychologistRoute></PrivateRoute>
            } />
            <Route path="/alunos" element={<Navigate to="/gestao" replace />} />
            <Route path="/alunos/:id" element={
                <PrivateRoute><StaffRoute><StudentDetailPage /></StaffRoute></PrivateRoute>
            } />
            <Route path="/alunos/:id/editar" element={
                <PrivateRoute><StaffRoute><StudentFormPage /></StaffRoute></PrivateRoute>
            } />
            <Route path="/agendamentos" element={
                <PrivateRoute><AgendamentosPage /></PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

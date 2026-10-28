import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage    from '../pages/Login/LoginPage.jsx'
import NewPasswordPage from '../pages/NewPassword/NewPasswordPage.jsx'
import PrivacyPage from '../pages/Institucional/PrivacyPage.jsx'
import TermsPage from '../pages/Institucional/TermsPage.jsx'
import SupportPage from '../pages/Institucional/SupportPage.jsx'
import HomePage     from '../pages/Home/HomePage.jsx'
import TrailPage    from '../pages/Trilha/TrailPage.jsx'
import AccountManagementPage from '../pages/Admin/AccountManagementPage.jsx'
import StudentDetailPage from '../pages/Psicologas/StudentDetailPage.jsx'
import StudentFormPage from '../pages/Psicologas/StudentFormPage.jsx'
import AgendamentosPage from '../pages/Agendamentos/AgendamentosPage.jsx'
import InformationLinkManagementPage from '../pages/Psicologas/InformationLinkManagementPage.jsx'
import JourneyResultPage from '../pages/ResultadoJornada/JourneyResultPage.jsx'
import StudentProfilePage from '../pages/Perfil/StudentProfilePage.jsx'
import StudentProfileGate from '../pages/Perfil/StudentProfileGate.jsx'
import ProgressDashboardPage from '../pages/Psicologas/ProgressDashboardPage.jsx'
import PsychologistClassesPage from '../pages/Psicologas/PsychologistClassesPage.jsx'
import JourneyPanoramaPage from '../pages/Jornada/JourneyPanoramaPage.jsx'
import PsychologistPortalLayout from '../pages/Psicologas/PsychologistPortalLayout.jsx'
import { isAdministrator, isPsychologist } from '../utils/roles.js'

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
    return isPsychologist(user)
        ? <Navigate to="/psicologa" replace />
        : <StudentProfileGate><HomePage /></StudentProfileGate>
}

function AppointmentsRoute() {
    const { user } = useAuth()
    return isPsychologist(user)
        ? <Navigate to="/psicologa/agenda" replace />
        : <AgendamentosPage />
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
            <Route path="/new-password" element={<NewPasswordPage />} />

            {/* Páginas institucionais públicas (linkadas no rodapé) */}
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/suporte" element={<SupportPage />} />
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
            <Route path="/psicologa" element={
                <PrivateRoute><PsychologistRoute><PsychologistPortalLayout /></PsychologistRoute></PrivateRoute>
            }>
                <Route index element={<ProgressDashboardPage />} />
                <Route path="turmas" element={<PsychologistClassesPage />} />
                <Route path="agenda" element={<AgendamentosPage />} />
                <Route path="conteudos" element={<InformationLinkManagementPage />} />
                <Route path="alunos/:id" element={<StaffRoute><StudentDetailPage /></StaffRoute>} />
            </Route>
            <Route path="/curadoria-links" element={
                <Navigate to="/psicologa/conteudos" replace />
            } />
            <Route path="/painel-progresso" element={
                <Navigate to="/psicologa" replace />
            } />
            <Route path="/alunos" element={<Navigate to="/gestao" replace />} />
            <Route path="/alunos/:id" element={
                <PrivateRoute><StaffRoute><StudentDetailPage /></StaffRoute></PrivateRoute>
            } />
            <Route path="/alunos/:id/editar" element={
                <PrivateRoute><StaffRoute><StudentFormPage /></StaffRoute></PrivateRoute>
            } />
            <Route path="/agendamentos" element={<PrivateRoute><AppointmentsRoute /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

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

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/new-password" element={<NewPasswordPage />} />
            <Route path="/home" element={
                <PrivateRoute><HomePage /></PrivateRoute>
            } />
            <Route path="/trail/:trailId" element={
                <PrivateRoute><TrailPage /></PrivateRoute>
            } />

            <Route path="/alunos" element={<AccountManagementPage />} />
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
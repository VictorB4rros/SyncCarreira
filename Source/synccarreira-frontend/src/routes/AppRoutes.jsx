import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage    from '../pages/Login/LoginPage.jsx'
import CadastroPage from '../pages/Cadastro/CadastroPage.jsx'
import HomePage     from '../pages/Home/HomePage.jsx'
import TrailPage    from '../pages/Trilha/TrailPage.jsx'
import StudentListPage from '../pages/psicologas/StudentListPage.jsx'
import StudentDetailPage from '../pages/psicologas/StudentDetailPage.jsx'
import StudentFormPage from '../pages/psicologas/StudentFormPage.jsx'

function PrivateRoute({ children }) {
    const { user } = useAuth()
    return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/home" element={
                <PrivateRoute><HomePage /></PrivateRoute>
            } />
            <Route path="/trail/:trailId" element={
                <PrivateRoute><TrailPage /></PrivateRoute>
            } />

            <Route path="/alunos" element={
                <PrivateRoute><StudentListPage /></PrivateRoute>
            } />
            <Route path="/alunos/:id" element={
                <PrivateRoute><StudentDetailPage /></PrivateRoute>
            } />
            <Route path="/alunos/:id/editar" element={
                <PrivateRoute><StudentFormPage /></PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}
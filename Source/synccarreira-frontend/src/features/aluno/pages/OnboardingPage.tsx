/**
 * @file OnboardingPage.tsx
 * @description Primeiro acesso do aluno: preencher as afinidades libera o Pilar 01 (RF-14).
 * Também atende "Reajustar afinidades" dentro do Espaço do Estudante.
 */
import { Navigate, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react'
import { AffinityForm } from '../components/AffinityForm'
import { Alert, Card, PageHeader } from '../components/ui'
import { useToast } from '../components/ui'
import { useStudent } from '../context/StudentContext'
import { useStudentAuth } from '../context/auth'
import { firstName } from '../lib/labels'
import type { StudentProfileDTO } from '../types'

export function OnboardingPage() {
  const { profile, setProfile } = useStudent()
  const { logout } = useStudentAuth()
  const navigate = useNavigate()
  const toast = useToast()

  if (profile.profileCompleted) return <Navigate to="/aluno" replace />

  function handleSaved(updated: StudentProfileDTO) {
    setProfile(updated)
    toast.success('Afinidades registradas!', 'O Pilar 01 — Autoconhecimento já está liberado.')
    navigate('/aluno', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-container-low to-surface-container px-4 py-8 sm:py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-extrabold text-on-primary">SC</span>
            <span className="text-lg font-bold tracking-tight text-primary">SyncCarreira</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-muted hover:bg-white hover:text-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sair
          </button>
        </div>

        <Card className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Boas-vindas à sua jornada
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Olá{firstName(profile.name) ? `, ${firstName(profile.name)}` : ''}! Antes de começar, conte suas afinidades
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              De 0 a 5, quanto você se identifica com cada grande área? Não existe resposta certa: é só o seu ponto de
              partida. Depois de salvar, o primeiro pilar da jornada é liberado.
            </p>
          </div>

          <AffinityForm onSaved={handleSaved} submitLabel="Salvar e começar a jornada" />
        </Card>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          Suas respostas são confidenciais, protegidas pela LGPD e pelo Código de Ética do CFP.
        </p>
      </div>
    </div>
  )
}

export function AffinitiesPage() {
  const { profile, setProfile } = useStudent()
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <>
      <PageHeader
        eyebrow="Perfil"
        title="Minhas afinidades"
        description="Reajuste quanto você se identifica com cada grande área do conhecimento (0 a 5)."
      />
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <AffinityForm
            initial={profile.affinities}
            onCancel={() => navigate(-1)}
            onSaved={updated => {
              setProfile(updated)
              toast.success('Afinidades atualizadas', 'Seus scores por área foram recalculados.')
              navigate('/aluno')
            }}
          />
        </Card>
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Alert tone="info" title="Como isso é usado?">
            Suas afinidades são somadas aos pontos das respostas em cada área. Ajustá-las muda o seu score atual, mas não
            altera jornadas já concluídas no histórico.
          </Alert>
          <Card className="flex items-start gap-3">
            <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm text-muted">
              Mudou de ideia ao longo das trilhas? Tudo bem: o autoconhecimento é um processo, e reajustar faz parte.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

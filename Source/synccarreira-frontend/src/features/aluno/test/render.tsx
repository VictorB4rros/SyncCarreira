/**
 * Helpers de renderização com Router + Toasts + contexto do aluno já preenchido
 * (sem chamar a API do StudentProvider).
 */
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { ToastProvider } from '../components/ui'
import { StudentContext, type StudentContextValue } from '../context/StudentContext'
import { journeyInProgress, makeProfile, studentUser } from './fixtures'

export function makeStudentContext(overrides: Partial<StudentContextValue> = {}): StudentContextValue {
  return {
    user: studentUser,
    profile: makeProfile(),
    journey: journeyInProgress,
    unreadFeedbacks: 0,
    nextSession: null,
    setProfile: vi.fn(),
    setUnreadFeedbacks: vi.fn(),
    refreshJourney: vi.fn().mockResolvedValue(undefined),
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    refreshSidebar: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function renderWithStudent(
  ui: ReactElement,
  { route = '/', path = '/', context = makeStudentContext() }: { route?: string; path?: string; context?: StudentContextValue } = {},
) {
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <StudentContext.Provider value={context}>
          <Routes>
            <Route path={path} element={ui} />
            <Route path="*" element={<div>rota: fora do teste</div>} />
          </Routes>
        </StudentContext.Provider>
      </ToastProvider>
    </MemoryRouter>,
  )
  return { ...result, context }
}

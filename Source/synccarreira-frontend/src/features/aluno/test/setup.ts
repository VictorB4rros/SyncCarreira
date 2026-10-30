/**
 * Setup global dos testes (Vitest + Testing Library + jsdom).
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

// jsdom não implementa scrollTo
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

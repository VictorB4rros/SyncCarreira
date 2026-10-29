/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Config só dos testes (não altera o build do Vite). CSS não é processado nos testes.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/features/aluno/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx,js,jsx}'],
    css: false,
    restoreMocks: true,
    env: { VITE_TIME_ZONE: 'America/Sao_Paulo' },
    coverage: {
      provider: 'v8',
      include: ['src/features/aluno/**/*.{ts,tsx}'],
      exclude: ['src/features/aluno/test/**', 'src/features/aluno/**/*.test.{ts,tsx}'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
})

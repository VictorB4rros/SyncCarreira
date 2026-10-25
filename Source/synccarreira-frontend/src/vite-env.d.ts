/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Raiz da API, sem /api/v1 (ex.: http://localhost:8080). */
  readonly VITE_API_URL?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_APPOINTMENTS_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

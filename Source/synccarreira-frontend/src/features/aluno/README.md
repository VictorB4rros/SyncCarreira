# Área do Aluno (`/aluno/*`)

Módulo isolado em React + TypeScript + Tailwind CSS v4 + Lucide, com paleta só de roxos.
Montado por `src/routes/AppRoutes.jsx` com `lazy()`; o aluno (ROLE_USER) que entra em `/home` é redirecionado para `/aluno`.

## Telas e endpoints

| Rota | Tela | Endpoints |
|---|---|---|
| `/aluno/boas-vindas` | Primeiro acesso (afinidades 0–5) | `GET/PUT /students/me[/affinities]` |
| `/aluno` | Minha Jornada | `/trails`, `/trails/{id}/can-access`, `/questions/trail/{id}`, `/answers?trailId=`, `/syntheses/me` |
| `/aluno/trilhas` | Minhas trilhas | idem |
| `/aluno/trilhas/:trailId` | Execução do pilar + síntese | `POST/DELETE /answers`, `POST /syntheses`, `GET /information-links/me` (pilar final) |
| `/aluno/resultados[/:journeyId]` | Resultado, PDF, dúvida, nova jornada, histórico | `/journey/result`, `/journeys/me/**`, `/journey/doubt` |
| `/aluno/conteudos` | Hub de Conteúdos | `GET /information-links/me` |
| `/aluno/sessoes` | Minhas sessões | `GET /appointments/student/{id}` |
| `/aluno/feedbacks` | Devolutivas e feedbacks | `GET /feedbacks/me`, `PATCH /feedbacks/{id}/read` |
| `/aluno/afinidades` | Reajustar afinidades | `PUT /students/me/affinities` |

## Isolamento (não afeta as outras áreas)

- Tailwind **sem Preflight** e com `source(none)` + `@source './'`: só gera classes usadas nesta pasta.
- Reset mínimo aplicado só dentro de `.sc-aluno` (via `:where`, especificidade 0).
- Usa a instância axios existente (`services/api.js`) e o `AuthContext` existente sem alterá-los.

## Testes

```bash
npm install          # instala Vitest, Testing Library, jsdom, Tailwind e TypeScript (atualiza o package-lock.json)
npm test             # roda todos os testes uma vez
npm run test:watch   # modo observação, ideal durante o desenvolvimento
npm run test:coverage
npm run typecheck    # checagem de tipos do módulo do aluno
```

Estrutura:

- `__tests__/journey.test.ts`, `format.test.ts`: regras puras (status dos pilares, Likert sem neutro, fuso das sessões).
- `__tests__/studentApi.test.ts`: contrato HTTP (método, rota, body) de cada chamada e tratamento de erros.
- `__tests__/loadJourneyProgress.test.ts`: trilhas bloqueadas não chamam perguntas/respostas (evita 403).
- `__tests__/*Page.test.tsx`, `StudentApp.test.tsx`: telas com a API mockada (`vi.mock('../api/studentApi')`).
- `test/fixtures.ts`: fábricas de DTOs no formato do backend; `test/render.tsx`: render com Router + Toasts + contexto do aluno.

Para testar uma tela nova:

```tsx
vi.mock('../api/studentApi', async importOriginal => ({
  ...(await importOriginal<typeof import('../api/studentApi')>()),
  getMyFeedbacks: vi.fn(),
}))
renderWithStudent(<MinhaTela />, { route: '/aluno/x', path: '/aluno/x' })
```

Prefira buscar por papel e nome acessível (`getByRole('button', { name: ... })`), como o aluno usaria a tela.

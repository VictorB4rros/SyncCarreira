# Contrato de API — SyncCarreira
> Documento atualizado após integração real com o backend.
> Reflete o comportamento confirmado em produção local.

---

## Configuração

| Item | Valor |
|---|---|
| Base URL (dev) | `http://localhost:8080` |
| Autenticação | OAuth2 Password Grant + JWT |
| Header (rotas protegidas) | `Authorization: Bearer <access_token>` |
| Content-Type (login) | `application/x-www-form-urlencoded` |
| Content-Type (demais) | `application/json` |

---

## 1. Login

**`POST /oauth2/token`**

> Autenticação OAuth2 com grant type customizado `password`.
> Requer `Authorization: Basic` com `client_id:client_secret` em Base64.

### Credenciais do cliente (Basic Auth)
| Item | Valor |
|---|---|
| `client_id` | `synccarreira-front-id` |
| `client_secret` | `synccarreira-project-2026` |
| Header gerado | `Authorization: Basic c3luY2NhcnJlaXJhLWZyb250LWlkOnN5bmNjYXJyZWlyYS1wcm9qZWN0LTIwMjY=` |

### Request Body (form-urlencoded)
```
grant_type=password&username=ana@email.com&password=minhasenha123
```

### Response `200 OK`
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 18000
}
```

### Erros esperados
| Status | Quando |
|---|---|
| `401` | Credenciais do cliente inválidas |
| `400` | `invalid_request` — grant_type ausente ou inválido |
| `400` | `invalid_grant` — usuário/senha incorretos |

---

## 2. Cadastro

**`POST /users`**

> Rota pública — não requer autenticação.
> Senha deve ter no mínimo **8 caracteres**.
> Após cadastro, redirecionar para `/login` (backend não retorna token).

### Request Body — Perfil Aluno
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "minhasenha123",
  "roleId": 1
}
```

### Request Body — Perfil Psicóloga
```json
{
  "name": "Dra. Maria",
  "email": "maria@escola.com",
  "password": "minhasenha123",
  "roleId": 2
}
```

### Response `201 Created`
```json
{
  "id": 6,
  "name": "João Silva",
  "email": "joao@email.com",
  "roles": [
    { "id": 1, "authority": "ROLE_USER" }
  ]
}
```

### Erros esperados
| Status | Quando |
|---|---|
| `422` | Dados inválidos (ex: senha com menos de 8 caracteres) |
| `409` | E-mail já cadastrado |

### Formato de erro de validação (422)
```json
{
  "timestamp": "2026-05-11T17:55:37Z",
  "status": 422,
  "error": "Dados inválidos",
  "path": "/users",
  "errors": [
    { "fieldName": "password", "message": "Deve ter no mínimo 8 caracteres" }
  ]
}
```

---

## 3. Usuário autenticado

**`GET /users/me`**
> Requer: `Authorization: Bearer <access_token>`

### Response `200 OK`
```json
{
  "id": 6,
  "name": "João Silva",
  "email": "joao@email.com",
  "roles": [
    { "id": 1, "authority": "ROLE_USER" }
  ]
}
```

### Erros esperados
| Status | Quando |
|---|---|
| `401` | Token ausente, inválido ou expirado |

---

## 4. Buscar usuário por ID

**`GET /users/{id}`**
> Requer: `Authorization: Bearer <access_token>`

### Response `200 OK`
```json
{
  "id": 6,
  "name": "João Silva",
  "email": "joao@email.com",
  "roles": [
    { "id": 1, "authority": "ROLE_USER" }
  ]
}
```

### Erros esperados
| Status | Quando |
|---|---|
| `404` | Usuário não encontrado |
| `401` | Token ausente ou inválido |

---

## 5. Logout

> O backend **não possui endpoint de logout**.
> O logout é feito apenas localmente, removendo o `access_token` do `localStorage`.
> O token continua válido no servidor até expirar (duração padrão: 18000 segundos / 5 horas).

---

## Padrão de erros

Erros gerais seguem o formato:
```json
{
  "timestamp": "2026-05-11T23:58:27.462Z",
  "status": 404,
  "error": "Descrição do erro",
  "path": "/users/99"
}
```

Erros de validação incluem o campo `errors`:
```json
{
  "timestamp": "2026-05-11T23:59:54.112Z",
  "status": 422,
  "error": "Dados inválidos",
  "path": "/users",
  "errors": [
    { "fieldName": "password", "message": "Deve ter no mínimo 8 caracteres" }
  ]
}
```

---

## Mapeamento de roles

| `roleId` (cadastro) | `authority` (resposta) | Descrição |
|---|---|---|
| `1` | `ROLE_USER` | Aluno |
| `2` | _(a confirmar — authority `ROLE_PSICOLOGA`)_ | Psicóloga |

---

## Normalização frontend

O backend usa campos em inglês. O frontend normaliza internamente no `authService.js`:

| Backend | Frontend |
|---|---|
| `name` | `nome` |
| `access_token` | `token` (localStorage) |
| `roles[0].authority` | `perfil` |
---

## 6. Agendamentos (RF-08 / RF-16)

> **Status:** o front já está pronto. O backend possui a entidade `Appointment`
> (`tb_agendamento`), mas ainda **não** expõe os endpoints abaixo.
> Enquanto isso, use `VITE_APPOINTMENTS_MOCK=true` no `.env` (salva no localStorage).

### Como a integração com o Google funciona

A criação do evento no Google Agenda + link do Meet é feita **pelo front**, com a
conta Google da psicóloga (OAuth Google Identity Services, escopo
`https://www.googleapis.com/auth/calendar.events`). Os alunos entram como
convidados do evento (`attendees`) e o Google envia o convite/atualização/cancelamento
para o e-mail de cada aluno (`sendUpdates=all`).

O backend só **persiste** a sessão, incluindo os dados devolvidos pelo Google
(`googleEventId`, `meetLink`, `calendarLink`). Nenhum segredo do Google vai para o backend.

### Objeto `AppointmentDTO` (resposta)

```json
{
  "id": 12,
  "title": "Conversa sobre a trilha Autoconhecimento",
  "description": "Traga suas dúvidas sobre as áreas de interesse.",
  "dateTime": "2026-10-01T14:00:00",
  "durationMinutes": 50,
  "scheduleType": "INDIVIDUAL",
  "scheduleStatus": "AGENDADA",
  "psychologist": { "id": 2, "name": "Fernanda Castro", "email": "fernanda@gmail.com" },
  "students": [
    { "id": 1, "name": "João Silva", "email": "joao@gmail.com" }
  ],
  "googleEventId": "7l3k2j1h0g9f8e7d6c5b4a",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "calendarLink": "https://www.google.com/calendar/event?eid=...",
  "feedback": null,
  "feedbackDate": null,
  "cancelReason": null
}
```

| Campo | Valores |
|---|---|
| `scheduleType` | `INDIVIDUAL` \| `GRUPO` |
| `scheduleStatus` | `AGENDADA` \| `CANCELADA` \| `REALIZADA` |
| `dateTime` | `LocalDateTime` sem fuso (horário local) |

### Corpo de criação/edição (`AppointmentInsertDTO`)

```json
{
  "title": "Conversa sobre a trilha Autoconhecimento",
  "description": "Traga suas dúvidas.",
  "dateTime": "2026-10-01T14:00:00",
  "durationMinutes": 50,
  "scheduleType": "GRUPO",
  "psychologistId": 2,
  "studentIds": [1, 5, 8],
  "googleEventId": "7l3k2j1h0g9f8e7d6c5b4a",
  "meetLink": "https://meet.google.com/abc-defg-hij",
  "calendarLink": "https://www.google.com/calendar/event?eid=..."
}
```

Validações sugeridas: `dateTime` no futuro; `INDIVIDUAL` = exatamente 1 aluno;
`GRUPO` = 2 ou mais; contrato da psicóloga válido (`validateIfContractIsActive`).

### Endpoints

| Método | Rota | Quem | Corpo | Resposta |
|---|---|---|---|---|
| `GET` | `/appointments/psychologist/{id}` | psicóloga | — | `AppointmentDTO[]` |
| `GET` | `/appointments/student/{id}` | aluno | — | `AppointmentDTO[]` |
| `POST` | `/appointments` | psicóloga | `AppointmentInsertDTO` | `201` + `AppointmentDTO` |
| `PUT` | `/appointments/{id}` | psicóloga | `AppointmentInsertDTO` | `200` + `AppointmentDTO` |
| `PATCH` | `/appointments/{id}/cancel` | psicóloga | `{ "cancelReason": "..." }` | `200` + `AppointmentDTO` (status `CANCELADA`) |
| `PUT` | `/appointments/{id}/feedback` | psicóloga | `{ "feedback": "..." }` | `200` + `AppointmentDTO` (status `REALIZADA`, `feedbackDate` = agora) |

### Mudanças necessárias na entidade `Appointment`

A entidade atual tem `dateTime`, `scheduleType`, `scheduleStatus`, `student` (ManyToOne) e `psychologist`.
Para suportar o front:

- trocar `student` (ManyToOne) por `students` (**ManyToMany**, tabela `tb_agendamento_aluno`) — sessões em grupo;
- adicionar colunas: `titulo`, `descricao`, `duracao_minutos`, `google_event_id`, `link_meet`,
  `link_calendar`, `feedback` (TEXT), `data_feedback`, `motivo_cancelamento`;
- liberar as rotas `/appointments/**` no `ResourceServerConfig`.

### Configurando o Google (uma vez)

1. Acesse <https://console.cloud.google.com/> e crie um projeto (ex.: *SyncCarreira*).
2. **APIs e serviços → Biblioteca** → ative a **Google Calendar API**.
3. **Tela de consentimento OAuth** → tipo *Externo* → preencha nome/e-mail →
   em *Escopos* adicione `.../auth/calendar.events` → em *Usuários de teste*
   adicione o e-mail Google da(s) psicóloga(s) (enquanto o app estiver em modo "Teste").
4. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**.
   Em *Origens JavaScript autorizadas* adicione:
   - `http://localhost:5173` (dev)
   - `https://synccarreira.duckdns.org` (produção)
5. Copie o *Client ID* para `VITE_GOOGLE_CLIENT_ID` nos arquivos `.env.*` e reinicie o `yarn dev`.

> O e-mail do **aluno** cadastrado no SyncCarreira é o que recebe o convite.
> Se for uma conta Google, o evento aparece automaticamente no Google Agenda dele.

### Mapeamento de roles (tela de agendamentos)

| `authority` | Visão em `/agendamentos` |
|---|---|
| `ROLE_PSICOLOGA` | Psicóloga — criar, editar, cancelar sessões e enviar feedback (RF-08) |
| `ROLE_USER` | Aluno — ver agendamentos e feedbacks (RF-16) |

Definido em `src/utils/roles.js`.
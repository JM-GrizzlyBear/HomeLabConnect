# HomeLabConnect

A learning project for multi-role authentication and profile management (admin, med_team, patient, support, doctor), built with Clean Architecture and a typed end-to-end stack.

| Layer       | Tech                                          |
| ----------- | --------------------------------------------- |
| Frontend    | Next.js 14 (planned) + React + TanStack Query |
| Transport   | oRPC                                          |
| Backend     | Node.js + Express 4                           |
| Persistence | Postgres 16 + Drizzle ORM                     |
| Auth        | JWT + bcrypt                                  |
| Container   | Docker + Docker Compose                       |
| Workspace   | pnpm + Turborepo                              |

---

## Current project status

- API is implemented and runnable.
- Shared contracts package is implemented.
- Client and web app folders are currently empty placeholders.

---

## Folder structure

```
.
├── apps
│   ├── api
│   │   ├── drizzle
│   │   ├── src
│   │   ├── Dockerfile
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── client
│   └── web
├── packages
│   └── shared
│       ├── src
│       ├── package.json
│       └── tsconfig.json
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
└── .env.example
```

---

## Prerequisites

Install these once on your machine:

```bash
node -v
corepack enable
corepack prepare pnpm@9.12.0 --activate
docker ps
```

---

## First-time setup

### 1) Install dependencies

```bash
pnpm install
```

### 2) Create your env file

```bash
cp .env.example .env
```

### 3) Edit your `.env` for local API development

Use localhost for local machine runs:

```env
DATABASE_URL=postgres://homelabconnect:homelabconnectpass@localhost:5433/homelabconnect
```

Optional but recommended:

```env
PORT=4000
CORS_ORIGIN=http://localhost:3001
```

Notes:

- The API reads `PORT` from environment.
- The default `.env.example` `DATABASE_URL` points to `db` host, which is for container networking.

### 4) Start Postgres only

```bash
docker compose up -d db
docker compose ps
```

### 5) Generate and apply migrations

```bash
turbo run db:generate --filter=@homelabconnect/api
turbo run db:migrate --filter=@homelabconnect/api
```

### 6) Seed sample data

```bash
turbo run db:seed --filter=@homelabconnect/api
```

### 7) Run the API

```bash
turbo run dev --filter=@homelabconnect/api
```

Expected API URL:

```text
http://localhost:4000
```

---

## Verify it works

### Health check

```bash
curl http://localhost:4000/health
```

### Register a patient

```bash
curl -X POST http://localhost:4000/rpc/auth/register \
	-H "content-type: application/json" \
	-d '{"email":"demo.patient@homelabconnect.local","password":"patient123","firstName":"Demo","lastName":"Patient"}'
```

### Login

```bash
curl -X POST http://localhost:4000/rpc/auth/login \
	-H "content-type: application/json" \
	-d '{"email":"patient01@homelabconnect.local","password":"patient123"}'
```

Copy the token from login response.

### Get current user profile

```bash
curl http://localhost:4000/rpc/auth/me \
	-H "authorization: Bearer YOUR_TOKEN"
```

---

## Available API route groups

- `auth`
- `role`
- `patient`

Examples:

- auth register/login/me
- role list/create/update
- patient create/update profile

---

## Seeded demo accounts

Patient sample:

```text
patient01@homelabconnect.local / patient123
```

Staff samples:

```text
admin@homelabconnect.local / admin123
medteam@homelabconnect.local / medteam123
doctor@homelabconnect.local / doctor123
support@homelabconnect.local / support123
```

---

## Common commands

Run API dev server:

```bash
turbo run dev --filter=@homelabconnect/api
```

Typecheck API:

```bash
turbo run typecheck --filter=@homelabconnect/api
```

Generate migration:

```bash
turbo run db:generate --filter=@homelabconnect/api
```

Migrate DB:

```bash
turbo run db:migrate --filter=@homelabconnect/api
```

Seed DB:

```bash
turbo run db:seed --filter=@homelabconnect/api
```

Start DB only:

```bash
docker compose up -d db
```

Stop all services:

```bash
docker compose down
```

Reset DB volume:

```bash
docker compose down -v
```

---

## Troubleshooting

Database connection refused:

- Make sure Postgres container is running.
- Verify `POSTGRES_PORT` is `5433` in `.env`.
- Verify `DATABASE_URL` uses `localhost:5433` for local API runs.

JWT secret error:

- Set `JWT_SECRET` in `.env` with a value at least 16 characters long.

CORS errors:

- Ensure `CORS_ORIGIN` in `.env` matches your frontend URL.

Docker full-stack startup fails:

- Client and web app are not implemented yet, so API + DB local workflow is currently the supported path.

---

## Database and seed coverage

The API uses Drizzle ORM with PostgreSQL. The schema now covers the complete appointment workflow:

| Area                  | Tables                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Identity and profiles | `roles`, `users`, `patients`, `doctors`, `med_team_members`, `support_agents`, `admins`                                             |
| Availability          | `med_team_shifts`, `med_team_shift_overrides`, `support_shifts`, `support_shift_overrides`                                          |
| Laboratory workflow   | `lab_procedures`, `appointments`, `appointment_procedures`, `appointment_assignments`, `reschedule_proposals`, `appointment_events` |
| Chat and delivery     | `chat_conversations`, `chat_participants`, `chat_messages`, `notifications`                                                         |
| Platform and security | `sessions`, `audit_logs`, `permissions`, `role_permissions`, `user_permission_overrides`                                            |

Procedure prices are stored as integer minor units. Date-times are timezone-aware; recurring shift times are local `time` values and currently assume the service area's timezone.

### Recommended database workflow

Run commands from the repository root:

```bash
docker compose up -d db
turbo run db:generate --filter=@homelabconnect/api
turbo run db:migrate --filter=@homelabconnect/api
turbo run db:seed --filter=@homelabconnect/api
turbo run typecheck --filter=@homelabconnect/api
```

`db:generate` compares the Drizzle schema with migration metadata and creates a SQL migration. `db:migrate` applies pending migrations. `db:seed` inserts demo records in dependency order and is designed to be rerunnable.

The seed order is:

```text
roles -> users -> profiles -> schedules -> lab procedures -> appointments ->
appointment history -> chat -> notifications/sessions/audit logs -> permissions
```

The fixture data includes doctor, support, and admin profiles; recurring and one-off schedules; blood, urine, and X-ray procedures; an accepted appointment with an assignment and event history; a support chat; a notification; a demo session; an audit record; and role/user permission examples.

To inspect the data interactively:

```bash
turbo run db:studio --filter=@homelabconnect/api
```

To reset the local database and rebuild it from migrations and seeds:

```bash
docker compose down -v
docker compose up -d db
turbo run db:migrate --filter=@homelabconnect/api
turbo run db:seed --filter=@homelabconnect/api
```

Appointment, chat, and notification persistence is ready for application services. Their CRUD and workflow routers are the next API layer to implement.

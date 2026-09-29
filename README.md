# HomeLabConnect

A home laboratory service platform. Patients book lab procedures online and a medical team comes to their home to collect samples. Doctors review and release results, support staff handle patient tickets, and admins run the business: staff, schedules, pricing, payments and reports.

Patients pay online with **Stripe** (card) or in **cash** when the team arrives. Lab results stay locked until the appointment is fully paid.

> - Full system documentation: [docs/SYSTEM.md](docs/SYSTEM.md)
> - Backend architecture (Clean Architecture): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Tech stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | React 19 + Vite, Tailwind CSS v4, TypeScript |
| Backend        | Node.js 24 + Express 5, TypeScript           |
| Database       | PostgreSQL 16 + Drizzle ORM                  |
| Payments       | Stripe (Checkout + Webhooks + Refunds)       |
| Authentication | JWT + bcrypt                                 |
| Email          | Nodemailer (Mailpit for local testing)       |
| Real-time      | Server-Sent Events (SSE)                     |
| Monorepo       | pnpm workspaces + Turborepo                  |
| DevOps         | Docker Compose, GitHub Actions               |

## Project structure

```
.
├── apps
│   ├── api          Express backend (Clean Architecture: domain → application → interface → infrastructure)
│   └── client       React + Vite + Tailwind frontend
├── packages
│   └── shared       Zod schemas and types shared by api and client
├── docs             System documentation and architecture
├── docker-compose.yml
└── turbo.json       Task pipeline
```

## Prerequisites

- Node.js 24 (`.nvmrc`), with corepack enabled: `corepack enable`
- Turborepo CLI: `pnpm add -g turbo`
- Docker Desktop

## Getting started

`pnpm i` is only used to install packages — every other command runs through **turbo**.

```bash
pnpm i                         # install dependencies
cp .env.example .env           # local settings
docker compose up -d           # Postgres + Mailpit
turbo run db:migrate           # apply database migrations
turbo run db:seed              # seed data
turbo run dev                  # API http://localhost:4000 + client http://localhost:5173
```

| Service       | URL                              |
| ------------- | -------------------------------- |
| Client        | http://localhost:5173            |
| API health    | http://localhost:4000/api/health |
| Mailpit inbox | http://localhost:8025            |

## Common tasks

| Command                                      | What it does                                         |
| -------------------------------------------- | ---------------------------------------------------- |
| `turbo run dev`                              | Run API and client together (watch mode)             |
| `turbo run dev --filter=@homelabconnect/api` | Run only the API                                     |
| `turbo run lint typecheck arch test`         | All checks (cached — repeat runs are instant)        |
| `turbo run build`                            | Production build of every package                    |
| `turbo run db:generate`                      | Create a migration after changing the Drizzle schema |
| `turbo run db:migrate` / `turbo run db:seed` | Apply migrations / seed data                         |
| `turbo run format`                           | Format the repo with Prettier                        |

`arch` checks the Clean Architecture dependency rule — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

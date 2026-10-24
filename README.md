# HomeLabConnect

A home laboratory service platform. Patients book lab procedures online and a medical team comes to their home to collect samples. Doctors review and release results, support staff handle patient tickets, and admins run the business: staff, schedules, pricing, payments and reports.

Patients pay online with **Stripe** (card) or in **cash** when the team arrives. Lab results stay locked until the appointment is fully paid.

> - Full system documentation: [docs/SYSTEM.md](docs/SYSTEM.md)
> - Backend architecture (Clean Architecture): [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Tech stack

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| Frontend       | React 19 + Vite, Tailwind CSS v4, TanStack Query, TypeScript |
| Backend        | Node.js 24 + Express 5, TypeScript                           |
| Database       | PostgreSQL 16 + Drizzle ORM                                  |
| Payments       | Stripe (Checkout + Webhooks + Refunds)                       |
| Authentication | express-session cookies + bcrypt                             |
| Email          | Nodemailer (Mailpit for local testing)                       |
| Images         | Cloudinary (a local folder in development)                   |
| Hosting        | Netlify (website), Render (API), Neon (Postgres)             |
| Real-time      | Server-Sent Events (SSE)                                     |
| Monorepo       | pnpm workspaces + Turborepo                                  |
| DevOps         | Docker Compose, GitHub Actions                               |

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
docker compose up -d postgres mailpit   # Postgres (port 5436) + Mailpit
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

| Command                                      | What it does                                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `turbo run dev`                              | Run API and client together (watch mode)                                                                                   |
| `turbo run dev --filter=@homelabconnect/api` | Run only the API                                                                                                           |
| `turbo run lint typecheck arch test`         | All checks (cached — repeat runs are instant). API integration tests need Postgres running; they use `homelabconnect_test` |
| `turbo run build`                            | Production build of every package                                                                                          |
| `turbo run db:generate`                      | Create a migration after changing the Drizzle schema                                                                       |
| `turbo run db:migrate` / `turbo run db:seed` | Apply migrations / seed data                                                                                               |
| `turbo run format`                           | Format the repo with Prettier                                                                                              |

`arch` checks the Clean Architecture dependency rule — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Deploying

The website runs on **Netlify**, the API on **Render** (Docker) and the database on **Neon**. Netlify forwards `/api/*` to Render, so the browser only talks to the Netlify address: the session cookie is first-party and no CORS is needed. Photos go to **Cloudinary**, because Render's disk is wiped on every deploy.

### 1. Neon (database)

1. Create a project at [neon.tech](https://neon.tech) (region: Singapore, closest to the Philippines).
2. Copy the connection string **without** `-pooler` in the host, and end it with `?sslmode=verify-full` (Neon shows `require`; `verify-full` is the same check without the driver's warning):
   `postgres://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full`
3. The tables are created by the API on its first start (it applies the migrations). To add the seed data (permission catalogue, admin account and sample data), run once from your machine: `DATABASE_URL="<neon url>" turbo run db:seed`.

### 2. Cloudinary (photos)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free plan).
2. Dashboard → **API environment variable**: `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`.

### 3. Render (API)

1. **New → Web Service**, connect this repository, **Language: Docker** (it uses the root `Dockerfile`), region Singapore.
2. **Health check path:** `/api/health`. **Auto-Deploy:** off (deploys go through the GitHub workflow).
3. **Environment variables:**

   | Name                                                            | Value                                                                             |
   | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
   | `DATABASE_URL`                                                  | the Neon connection string                                                        |
   | `SESSION_SECRET`                                                | a long random string: `openssl rand -hex 32`                                      |
   | `TRUST_PROXY`                                                   | `2` (Netlify's proxy, then Render's)                                              |
   | `APP_URL`                                                       | your Netlify address, e.g. `https://homelabconnect.netlify.app` (links in emails) |
   | `PHOTO_STORAGE`                                                 | `cloudinary`                                                                      |
   | `CLOUDINARY_URL`                                                | the Cloudinary API environment variable                                           |
   | `CLOUDINARY_FOLDER`                                             | `homelabconnect`                                                                  |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | your mail provider (e.g. Brevo SMTP)                                              |

4. **Settings → Deploy Hook**: copy the URL (for GitHub below).

### 4. Netlify (website)

1. **Add new site → Import an existing project**, pick this repository. Netlify reads `netlify.toml` (build command and publish folder).
2. In `netlify.toml`, set the `/api/*` redirect to your Render address (`https://<service>.onrender.com/api/:splat`).
3. **Site configuration → Build & deploy → Build hooks → Add build hook**: copy the URL. Turn off automatic builds if you only want to deploy through the workflow.

### 5. GitHub

**Settings → Secrets and variables → Actions → New repository secret**:

| Secret               | Used by                                                |
| -------------------- | ------------------------------------------------------ |
| `RENDER_DEPLOY_HOOK` | `Deploy` workflow: redeploys the API                   |
| `NETLIFY_BUILD_HOOK` | `Deploy` workflow: rebuilds the website                |
| `DATABASE_URL`       | `Clear database` workflow (the Neon connection string) |

**Actions → Deploy → Run workflow** runs the checks, then deploys the API (which applies new migrations) and the website.

### Clearing a database

**Actions → Clear database → Run workflow**, type `CLEAR`. It empties every table of the `DATABASE_URL` database (the tables stay) and runs the seed again, so the permission catalogue and seeded accounts come back.

### Trying the production image locally

`docker compose --profile api up --build` runs the API image on http://localhost:8080 against the local Postgres (it applies the migrations first).

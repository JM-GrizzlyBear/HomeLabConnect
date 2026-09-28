# HomeLabConnect

A home laboratory service platform. Patients book lab procedures online and a medical team comes to their home to collect samples. Doctors review and release results, support staff handle patient tickets, and admins run the business: staff, schedules, pricing, payments and reports.

Patients pay online with **Stripe** (card) or in **cash** when the team arrives. Lab results stay locked until the appointment is fully paid.

> Full system documentation: [docs/SYSTEM.md](docs/SYSTEM.md)

## Tech stack

| Layer          | Technology                             |
| -------------- | -------------------------------------- |
| Frontend       | React 18 + Vite, Tailwind CSS          |
| Backend        | Node.js 20 + Express 4                 |
| Database       | PostgreSQL 16                          |
| Payments       | Stripe (Checkout + Webhooks + Refunds) |
| Authentication | JWT + bcrypt                           |
| Email          | Nodemailer (Mailpit for local testing) |
| Real-time      | Server-Sent Events (SSE)               |
| File storage   | MinIO (S3-compatible)                  |
| DevOps         | Docker Compose, pnpm workspaces        |

## Project structure

```
.
├── apps
│   ├── api          Node.js + Express backend (Clean Architecture)
│   └── client       React + Vite + Tailwind frontend
├── packages
│   └── shared       Validation schemas and types shared by api and client
├── docs             System documentation and database diagrams
└── docker-compose.yml
```

## Getting started

```bash
pnpm install
cp .env.example .env
docker compose up -d        # Postgres, Mailpit, MinIO
pnpm db:migrate
pnpm db:seed
pnpm api                    # http://localhost:4000
pnpm client                 # http://localhost:5173

# Forward Stripe webhooks to the local API
stripe listen --forward-to localhost:4000/api/payments/webhook
```

See [docs/SYSTEM.md](docs/SYSTEM.md) for roles, modules, the payment flow, the database design and seeded accounts.

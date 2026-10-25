# HomeLabConnect — System Documentation

## 1. Overview

HomeLabConnect is a home laboratory service platform. Patients book lab procedures online and a medical team comes to their home to collect samples. Doctors review and release results. Support staff handle patient tickets, and admins run the business: staff, schedules, pricing, payments and reports.

Patients pay online with **Stripe** (card) or in **cash** when the team arrives. Lab results stay locked until the appointment is fully paid.

---

## 2. Technology Stack

| Layer          | Technology                                  | Purpose                                         |
| -------------- | ------------------------------------------- | ----------------------------------------------- |
| Frontend       | React 19 + Vite, TypeScript, TanStack Query | Single-page web app for every role, cached data |
| Styling        | Tailwind CSS v4                             | Utility-first styling, responsive layouts       |
| Backend        | Node.js 24 + Express 5, TypeScript          | REST API, business logic, background jobs       |
| Database       | PostgreSQL 16 + Drizzle ORM                 | Relational data storage (47 tables), migrations |
| Payments       | Stripe (Checkout + Webhooks + Refunds)      | Online card payments and refunds                |
| Authentication | express-session + bcrypt                    | httpOnly session cookie, sessions in Postgres   |
| Email          | Nodemailer (Mailpit for local testing)      | Temporary passwords and notification emails     |
| Real-time      | Server-Sent Events (SSE)                    | Live notification bell                          |
| Images         | Cloudinary (local folder in development)¹   | Profile photos; later attachments               |
| Hosting        | Netlify, Render (Docker), Neon              | Website, API, managed Postgres                  |
| DevOps         | Docker, GitHub Actions, pnpm, Turborepo     | API image, CI/deploy workflows, task pipeline   |

¹ Behind the `PhotoStorage` port, so result files (PDFs) can use Cloudinary or another store when the Results module arrives.

---

## 3. User Roles

| Role         | What they do                                                                            |
| ------------ | --------------------------------------------------------------------------------------- |
| **Patient**  | Registers, books home visits, pays, tracks appointments, views results, opens tickets   |
| **Med Team** | Receives assigned visits, follows daily routes, collects samples, records cash payments |
| **Doctor**   | Reviews collected samples and uploads/releases lab results                              |
| **Support**  | Handles support tickets and chats (auto-assigned to agents currently on shift)          |
| **Admin**    | Manages users, roles, permissions, procedures, promotions, schedules, payments, reports |

Admins can create **custom roles** (e.g. _Senior Med Tech_, _President_) on top of a base role. Access is checked per permission (`<module>.<action>`, e.g. `payments.refund`) in this order:
user override → custom role grant → base role grant → deny. The full catalogue and rules are in [PERMISSIONS.md](PERMISSIONS.md).

---

## 4. System Modules

1. **Authentication & Accounts:** login, patient self-registration, staff accounts created with an emailed temporary password (valid for 7 days, must be changed on first login, reissued by an admin once expired), session revocation, profile editing, password change, account deactivation.
2. **Roles & Permissions:** base and custom roles, 21 modules and 67 permissions, per-user temporary overrides.
3. **Lab Procedure Catalog:** procedures, categories, prices and promotions/discounts.
4. **Scheduling & Teams:** shifts set month by month on a calendar, leave requests (team lead → admin for med team; admin for everyone else), med teams and two-week rosters. See [erd/scheduling.md](erd/scheduling.md).
5. **Appointments:** patient booking with live sale prices and open slots (one visit per med team on duty per slot), staff accept/reject, new-time proposals the patient accepts or declines, cancellation, and emails at each step team assignment (manual or automatic), and the med team's My Visits with sample collection (built: slices 5A–5C). Still to come: daily routes, return visits, notes and attachments. See [erd/appointments.md](erd/appointments.md).
6. **Results:** doctors upload result files and patients view or download them. Results are **held until the appointment is paid**.
7. **Payments (Stripe + Cash):** online checkout, cash recording, refunds and a payment list with export.
8. **Support Desk:** patient help desk, tickets auto-assigned to on-shift agents, ticket chat.
9. **Notifications:** in-app bell with real-time updates (SSE) and key emails (booking accepted/rejected, new time proposed, result released, payment received/refunded).
10. **Audit Logs:** appointment and sign-in events.
11. **Reports & Dashboard:** operations reports, saved report filters, today's counts on the staff dashboard.
12. **System Settings:** visit days and hours, slot length, minimum notice, booking window, cancellation cut-off, daily team capacity, booking approval (staff or automatic) and team assignment (manual or auto); holidays and special days off that close dates for booking. See [erd/settings.md](erd/settings.md).

---

## 5. Payment Flow (Stripe)

### 5.1 Online payment (card)

1. The patient books an appointment and clicks **Pay now**.
2. The backend creates a **Stripe Checkout Session** (currency `php`, amount in centavos) and saves a `payments` row with status `pending` and the session ID as `provider_reference`.
3. The patient is redirected to Stripe's hosted checkout page and pays.
4. Stripe redirects the patient back to the app (success or cancel URL).
5. Stripe sends a **webhook** (`checkout.session.completed`) to `POST /api/payments/webhook`.
6. The backend verifies the webhook signature with `STRIPE_WEBHOOK_SECRET`, stores the event in `payment_webhook_events` (ignoring duplicates), and marks the payment `paid`.
7. The patient gets a "Payment received" notification, and results unlock once the appointment is fully paid.

### 5.2 Cash payment

- The med team records a cash payment during the visit (`payments.record_cash` permission).
- The payment is saved with `provider = cash` and status `paid`.

### 5.3 Refunds

- An admin issues a full or partial refund (`payments.refund` permission).
- Stripe payments are refunded through the **Stripe Refunds API**. Cash refunds are recorded manually.
- Status becomes `refunded` or `partially_refunded`, and the patient is notified.

### 5.4 Payment statuses

`pending` → `paid` → `partially_refunded` / `refunded`
`pending` → `failed` / `expired`

---

## 6. System Architecture

```
[ React + Tailwind (browser) ]
            │  HTTPS / JSON (httpOnly session cookie)
            ▼
[ Netlify: website, forwards /api/* ]
            │
            ▼
[ Node.js + Express API (Render) ] ──► [ PostgreSQL (Neon) ]
      │        │   │
      │        │   └────────► [ Cloudinary: photos ]
      │        └────────────► [ SMTP / Mailpit: emails ]
      ▼
[ Stripe API ] ◄── webhooks ── Stripe
```

The backend follows **Clean Architecture** (Uncle Bob). Dependencies point inward only, and `turbo run arch` enforces this. See [ARCHITECTURE.md](ARCHITECTURE.md) for the full rules and the recipe for adding a feature.

- **Domain (Entities):** business objects, rules and business errors
- **Application (Use Cases):** use cases and ports (interfaces)
- **Interface (Interface Adapters):** controllers, presenters and middleware (auth, permissions), with no framework code
- **Infrastructure (Frameworks & Drivers):** Express, database, Stripe, email and storage implementations
- **buildApp.ts:** the composition root that wires everything together; `main.ts` reads the settings and starts the server

### Folder structure

```
.
├── apps
│   ├── api                 Node.js + Express backend
│   │   └── src
│   │       ├── domain          (entities)
│   │       ├── application     (use cases, ports)
│   │       ├── interface       (controllers, presenters, middleware)
│   │       ├── infrastructure  (http, db, stripe, mail, storage)
│   │       ├── buildApp.ts     (composition root)
│   │       └── main.ts         (starts the server)
│   └── client              React + Vite + Tailwind frontend
├── packages
│   └── shared              Validation schemas and types shared by api and client
├── docs/erd                Database diagrams
└── docker-compose.yml
```

---

## 7. Database Design (PostgreSQL)

| Domain                          | Tables                                                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity & access               | users, roles, custom_roles, modules, permissions, role_permissions, custom_role_permissions, user_permission_overrides, session, audit_logs                                                                                              |
| People, scheduling & teams      | patients, employees, doctors, med_team_members, support_agents, employee_shift_days, leave_requests, leave_decisions, holidays, med_teams, team_rosters, team_roster_members, system_settings                                            |
| Catalog & pricing               | procedure_categories, lab_procedures, promotions, promotion_procedures                                                                                                                                                                   |
| Appointments, results & routing | appointments, appointment_procedures, appointment_assignments, reschedule_proposals, appointment_events, appointment_notes, appointment_attachments, result_files, appointment_reviews, promotion_redemptions, daily_routes, route_stops |
| Payments, support & reports     | payments, payment_webhook_events, support_tickets, chat_conversations, chat_participants, chat_messages, notifications, saved_reports                                                                                                    |

**Conventions**

- Money is stored as integers in centavos (`85000` = ₱850.00), which is also the unit Stripe uses.
- Timestamps are timezone-aware (`timestamptz`).
- `payments.provider_reference` is unique (Stripe session/payment intent ID).
- `payment_webhook_events.provider_event_id` is unique so a webhook is never processed twice.

---

## 8. Environment Variables

```env
# Database
DATABASE_URL=postgres://homelabconnect:homelabconnectpass@localhost:5436/homelabconnect

# Auth (session cookies, stored in Postgres)
SESSION_SECRET=change-me-to-a-long-random-string-32-plus
SESSION_TTL_MINUTES=720
# HTTPS-only cookie; defaults to true when NODE_ENV=production
# COOKIE_SECURE=false
# How many proxies sit in front of the API (2 on Render behind Netlify); 0 locally
# TRUST_PROXY=2

# Photos: "local" keeps them in apps/api/uploads; "cloudinary" uses CLOUDINARY_URL
PHOTO_STORAGE=local
# CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# CLOUDINARY_FOLDER=homelabconnect

# Server
PORT=4000
APP_URL=http://localhost:5173

# Frontend (Vite). The client calls /api on its own address: Vite forwards it to the API in
# development, Netlify to Render in production, so no API URL is needed.
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
# A real provider (Brevo: smtp-relay.brevo.com:587) needs a login; Mailpit doesn't
# SMTP_USER=
# SMTP_PASS=
MAIL_FROM="HomeLabConnect <no-reply@homelabconnect.local>"
```

---

## 9. Running the System Locally

```bash
# 1. Install dependencies (pnpm is only used for installing)
pnpm i

# 2. Create env file
cp .env.example .env

# 3. Start Postgres and Mailpit (inbox: http://localhost:8025)
docker compose up -d postgres mailpit

# 4. Create tables and seed data
turbo run db:migrate
turbo run db:seed

# 5. Run backend and frontend together
turbo run dev   # API http://localhost:4000, client http://localhost:5173

# 6. Forward Stripe webhooks to your local API (second terminal)
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook
# copy the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

### Stripe test cards

| Card number         | Result                  |
| ------------------- | ----------------------- |
| 4242 4242 4242 4242 | Payment succeeds        |
| 4000 0000 0000 9995 | Declined (insufficient) |
| 4000 0025 0000 3155 | Requires 3D Secure      |

Use any future expiry date, any 3-digit CVC and any postal code.

---

## 10. Seeded Accounts

All seeded accounts use the password **`Password123`** and end in `@homelabconnect.local`.

| Email         | Role                           |
| ------------- | ------------------------------ |
| admin         | Admin (full access)            |
| president     | Admin (custom role: President) |
| doctor        | Doctor                         |
| medteam       | Med Team (lead, Team Makati)   |
| seniormedtech | Med Team (Senior Med Tech)     |
| support       | Support                        |
| patient01–20  | Patient                        |

`president` and `seniormedtech` use custom roles, so they are seeded with Module 2 (Roles & Permissions).

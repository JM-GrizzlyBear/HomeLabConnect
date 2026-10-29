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

¹ Behind storage ports: photos and note files have public links; lab results use a private store (Cloudinary "authenticated" assets, or `apps/api/private-uploads` locally) and are handed out only after an access check.

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
5. **Appointments:** patient booking with live sale prices and open slots (one visit per med team on duty per slot), staff accept/reject, new-time proposals the patient accepts or declines, cancellation, and emails at each step team assignment (manual or automatic), the med team's My Visits with sample collection, notes with photo/PDF attachments, return visits for missed tests, and daily routes (built: slices 5A–5D). See [erd/appointments.md](erd/appointments.md).
6. **Results:** a **Review Queue** for doctors (to upload / ready to release / released); a PDF or photo and a comment per collected test, kept as drafts until the doctor **releases** them; the patient is emailed and views or downloads them under **My Results**. Results are **held until the appointment is paid** ("Your results are ready. Pay to view them"). Files are private: no public links, only short-lived ones after an access check (built). See [erd/results.md](erd/results.md).
7. **Payments (Stripe + Cash):** card checkout once a visit is confirmed (an open checkout is closed when cash is taken; a card payment that still lands on a paid visit is flagged **Needs refund**), cash recorded by the med team at the visit, refunds (full or partial, by an admin; paid visits that get cancelled or rejected are flagged "Needs refund"), My Payments, All Payments with a CSV export (built). Without Stripe keys only cash is offered. See [erd/payments.md](erd/payments.md).
8. **Support Desk:** patient help desk, tickets auto-assigned to on-shift agents, ticket chat.
9. **Notifications:** in-app bell with real-time updates (SSE) and key emails (booking accepted/rejected, new time proposed, result released, payment received/refunded).
10. **Audit Logs:** sign-ins (including failed ones, with the email tried), sign-outs and password changes, and every admin change (users, roles, settings, closed days, catalog, teams, shifts, leave decisions, refunds and cash) with who, when, what, IP and browser; searchable by group, person and date under **Audit Logs** (`audit.view`). Appointment history stays on each appointment (built). See [erd/audit.md](erd/audit.md).
11. **Reports & Dashboard:** a dashboard with real numbers for every role: admin (today's bookings, visits, results and payments; revenue and bookings over 14 days), doctor (review queue, releases, turnaround), med team (today's route and cash), support (pending bookings, refunds due, unpaid visits) and patient (upcoming visits, results, balance due, spending) (built). **Reports** (Users → Reports): Revenue (card, cash, refunds and what was kept, plus discounts by promotion), Bookings & visits (booked, confirmed, rejected, cancelled, collected, return visits, collection rate, and the top reasons visits didn't go ahead) and Tests (ordered, collected and revenue per test and category), for any range up to a year, grouped by day, week or month; exported as CSV (`reports.export`); saved by name per user (`reports.save`), where a preset like "This month" stays relative (built). See [erd/reports.md](erd/reports.md).
12. **System Settings:** visit days and hours, slot length, minimum notice, booking window, cancellation cut-off, daily team capacity, booking approval (staff or automatic) and team assignment (manual or auto); holidays and special days off that close dates for booking. See [erd/settings.md](erd/settings.md).

---

## 5. Payment Flow (Stripe)

### 5.1 Online payment (card)

1. Once the appointment is confirmed, the patient clicks **Pay now** on it.
2. The backend creates a **Stripe Checkout Session** (currency `php`, amount in centavos) and saves a `payments` row with status `pending` and the session ID as `provider_reference`.
3. The patient is redirected to Stripe's hosted checkout page and pays.
4. Stripe redirects the patient back to the app (success or cancel URL).
5. Stripe sends a **webhook** (`checkout.session.completed`) to `POST /api/payments/webhook`.
6. The backend verifies the webhook signature with `STRIPE_WEBHOOK_SECRET`, stores the event in `payment_webhook_events` (ignoring duplicates), and marks the payment `paid`.
7. The patient gets a "Payment received" email, and results unlock once the appointment is fully paid.

An open checkout lasts 60 minutes; clicking **Pay now** again within that time reuses it. A ₱0 visit (a return visit) counts as paid.

### 5.2 Cash payment

- The med team records a cash payment for the full total during the visit, once they are on the way (`payments.record_cash` permission), from the appointment page.
- The payment is saved with `provider = cash` and status `paid`.

### 5.3 Refunds

- An admin issues a full or partial refund with a reason (`payments.refund` permission), from **All Payments** or **Refunds**. Refunds are never automatic: a paid visit that is cancelled or rejected shows **Needs refund**.
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

# Stripe card payments. Empty or the sk_test_xxx placeholder: only cash is offered
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

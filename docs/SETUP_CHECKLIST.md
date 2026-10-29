# Setup and Checklist

How to get every value for the environment variables, which settings to pick on each service, where each value goes, and what to check.

- Website: https://homelabconnect.netlify.app
- API: https://homelabconnect-api.onrender.com (health check: `/api/health`; `/` answers a JSON "route not found", which is expected)

## Login accounts (seed data)

You sign in with an **email**; there are no usernames. Every seeded account uses the password **`Password123`**.

| Email                                                               | Role                                          |
| ------------------------------------------------------------------- | --------------------------------------------- |
| `admin@homelabconnect.local`                                        | Admin (everything)                            |
| `president@homelabconnect.local`                                    | Admin, President role (can't change settings) |
| `doctor@homelabconnect.local`                                       | Doctor                                        |
| `medteam@homelabconnect.local`                                      | Med Team, lead of Team Makati                 |
| `seniormedtech@homelabconnect.local`                                | Med Team, Senior Med Tech                     |
| `support@homelabconnect.local`                                      | Support                                       |
| `patient01@homelabconnect.local` … `patient20@homelabconnect.local` | Patient                                       |

If one of these stops working, run `turbo run db:seed` again. In production, change the admin password right after the first sign-in.

## What the project runs on

| Piece           | Version / setting                                                         |
| --------------- | ------------------------------------------------------------------------- |
| Node.js         | 24 (`.nvmrc`; the Docker image is `node:24-slim`)                         |
| pnpm            | 12.6.0 (`packageManager` in `package.json`)                               |
| PostgreSQL      | 16 locally (Docker), 17 in CI. Use **17** on Neon (16 also works).        |
| Database access | Drizzle ORM, plain Postgres driver (`pg`), direct (non-pooled) connection |
| API             | Express 5 in a Docker container, port 4000 (Render sets `PORT` itself)    |
| Website         | React 19 + Vite, static files in `apps/client/dist`                       |

## Running it locally

```bash
pnpm i
docker compose up -d postgres mailpit
turbo run db:migrate
turbo run db:seed
turbo run dev
```

- App: http://localhost:5173
- API health: http://localhost:4000/api/health
- Emails (Mailpit): http://localhost:8025

## Where each value goes

There is **one** `.env` file: **`HomeLabConnect/.env`**, at the repo root next to `package.json`. It is for your PC only. Production values never go in a file; they go into the Render dashboard and GitHub secrets.

| Place                                                   | What goes there                                                          | Notes                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **`HomeLabConnect/.env`** (repo root)                   | Local development: the local database, a local `SESSION_SECRET`, Mailpit | Already set up. Copy `.env.example` on a new machine. Git ignores it. Don't put the Neon URL here. |
| **Render → your service → Environment**                 | Every API value for production (step 5)                                  | The production API reads only these.                                                               |
| **Netlify**                                             | Nothing                                                                  | Only change the Render address inside `netlify.toml` (a normal file in the repo).                  |
| **GitHub → Settings → Secrets and variables → Actions** | `RENDER_DEPLOY_HOOK`, `NETLIFY_BUILD_HOOK`, `DATABASE_URL`               | Used by the Deploy and Clear database workflows.                                                   |
| **Typed in the terminal, once**                         | `DATABASE_URL` for seeding Neon                                          | `DATABASE_URL="<neon url>" turbo run db:seed`. Not saved anywhere.                                 |

`apps/api/.env` and `apps/api/.env.example` are not used by anything; the API reads the root `.env`.

Optional: to try Cloudinary or Brevo from your PC before deploying, add `PHOTO_STORAGE=cloudinary` + `CLOUDINARY_URL`, or the `SMTP_*` values, to the root `.env` and restart `turbo run dev`. Remove them afterwards to go back to the local folder and Mailpit.

## Getting the values, service by service

Do them in this order: Neon, Cloudinary, Brevo, session secret, Render, Netlify, GitHub.

### 1. Neon (PostgreSQL) → `DATABASE_URL`

1. Sign up at https://neon.tech. Plan: **Free**.
2. **New Project** with these settings:

   | Setting          | Pick                                                                  |
   | ---------------- | --------------------------------------------------------------------- |
   | Project name     | `homelabconnect`                                                      |
   | Postgres version | **17** (the same as CI; 16 also works and matches local Docker)       |
   | Cloud provider   | AWS                                                                   |
   | Region           | **Asia Pacific (Singapore)** `ap-southeast-1` (same region as Render) |
   | Database name    | `neondb` (default is fine)                                            |
   | Role             | `neondb_owner` (default is fine)                                      |

3. On the project dashboard, click **Connect**:
   - **Branch:** `production` (or `main`, the default)
   - **Database:** `neondb`
   - **Role:** `neondb_owner`
   - **Connection pooling:** **off**. The host must **not** contain `-pooler`; the migrations need a direct connection.
   - **Format:** connection string (the plain `postgresql://` URL, not a framework snippet)
4. Copy it. It looks like:
   `postgresql://neondb_owner:PASSWORD@ep-xxxx-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full`
5. That is `DATABASE_URL`. Neon shows `?sslmode=require` at the end: change it to **`?sslmode=verify-full`** (the same encrypted, certificate-checked connection, without the `pg` driver's security warning in the Render log). If it also has `&channel_binding=require`, keep that part.

### 2. Cloudinary (images) → `CLOUDINARY_URL`, `CLOUDINARY_FOLDER`

1. Sign up at https://cloudinary.com. Plan: **Free**. If asked what you're building, any answer is fine (e.g. "Web app", "Images").
2. You get one **product environment** (a cloud) with a **cloud name**. Nothing else to pick: no version or region.
3. Open **Settings → API Keys** (or the Dashboard). Click the eye icon to reveal the secret.
4. Copy the **API environment variable**:
   `cloudinary://API_KEY:API_SECRET@CLOUD_NAME`
5. Values:
   - `CLOUDINARY_URL` = that string
   - `CLOUDINARY_FOLDER` = `homelabconnect` (the API creates `homelabconnect/profile` on the first upload)

### 3. Brevo (email) → `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

1. Sign up at https://www.brevo.com. Plan: **Free** (about 300 emails a day). It may ask for your name, company and phone; a new account can need a short review before it sends.
2. **Senders, Domains & Dedicated IPs → Senders → Add a sender**:
   - **From name:** `HomeLabConnect`
   - **From email:** the address you'll send from
   - Click the verification link Brevo emails to that address.
3. Account menu (top right) → **SMTP & API** → **SMTP** tab:
   - Note the **Login** (looks like `xxxxxx@smtp-brevo.com`). This is **not** your account email.
   - **Generate a new SMTP key** (name it `homelabconnect`). Copy it right away; it's shown once.
4. Values:

   | Variable    | Value                                               | Notes                                   |
   | ----------- | --------------------------------------------------- | --------------------------------------- |
   | `SMTP_HOST` | `smtp-relay.brevo.com`                              |                                         |
   | `SMTP_PORT` | `587`                                               | STARTTLS (encrypted). `465` also works. |
   | `SMTP_USER` | the **Login** from the SMTP tab                     |                                         |
   | `SMTP_PASS` | the SMTP key                                        | Not your Brevo password                 |
   | `MAIL_FROM` | `HomeLabConnect <your-verified-sender@example.com>` | Must be the sender you verified         |

   A Gmail sender works, but emails may land in spam until you use a domain you own.

### 4. `SESSION_SECRET`

Run this in a terminal and copy the output (use a new value for production, not your local one):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Render (API) → the API address and `RENDER_DEPLOY_HOOK`

1. Sign up at https://render.com with GitHub and allow access to the HomeLabConnect repository.
2. **New → Web Service** → pick the repository. Settings:

   | Setting            | Pick                                                             |
   | ------------------ | ---------------------------------------------------------------- |
   | Name               | `homelabconnect-api` (becomes `homelabconnect-api.onrender.com`) |
   | Language / Runtime | **Docker** (uses the root `Dockerfile`, Node 24 inside)          |
   | Branch             | `main`                                                           |
   | Region             | **Singapore (Southeast Asia)** (same as Neon)                    |
   | Root directory     | empty (the repository root)                                      |
   | Dockerfile path    | `./Dockerfile` (default)                                         |
   | Instance type      | **Free**                                                         |
   | Health check path  | `/api/health` (under **Advanced**)                               |
   | Auto-Deploy        | **No** (deploys go through the GitHub workflow)                  |

3. **Environment Variables** (add each one):

   | Variable            | Value                                               |
   | ------------------- | --------------------------------------------------- |
   | `DATABASE_URL`      | from Neon                                           |
   | `SESSION_SECRET`    | from step 4                                         |
   | `TRUST_PROXY`       | `2`                                                 |
   | `PHOTO_STORAGE`     | `cloudinary`                                        |
   | `CLOUDINARY_URL`    | from Cloudinary                                     |
   | `CLOUDINARY_FOLDER` | `homelabconnect`                                    |
   | `SMTP_HOST`         | `smtp-relay.brevo.com`                              |
   | `SMTP_PORT`         | `587`                                               |
   | `SMTP_USER`         | Brevo's SMTP Login                                  |
   | `SMTP_PASS`         | the Brevo SMTP key                                  |
   | `MAIL_FROM`         | `HomeLabConnect <your-verified-sender@example.com>` |
   | `APP_URL`           | your Netlify address (fill in after step 6)         |

   Don't add `PORT` or `NODE_ENV`: Render sets `PORT`, and the image sets `NODE_ENV=production`.

4. **Create Web Service**. The first build takes a few minutes; the log ends with "Migrations are up to date." and "API listening…".
5. Your address is at the top, e.g. `https://homelabconnect-api.onrender.com`. Opening `<address>/api/health` should answer `{"status":"ok","db":"ok"}`.
6. **Settings → Deploy Hook**: copy it. This is `RENDER_DEPLOY_HOOK`.

The free instance sleeps after about 15 idle minutes, so the first request after that takes 30–60 seconds.

### 6. Netlify (website) → the site address and `NETLIFY_BUILD_HOOK`

1. In `netlify.toml`, replace `homelabconnect-api.onrender.com` with your Render address, then commit and push.
2. Sign up at https://www.netlify.com with GitHub. Plan: **Free**.
3. **Add new site → Import an existing project → GitHub** → pick the repository. Settings (they come from `netlify.toml`; check they match):

   | Setting               | Value                                                          |
   | --------------------- | -------------------------------------------------------------- |
   | Branch to deploy      | `main`                                                         |
   | Base directory        | empty (the repository root)                                    |
   | Build command         | `pnpm exec turbo run build --filter=@homelabconnect/client...` |
   | Publish directory     | `apps/client/dist`                                             |
   | Node version          | 24 (read from `.nvmrc`)                                        |
   | Package manager       | pnpm (detected from `pnpm-lock.yaml`)                          |
   | Environment variables | none                                                           |

4. **Deploy**. The address appears, e.g. `https://homelabconnect.netlify.app` (rename it under **Site configuration → Change site name**). Put it in Render's `APP_URL`.
5. **Site configuration → Build & deploy → Build hooks → Add build hook** (name `deploy`, branch `main`): copy it. This is `NETLIFY_BUILD_HOOK`.

### 7. GitHub secrets

In the repository: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret               | Value                      |
| -------------------- | -------------------------- |
| `RENDER_DEPLOY_HOOK` | from Render                |
| `NETLIFY_BUILD_HOOK` | from Netlify               |
| `DATABASE_URL`       | the Neon connection string |

The Deploy workflow uses an environment called `production`. GitHub creates it on the first run; nothing to set up.

### 8. Seed the production database (once)

From Git Bash on your PC:

```bash
DATABASE_URL="<your neon url>" turbo run db:seed
```

### 9. Deploy

GitHub → **Actions → Deploy → Run workflow**.

### 10. Stripe (card payments) → `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Until `STRIPE_SECRET_KEY` is set (empty or the `sk_test_xxx` placeholder counts as unset), the app only offers cash and everything else still works. Stay in **test mode**: no business details, no real money.

**The keys**

1. Sign up at https://dashboard.stripe.com/register. Skip "Activate payments". Make sure the top bar says **Test mode** or **Sandbox**. If the Philippines isn't in the country list, any listed country is fine for a test account (checkout still charges in pesos).
2. **Developers → API keys → Secret key → Reveal test key**: copy the `sk_test_…` key (about 100 characters). The publishable key isn't needed.

There are **two different webhook secrets**: one for your PC (from the Stripe CLI) and one for the live site (from the dashboard). Each only works in its own place.

**On your PC (root `.env`)**

3. Put `STRIPE_SECRET_KEY=sk_test_…` in the root `.env` (no quotes, no spaces).
4. Install the Stripe CLI (`scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git` then `scoop install stripe`, or the Windows zip from https://github.com/stripe/stripe-cli/releases/latest) and run `stripe login`.
5. HomeLabConnect's API must be the app on port 4000: close anything else using it. With `turbo run dev` running, in a second terminal:
   ```
   stripe listen --forward-to localhost:4000/api/payments/webhook --events checkout.session.completed,checkout.session.expired
   ```
   Copy the `whsec_…` it prints (or get it any time with `stripe listen --print-secret`) into `.env` as `STRIPE_WEBHOOK_SECRET`.
6. Restart `turbo run dev` (the API reads `.env` only when it starts). Keep `stripe listen` running while you test.

**On the live site (Render)**

7. Stripe → **Developers → Webhooks** (newer dashboards: **Workbench → Webhooks**) → **Add endpoint**:
   - URL: `https://homelabconnect-api.onrender.com/api/payments/webhook`
   - Events: `checkout.session.completed` and `checkout.session.expired`
   - Save, then **Signing secret → Reveal**: copy this endpoint's `whsec_…`.
8. Render → your service → **Environment**: add `STRIPE_SECRET_KEY` (the same `sk_test_…`) and `STRIPE_WEBHOOK_SECRET` (the endpoint's `whsec_…`), and check `APP_URL` is `https://homelabconnect.netlify.app` (Stripe sends patients back there). Save; Render redeploys.

**Test cards:** `4242 4242 4242 4242` (any future date, any CVC) pays; `4000 0000 0000 9995` is declined; `4000 0025 0000 3155` asks for 3-D Secure.

**If it doesn't work:** no **Pay now** → the key is missing or still the placeholder, or the API wasn't restarted. Paid on Stripe but the app still says Unpaid → the webhook: is `stripe listen` running with its secret in `.env` (locally), or does Render hold the endpoint's secret (live)? Stripe → Webhooks → your endpoint shows each failed delivery; a 400 means the signing secret doesn't match.

## Credit cards

As far as we know, the free plans of Neon, Cloudinary, Netlify, Brevo and Resend don't ask for a card, and Render's free web service usually doesn't either. If a sign-up asks for one, stop and ask before entering it.

## Checklist

### Locally (after `turbo run dev`)

Sign-in

- [ ] Sign in as `admin@homelabconnect.local` / `Password123`.
- [ ] Reload the page: you're still signed in.
- [ ] DevTools → Application → Cookies: there's an `hlc.sid` cookie marked HttpOnly.
- [ ] Log out: opening `/app` sends you back to Login.
- [ ] Sign in as `support@` in a second browser. As admin, deactivate support: support's next click signs them out.
- [ ] Change your password on Profile: your other browsers get logged out.

Profile photo

- [ ] Profile → **Add photo** (a JPG or PNG under 2 MB): it shows on the card and in the sidebar.
- [ ] **Change photo**: the old file disappears from `apps/api/uploads/`.
- [ ] A photo over 2 MB, or a `.txt` renamed to `.png`, shows an error dialog.
- [ ] **Remove** asks you to confirm, then your initials show again.

Pages and data

- [ ] Users, Procedures, Promotions, Settings, Holidays, Teams, Shifts, My Schedule, My Leave and Leave Requests all load.
- [ ] Changing filters or pages keeps the old list on screen until the new one arrives (no empty flash).
- [ ] Saving something (e.g. renaming a team) updates the list without reloading the page.
- [ ] Leave: file a request as `seniormedtech@`, approve it as `medteam@`, then approve it as `admin@`.
- [ ] Create a staff account: the email shows in Mailpit.

Appointments

- [ ] As `patient05@`: **Book a Visit** → tick two tests (sale prices and the total show on the right) → pick an open day and time (Sundays show "No team"; full times are crossed out) → the address is prefilled → **Book visit**. The appointment page shows "Waiting for review" and "Unpaid"; Mailpit has "We received your booking".
- [ ] **My Appointments** lists it under Upcoming. **Cancel visit** works until the cut-off (24 hours before by default).
- [ ] As `admin@`: **All Appointments** shows pending bookings first. **Accept** one (the patient gets "confirmed"), **Reject** another with a reason.
- [ ] As `support@`: **Propose new time** on a booking. As that patient: the appointment shows the new time with **Accept new time** / **Decline**; accepting moves the visit.
- [ ] Try to book the last place of a time from two browsers at once: one succeeds, the other is told the time was just taken.
- [ ] As `admin@`: open a confirmed appointment → **Assign team** lists the teams on duty (busy ones greyed out) → pick one. With Settings → team assignment = Auto, accepting a booking assigns a team by itself.
- [ ] As `medteam@`: open a visit (**Details & notes**) → add a note with a photo or PDF; tick **Share with patient** on one. As the patient, only the shared note shows.
- [ ] Record a visit as **Collected** with one test unticked → **Schedule return visit** → pick a time: a new ₱0 confirmed visit for the missed test, linked both ways.
- [ ] As `admin@`: **Daily Route** → pick Team Makati → move a stop up or down; `medteam@`'s My Visits shows the new order. **Open in Maps** opens directions.
- [ ] Payments without Stripe: as the patient, a confirmed visit says "Pay in cash to the med team at your visit". As `medteam@`, on a visit that is on the way or collected → **Record cash payment** → confirm: it shows Paid; Mailpit has "Payment received".
- [ ] As `admin@`: **All Payments** lists it; **Export CSV** downloads it. **Refund** ₱100 with a reason: it shows Partly refunded. As the patient, **My Payments** shows the refund.
- [ ] With Stripe test keys and `stripe listen` (step 10): **Pay now** opens Stripe; paying with 4242… brings you back and the visit shows Paid. Cancel a paid visit: **Refunds → Needs refund** lists it.
- [ ] Results: as `doctor@`, **Review Queue → To upload** lists collected visits → **Open** → **Upload** a PDF per collected test (it shows "Draft") → **Release results**. As the patient: an unpaid visit shows "Your results are ready. Pay to view them" with no file links; once paid, **View** opens the file. **My Results** lists it. Mailpit has "Your lab results … are ready".
- [ ] Dashboard: sign in as `admin@`, `doctor@`, `medteam@`, `support@` and a patient: each shows real numbers for its role, with no "Sample data" badges.
- [ ] Audit Logs: as `admin@`, **Audit Logs** lists your sign-in. Try a wrong password for `support@` in another browser, then rename a team: both show (the failed one as "Failed sign-in" with the email tried, never the password).
- [ ] As `medteam@`: **My Visits** shows the team's visits for the day (address, phone, tests) → **On the way** → **Collected** (tick the tests, add a note). The appointment page shows ✓/✗ per test and the team's note.

Production image (optional)

- [ ] `docker compose --profile api up --build`, then http://localhost:8080/api/health answers `{"status":"ok","db":"ok"}`.

### After deploying

- [ ] Neon: the **Tables** page shows `users`, `session`, `lab_procedures` and the rest (the API created them on its first start).
- [ ] GitHub → Actions → **CI** is green.
- [ ] `https://<render address>/api/health` answers `{"status":"ok","db":"ok"}`.
- [ ] Open the Netlify address and sign in: the `hlc.sid` cookie is on the Netlify domain.
- [ ] Upload a profile photo: it appears in Cloudinary → Media Library → `homelabconnect/profile`.
- [ ] Create a staff account: the email reaches a real inbox (check spam too). Brevo → **Transactional → Logs** shows it as delivered.
- [ ] Actions → **Deploy → Run workflow** finishes, and both sites update.

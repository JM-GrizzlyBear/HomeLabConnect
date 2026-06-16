# HomeLabConnect

A learning project: multi-role authentication (**admin / med_team / patient / support /doctor**) built in
**Clean Architecture** with a typed end-to-end stack.

| Layer       | Tech                                              |
| ----------- | ------------------------------------------------- |
| Frontend    | Next.js 14 (App Router), React 18, TanStack Query |
| Transport   | oRPC (end-to-end typed)                           |
| Backend     | Node.js + Express 4                               |
| Persistence | Postgres 16 + Drizzle ORM                         |
| Auth        | JWT + bcrypt                                      |
| Container   | Docker + Docker Compose                           |
| Workspace   | pnpm + Turborepo                                  |

---

## Folder structure

```

```

---

## Prerequisites

Install these once on your machine:

```bash
# Node 20+
node -v


# Docker Desktop must be installed and RUNNING
docker ps
```

---

## 🚀 First-time setup (do this once)

### Step 1 — Install dependencies

```pnpm install

```

### Step 2 — Create your `.env`

```bash
cp .env.example .env
```

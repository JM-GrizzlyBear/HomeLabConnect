# HomeLabConnect — Backend Architecture

The API (`apps/api`) follows **Clean Architecture** as described by Robert C. Martin (Uncle Bob):
<https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html>

## The rings

```
┌──────────────────────────────────────────────────────────────┐
│ 4. Frameworks & Drivers      src/infrastructure/             │
│    Express, Drizzle/Postgres, Stripe, Nodemailer, config     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 3. Interface Adapters     src/interface/               │  │
│  │    controllers, presenters, middleware                 │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ 2. Use Cases           src/application/          │  │  │
│  │  │    <feature>/ use cases, ports/                  │  │  │
│  │  │  ┌────────────────────────────────────────────┐  │  │  │
│  │  │  │ 1. Entities         src/domain/            │  │  │  │
│  │  │  │    rules, repository interfaces, errors    │  │  │  │
│  │  │  └────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
          src/main.ts = composition root (wires everything)
```

| Ring                    | Folder               | Contains                                                                                                                                                                                          | May import                                                |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Entities             | `src/domain`         | Business objects, rules and the **repository interfaces** for them (`domain/catalog/LabProcedureRepository.ts`). Plain TypeScript.                                                                | Only `src/domain`                                         |
| 2. Use cases            | `src/application`    | One class per use case, grouped by feature (`application/catalog/CreateLabProcedure.ts`), and the other **ports** (`ports/`: clock, password hasher, mailer, photo storage…).                     | `src/domain`                                              |
| 3. Interface adapters   | `src/interface`      | `http/controllers` (request → use case input), `http/presenters` (use case output → response), `http/middleware`. Framework-free: they use `HttpRequest`/`HttpResponse` from `http/httpTypes.ts`. | `src/application`, `src/domain`, `@homelabconnect/shared` |
| 4. Frameworks & drivers | `src/infrastructure` | Express app and routes, Drizzle schema and repository implementations, Stripe, mail, config. Implements the ports.                                                                                | Anything                                                  |
| Composition root        | `src/main.ts`        | Creates the concrete classes and injects them through constructors.                                                                                                                               | Anything                                                  |

## The Dependency Rule

> Source code dependencies can only point **inwards**.

- `domain` knows nothing about use cases, HTTP, databases or npm packages.
- `application` talks to the outside world only through **ports** (interfaces it owns). Infrastructure provides the implementations.
- `interface` never imports Express, Drizzle or anything from `infrastructure`.
- Data crosses boundaries as plain objects (DTOs), never as an Express `req` or a database row.

This is **enforced**: `turbo run arch` runs [dependency-cruiser](../apps/api/.dependency-cruiser.cjs) and fails on any import that points the wrong way. CI runs it on every push.

## Recipe: adding a feature

A file that holds a class, or an interface that something implements, is named after it in PascalCase (`CreateLabProcedure.ts`, `LabProcedureRepository.ts`, `DrizzleLabProcedureRepository.ts`). Modules of functions and rules stay camelCase (`labProcedure.ts`, `businessDate.ts`, `routes.ts`).

Example: _admin creates a lab procedure_.

1. **Entity** — `src/domain/catalog/labProcedure.ts`: the object and its rules (e.g. price must be > 0, in centavos). Throw a `DomainError` subclass when a rule is broken.
2. **Repository interface** — `src/domain/catalog/LabProcedureRepository.ts`: what the use case needs from storage (`save`, `findByCode`, …). Other outside services (mail, storage, clock) get a port in `src/application/ports/`.
3. **Use case** — `src/application/catalog/CreateLabProcedure.ts`: takes an input DTO, uses the entity and the repository, returns an output DTO. Unit-test it with a fake repository.
4. **Adapter (driven)** — `src/infrastructure/db/schema/labProcedures.ts` (Drizzle table) and `src/infrastructure/db/DrizzleLabProcedureRepository.ts` implementing the interface. Run `turbo run db:generate` then `turbo run db:migrate`.
5. **Adapter (driving)** — `src/interface/http/controllers/CreateLabProcedureController.ts` validates the request (shared Zod schema from `@homelabconnect/shared`) and calls the use case; a presenter shapes the response.
6. **Route** — register it in `src/infrastructure/http/routes.ts`.
7. **Wire** — construct the repository, use case and controller in `src/buildApp.ts` (the composition root; `main.ts` only reads the settings and calls it).
8. **Test** — `test/unit/application/catalog/CreateLabProcedure.test.ts` (use case with a fake repository) and a route test in `test/integration/http/` against the real test database; then `turbo run lint typecheck arch test`.

The health check (`GET /api/health`) is a complete, minimal example of every step:
`SystemHealth` → `DatabaseHealthProbe` + `CheckSystemHealth` → `HealthController` + `HealthPresenter` → `DrizzleDatabaseHealthProbe` + `routes.ts` → `buildApp.ts`.

## Tests

Tests never live in `src/`. The API has two kinds, run by `turbo run test` as two Vitest projects:

```
apps/api/test/
├── unit/          rules and use cases on in-memory fakes, no database (fast)
│   ├── domain/scheduling/leave.test.ts
│   └── application/identity/Login.test.ts
├── integration/   the real app (buildApp) on a real Postgres test database
│   ├── http/leave.test.ts
│   └── support/   globalSetup, testDatabase, testApp (buildTestApp, signIn), given
└── support/       fakes.ts: in-memory ports, FixedClock, fake mail
```

- **The test database** is `TEST_DATABASE_URL`, or else `DATABASE_URL` with `_test` added to the name (`homelabconnect_test`). Anything whose name doesn't end in `_test` is refused. Before the run, `globalSetup` creates it if needed, applies every migration and adds the permission catalogue.
- **Every integration test** starts with `await buildTestApp()`, which empties every table except the catalogue, then builds the app with a fixed clock (Thursday 2026-01-15) and fake mail. Arrange data with `given.user(…)`, `given.team(…)`, `given.shifts(…)` and the rest, and sign in with `signIn(app, email)`. The files run one after another because they share one database.
- The client keeps its tests in `apps/client/tests/`, mirroring `src/` (`pages/LoginPage.test.tsx`, `support/renderApp.tsx`).
- Tests import the code under test from `src/` with relative paths. `src/` never imports from tests, and the production build (`tsconfig.build.json`) only compiles `src/`.

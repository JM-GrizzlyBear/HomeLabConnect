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
│  │  │    use-cases/, ports/ (interfaces)               │  │  │
│  │  │  ┌────────────────────────────────────────────┐  │  │  │
│  │  │  │ 1. Entities         src/domain/            │  │  │  │
│  │  │  │    business objects, rules, DomainError    │  │  │  │
│  │  │  └────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
          src/main.ts = composition root (wires everything)
```

| Ring                    | Folder               | Contains                                                                                                                                                                                          | May import                                                |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Entities             | `src/domain`         | Business objects and rules, e.g. `SystemHealth`, `DomainError`. Plain TypeScript.                                                                                                                 | Only `src/domain`                                         |
| 2. Use cases            | `src/application`    | One class per use case (`use-cases/`) and the **ports** it needs (`ports/`: repository, mailer, payment gateway interfaces…).                                                                     | `src/domain`                                              |
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

File names are camelCase (`createLabProcedure.ts`). The class or type inside keeps PascalCase (`export class CreateLabProcedure`).

Example: _admin creates a lab procedure_.

1. **Entity** — `src/domain/catalog/labProcedure.ts`: the object and its rules (e.g. price must be > 0, in centavos). Throw a `DomainError` subclass when a rule is broken.
2. **Port** — `src/application/ports/labProcedureRepository.ts`: the interface the use case needs (`save`, `findByCode`, …).
3. **Use case** — `src/application/use-cases/createLabProcedure.ts`: takes an input DTO, uses the entity and the port, returns an output DTO. Unit-test it with a fake repository.
4. **Adapter (driven)** — `src/infrastructure/db/schema/labProcedures.ts` (Drizzle table) and `src/infrastructure/db/drizzleLabProcedureRepository.ts` implementing the port. Run `turbo run db:generate` then `turbo run db:migrate`.
5. **Adapter (driving)** — `src/interface/http/controllers/createLabProcedureController.ts` validates the request (shared Zod schema from `@homelabconnect/shared`) and calls the use case; a presenter shapes the response.
6. **Route** — register it in `src/infrastructure/http/routes.ts`.
7. **Wire** — construct the repository, use case and controller in `src/main.ts`.
8. **Test** — use case unit test + a supertest route test; then `turbo run lint typecheck arch test`.

The health check (`GET /api/health`) is a complete, minimal example of every step:
`SystemHealth` → `DatabaseHealthProbe` + `CheckSystemHealth` → `HealthController` + `HealthPresenter` → `DrizzleDatabaseHealthProbe` + `routes.ts` → `main.ts`.

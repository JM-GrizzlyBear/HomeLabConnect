# ERD: Access (Roles & Permissions)

Tables added by Module 2. See [PERMISSIONS.md](../PERMISSIONS.md) for the rules.

```mermaid
erDiagram
    modules ||--o{ permissions : "groups"
    roles ||--o{ role_permissions : "base role grants"
    permissions ||--o{ role_permissions : "granted by"

    modules {
        text id PK "e.g. payments"
        text name
        integer sort "display order"
    }
    permissions {
        text id PK "<module>.<action>, e.g. payments.refund"
        text module_id FK
        text label
    }
    role_permissions {
        text role_id PK, FK "patient | med_team | doctor | support"
        text permission_id PK, FK
    }
```

**Notes**

- All three tables are written by `turbo run db:seed` from `packages/shared/src/permissions.ts`. Permissions removed from the catalogue are deleted, along with their grants.
- Admin has no `role_permissions` rows: it always has every permission.

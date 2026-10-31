# ERD: Access (Roles & Permissions)

Tables added by Module 2. See [PERMISSIONS.md](../PERMISSIONS.md) for the rules.

```mermaid
erDiagram
    modules ||--o{ permissions : "groups"
    roles ||--o{ role_permissions : "base role grants"
    permissions ||--o{ role_permissions : "granted by"
    roles ||--o{ custom_roles : "base of"
    custom_roles ||--o{ custom_role_permissions : "allows / denies"
    permissions ||--o{ custom_role_permissions : "decided by"
    custom_roles ||--o{ users : "held by"

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
    custom_roles {
        uuid id PK
        text name UK "unique ignoring case"
        text base_role_id FK "fixed once created"
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    custom_role_permissions {
        uuid custom_role_id PK, FK
        text permission_id PK, FK
        text effect "grant | deny"
    }
    users {
        uuid id PK
        text role_id FK "base role"
        uuid custom_role_id FK "optional, same base role"
    }
```

**Notes**

- `modules`, `permissions` and `role_permissions` are written by `turbo run db:seed` from `packages/shared/src/permissions.ts`. Permissions removed from the catalogue are deleted, along with their grants.
- Admin has no `role_permissions` rows: it always has every permission.
- A custom role lists only the permissions it changes; everything else is inherited from its base role.
- A user's custom role must be built on the user's base role. A custom role can't be deleted while `users.custom_role_id` points at it (`ON DELETE RESTRICT`).
- The seed creates the _President_ and _Senior Med Tech_ roles once; admins' later edits to them are kept on re-seed.

## Per-user overrides

```mermaid
erDiagram
    users ||--o{ user_permission_overrides : "has"
    permissions ||--o{ user_permission_overrides : "overridden in"

    user_permission_overrides {
        uuid user_id PK, FK "deleted with the user"
        text permission_id PK, FK
        text effect "grant | deny"
        timestamptz expires_at "end of the chosen day (Philippine time); null for no end"
        uuid granted_by FK "the admin who set it"
        timestamptz created_at
    }
```

- Checked first: user override → custom role → base role → deny. An expired override is ignored.
- Saving replaces all of a person's overrides at once. Admins can't be overridden (they always have everything), and nobody overrides themselves.

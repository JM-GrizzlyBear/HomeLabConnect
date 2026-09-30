# ERD: Catalog (Lab Procedures)

Tables added by Module 3. Prices are integer centavos (`35000` = ₱350.00).

```mermaid
erDiagram
    procedure_categories ||--o{ lab_procedures : "groups"

    procedure_categories {
        uuid id PK
        text name UK "unique ignoring case"
        timestamptz created_at
        timestamptz updated_at
    }
    lab_procedures {
        uuid id PK
        text code UK "uppercase, e.g. CBC, LIPID-PANEL"
        text name UK "unique ignoring case"
        uuid category_id FK
        integer price_centavos "> 0, at most 100000000"
        text specimen "blood | urine | stool | swab | other"
        integer turnaround_hours "1 to 720"
        integer fasting_hours "0 to 24; 0 = no fasting"
        text preparation
        text description
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }
```

**Notes**

- Procedures are deactivated, never deleted, so appointments and payments keep pointing at them.
- A category can't be deleted while any procedure (active or not) is in it (`ON DELETE RESTRICT`).
- `turbo run db:seed` adds 6 categories and 21 procedures once, by code; admins' later price changes are kept on re-seed.

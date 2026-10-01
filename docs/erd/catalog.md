# ERD: Catalog (Lab Procedures)

Tables added by Module 3. Prices are integer centavos (`35000` = ₱350.00).

```mermaid
erDiagram
    procedure_categories ||--o{ lab_procedures : "groups"
    promotions ||--o{ promotion_procedures : "covers (when selected)"
    lab_procedures ||--o{ promotion_procedures : "discounted by"

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
    promotions {
        uuid id PK
        text name UK "unique ignoring case"
        text description
        text discount_type "percent | fixed"
        integer value "percent 1-100, or centavos off"
        date starts_on "first day, Philippine time"
        date ends_on "last day, included; null = no end date"
        text applies_to "all | selected"
        boolean is_active "false = switched off early"
        timestamptz created_at
        timestamptz updated_at
    }
    promotion_procedures {
        uuid promotion_id PK, FK
        uuid procedure_id PK, FK
    }
```

**Notes**

- Procedures are deactivated, never deleted, so appointments and payments keep pointing at them.
- A category can't be deleted while any procedure (active or not) is in it (`ON DELETE RESTRICT`).
- `turbo run db:seed` adds 6 categories and 21 procedures once, by code; admins' later price changes are kept on re-seed.
- A promotion is **running** when it's switched on and today (Philippine time) is between its first and last day. With no last day (`ends_on` null, e.g. a standing senior/PWD discount) it runs from its first day until switched off. Its status (scheduled, running, ended, off) is worked out from that, not stored.
- `promotion_procedures` has rows only when `applies_to = 'selected'`.
- When several running promotions cover a procedure, the one giving the **lowest price** wins; prices never go below ₱0. Promotions don't stack.
- The seed adds _Senior & PWD Discount_ (20% off everything, from the day the seed runs, no end date) and _Diabetes Check_ (₱200 off FBS and HbA1c, a month later), once, by name.

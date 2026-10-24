# ERD: Appointments

Tables added by Module 5 (slices 5A booking and 5B staff review). Dates are whole days and times are "HH:MM", in Philippine time. Money is centavos.

```mermaid
erDiagram
    users ||--o{ appointments : "books"
    appointments ||--|{ appointment_procedures : "tests (prices as booked)"
    lab_procedures ||--o{ appointment_procedures : "test"
    promotions ||--o{ appointment_procedures : "sale applied"
    appointments ||--o{ reschedule_proposals : "new times offered"
    appointments ||--o{ appointment_events : "history"
    users ||--o{ appointment_events : "done by"

    appointments {
        uuid id PK
        int number UK "shown as HLC-000123"
        uuid patient_user_id FK
        date visit_date
        text slot_start "HH:MM"
        text status "pending | confirmed | reschedule_proposed | rejected | cancelled"
        text address
        text landmark
        text patient_notes
        int subtotal_centavos
        int discount_centavos
        int total_centavos
        text payment_status "unpaid (Payments module later)"
        text decision_note "why rejected or cancelled by staff"
    }
    appointment_procedures {
        uuid appointment_id PK, FK
        uuid procedure_id PK, FK
        smallint position
        text code "copied when booked"
        text name "copied when booked"
        int price_centavos "copied when booked"
        uuid promotion_id FK
        text promotion_name
        int discount_centavos
    }
    reschedule_proposals {
        uuid id PK
        uuid appointment_id FK
        date proposed_date
        text proposed_slot
        text reason
        uuid proposed_by FK
        text status "open | accepted | declined | withdrawn"
    }
    appointment_events {
        uuid id PK
        uuid appointment_id FK
        timestamptz at
        uuid actor_id FK
        text kind "booked, confirmed, rejected, cancelled, reschedule_*"
        text note
    }
```

**Rules**

- **Time slots** run from the visit start to the visit end in steps of the slot length (Settings), e.g. 06:00–12:00 in 60-minute slots gives 06:00 … 11:00.
- **A day can be booked** when it is a visit day, isn't a closed day, is within the booking window, and at least one slot starts after the minimum notice.
- **Capacity:** a med team is _on duty_ on a date when it is active, has a roster for that two-week period, and at least one member is working that day (approved leave counts as not working). Each team on duty takes **one visit per slot**, and at most **visits per team per day** (Settings) in the day. Pending, confirmed and reschedule_proposed bookings hold a place.
- **No double booking:** saving a booking locks its date (`pg_advisory_xact_lock`) and re-counts, so two patients can't both take the last place (the second gets 409 `slot_full`).
- **Prices are copied** onto `appointment_procedures` when booked, with the best running promotion; later price changes don't affect the booking.
- **Status flow:** a booking starts `pending` (or `confirmed` when Settings → booking approval is automatic). Staff accept (`confirmed`) or reject (`rejected`, with a reason). Staff can propose a new time (`reschedule_proposed`); the patient accepts (the visit moves there and is `confirmed`, if the slot still has room) or declines (`cancelled`). Patients cancel their own up to the cancellation cut-off; staff with `appointments.cancel` cancel any time with a reason.
- **Emails** go to the patient when a booking is received, confirmed, rejected, given a new time or cancelled by staff. A failed email never undoes the change.
- `turbo run db:seed` adds four sample bookings (patient01–03) on an empty database.

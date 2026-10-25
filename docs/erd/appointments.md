# ERD: Appointments

Tables added by Module 5 (slices 5A booking, 5B staff review, 5C team assignment and visits, 5D notes, return visits and routes). Dates are whole days and times are "HH:MM", in Philippine time. Money is centavos.

```mermaid
erDiagram
    users ||--o{ appointments : "books"
    appointments ||--|{ appointment_procedures : "tests (prices as booked)"
    lab_procedures ||--o{ appointment_procedures : "test"
    promotions ||--o{ appointment_procedures : "sale applied"
    appointments ||--o{ reschedule_proposals : "new times offered"
    appointments ||--o{ appointment_events : "history"
    users ||--o{ appointment_events : "done by"
    med_teams ||--o{ appointments : "goes on"
    appointments ||--o{ appointments : "return visit of"
    appointments ||--o{ appointment_notes : "notes"
    appointment_notes ||--o{ appointment_attachments : "files"

    appointments {
        uuid id PK
        int number UK "shown as HLC-000123"
        uuid patient_user_id FK
        date visit_date
        text slot_start "HH:MM"
        text status "pending | confirmed | reschedule_proposed | on_the_way | collected | not_collected | rejected | cancelled"
        text address
        text landmark
        text patient_notes
        int subtotal_centavos
        int discount_centavos
        int total_centavos
        text payment_status "unpaid (Payments module later)"
        text decision_note "why rejected or cancelled by staff"
        uuid team_id FK "the med team going"
        text collection_note "the team's note, or why it couldn't collect"
        uuid return_of_id FK "the visit this one returns to"
        smallint route_position "order in the team's route; null = by time"
    }
    appointment_notes {
        uuid id PK
        uuid appointment_id FK
        uuid author_id FK
        text body
        boolean shared_with_patient
        timestamptz created_at
    }
    appointment_attachments {
        uuid id PK
        uuid appointment_id FK
        uuid note_id FK
        uuid uploaded_by FK
        text filename
        text mime_type "JPG, PNG, WebP or PDF"
        int size_bytes "at most 5 MB"
        text url
        text storage_key "Cloudinary public id, or the local file name"
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
        boolean collected "set when the visit is recorded"
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
- **Team assignment:** a confirmed visit goes to one med team on duty that day. A team does one visit per slot and at most _visits per team per day_. With Settings → team assignment **auto**, a visit is given to the free team with the fewest visits that day (ties A–Z) as soon as it's confirmed; if none is free, staff assign it. With **manual**, staff with `appointments.assign` pick the team. Moving a visit to a new time takes its team away (re-assigned automatically in auto mode). The check and the write happen under the date's lock, so two visits can't take the same team and slot.
- **The visit:** a member of the assigned team (`visits.collect`) marks it **on the way**, then **collected** (ticking which tests' samples were taken, with an optional note) or **not collected** (with the reason). Collected and not-collected visits still count toward the team's day.
- **Notes & files:** staff and members of the visit's team add notes (`notes.create`), optionally with one photo or PDF up to 5 MB (`notes.attach`; the file's first bytes are checked, not its name). Patients see only notes marked "shared with patient". Files go to Cloudinary (`<CLOUDINARY_FOLDER>/attachments`, kept as uploaded) or `apps/api/uploads/attachments` locally. The uploader or an admin can remove a file.
- **Return visits:** after a visit that wasn't collected, or one where some tests were missed, the visit's team (`visits.schedule_return`) or staff (`appointments.assign`) book a return visit at an open time: a new **confirmed** appointment for the missed tests only, at ₱0, linked both ways (`return_of_id`), given to the same team when it's free.
- **Daily route:** a team's visits for a day, ordered by `route_position` (set when an admin with `routes.manage` reorders them), then by time. The med team (`routes.view`) sees its own route, with an "Open in Maps" link per stop; My Visits uses the same order.
- `turbo run db:seed` adds four sample bookings (patient01–03) on an empty database; the confirmed one goes to Team Makati.

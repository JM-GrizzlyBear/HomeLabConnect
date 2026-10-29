# ERD: Support desk

Tables added by Module 8 (Support Desk). A patient opens a ticket; it's chatted about in `chat_messages`, and `chat_participants` remembers how far each person has read.

```mermaid
erDiagram
    users ||--o{ support_tickets : "opened (patient)"
    users |o--o{ support_tickets : "assigned to"
    appointments |o--o{ support_tickets : "about"
    support_tickets ||--o{ chat_messages : "has"
    users ||--o{ chat_messages : "wrote"
    support_tickets ||--o{ chat_participants : "read by"
    users ||--o{ chat_participants : "reads"

    support_tickets {
        uuid id PK
        int number "shown as TKT-000012"
        uuid patient_user_id FK
        text subject
        text category "booking | payment | results | account | other"
        text priority "low | normal | high"
        text status "open | assigned | waiting_on_patient | closed"
        uuid appointment_id FK "optional; the patient's own visit"
        uuid assigned_to FK "null while unassigned"
        timestamptz assigned_at
        timestamptz closed_at
        uuid closed_by FK
        smallint rating "1-5, once, after closing"
        text rating_comment
        timestamptz last_message_at
        timestamptz created_at
        timestamptz updated_at
    }

    chat_messages {
        uuid id PK
        bigint seq "order, even within one millisecond"
        uuid ticket_id FK "deleted with the ticket"
        uuid author_id FK
        text body "may be empty when a file is attached"
        text attachment_filename
        text attachment_mime_type "PDF, JPG, PNG or WebP"
        int attachment_size_bytes
        text attachment_storage_key "private storage, like results"
        timestamptz created_at
    }

    chat_participants {
        uuid ticket_id PK, FK
        uuid user_id PK, FK
        bigint last_read_seq "unread = others' messages after this"
    }
```

**How tickets move**

- **Auto-assign:** a new ticket goes to the active support agent on shift right now (an `employee_shift_days` row for today in Philippine time covering this minute, and no approved leave) with the fewest open tickets; on a tie, whoever got a ticket longest ago. With nobody on shift it stays `open` (unassigned) until an agent claims it or replies.
- **Statuses:** an agent's reply sets `waiting_on_patient`; the patient's reply sets `assigned` (or `open` without an agent). The patient, or support with `support.close`, closes it.
- **Reopening:** a patient's reply within 7 days of closing reopens the ticket; after that they open a new one. Agents can't write in a closed ticket.
- **Rating:** the patient rates once, after it's closed.
- **Live updates:** each change is pushed over `GET /api/events` (Server-Sent Events) to the patient and every active support agent and admin; the browser refetches what it shows.

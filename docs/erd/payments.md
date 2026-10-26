# ERD: Payments

Tables added by Module 7. Money is integer centavos (₱850.00 = 85000), the unit Stripe uses.

```mermaid
erDiagram
    appointments ||--o{ payments : "paid by"
    payments ||--o{ payment_refunds : "given back"
    users ||--o{ payments : "took cash"
    users ||--o{ payment_refunds : "refunded"

    appointments {
        uuid id PK
        text payment_status "unpaid | paid | partially_refunded | refunded"
        integer total_centavos
    }
    payments {
        uuid id PK
        uuid appointment_id FK
        text provider "stripe | cash"
        text status "pending | paid | partially_refunded | refunded | failed | expired"
        integer amount_centavos
        integer refunded_centavos
        text provider_reference UK "Stripe checkout session id; null for cash"
        text checkout_url "while the checkout is open"
        uuid recorded_by FK "who took the cash"
        timestamptz paid_at
        timestamptz created_at
        timestamptz updated_at
    }
    payment_refunds {
        uuid id PK
        uuid payment_id FK
        integer amount_centavos
        text reason
        uuid refunded_by FK
        timestamptz created_at
    }
    payment_webhook_events {
        text event_id PK "Stripe event id: each is handled once"
        timestamptz received_at
    }
```

**Rules**

- A patient pays by card once the visit is confirmed (also while a new time is proposed, the team is on the way, or after collection). The med team takes cash once they are on the way, for the whole total.
- Paying (card or cash) sets `appointments.payment_status` to `paid` and adds a "Paid" event, in the same transaction. A ₱0 visit (a return visit) is `paid` from the start.
- A refund is above ₱0 and at most what is left. Card refunds go through Stripe; cash refunds are only recorded. The payment and the appointment become `partially_refunded`, then `refunded`.
- Refunds are never automatic. A paid visit that is cancelled or rejected is flagged **Needs refund** until an admin refunds it.
- Stripe may send a webhook more than once: `payment_webhook_events` makes a repeat do nothing.

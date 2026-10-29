# ERD: Results

Tables added by Module 6. Each collected test of a visit gets one result: a private file (PDF or photo) and an optional comment.

```mermaid
erDiagram
    appointments ||--o{ test_results : "has"
    lab_procedures ||--o{ test_results : "for"
    users ||--o{ test_results : "uploaded / released"

    test_results {
        uuid id PK
        uuid appointment_id FK
        uuid procedure_id FK "unique with appointment_id: one result per test"
        text filename
        text mime_type "application/pdf | image/jpeg | image/png | image/webp"
        integer size_bytes "at most 5 MB"
        text storage_key "private store: never a public link"
        text comment
        uuid uploaded_by FK
        timestamptz uploaded_at
        uuid released_by FK
        timestamptz released_at "null while a draft"
    }
```

**Rules**

- Results go on the **collected** tests of a **collected** visit. A new upload replaces the draft (the old file is deleted).
- **Release** needs a result for every collected test, happens once, adds a "Results released" event and emails the patient. Released results can't be replaced or removed.
- The patient sees results once they're released **and** the visit is paid (a ₱0 return visit counts as paid). Before that: "pending" (with the doctor) or "locked" (ready, pay to view).
- Files are opened through `GET /api/results/:id/file`, which checks access first: doctors (`results.review`) any time, the patient once ready. In production it redirects to a Cloudinary link that expires after 5 minutes; locally it sends the file.
- `payments.duplicate`: a card payment that completed after the visit was already paid (e.g. cash). It's flagged **Needs refund**.

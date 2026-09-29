# ERD: Identity & Accounts

Tables added by Module 1 (Authentication & Accounts). Custom roles and permissions are added in Module 2.

```mermaid
erDiagram
    roles ||--o{ users : "base role of"
    users ||--o| patients : "patient profile"
    users ||--o| employees : "staff profile"
    users ||--o{ sessions : "signs in with"

    roles {
        text id PK "patient | med_team | doctor | support | admin"
        text name
    }
    users {
        uuid id PK
        text email UK "stored lower-case"
        text password_hash "bcrypt"
        text role_id FK
        text first_name
        text last_name
        text phone
        boolean must_change_password "true after a temporary password"
        boolean is_active
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }
    patients {
        uuid user_id PK, FK
        date birth_date
        text address
        timestamptz created_at
        timestamptz updated_at
    }
    employees {
        uuid user_id PK, FK
        date hired_on
        timestamptz created_at
        timestamptz updated_at
    }
    sessions {
        uuid id PK "the JWT's sid claim"
        uuid user_id FK
        timestamptz created_at
        timestamptz expires_at
        timestamptz revoked_at "set on logout / deactivation"
        text ip_address
        text user_agent
    }
```

**Notes**

- Every access token names its session. A request is only accepted while that session is neither expired nor revoked and the user is active, so logout and deactivation take effect immediately.
- Names and phone live on `users` because every role has them. `patients` and `employees` hold only role-specific fields.

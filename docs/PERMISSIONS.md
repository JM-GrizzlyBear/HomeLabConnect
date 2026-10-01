# HomeLabConnect: Roles & Permissions

Access is checked per **permission**, never per role. A permission key is `<module>.<action>`, e.g. `payments.refund`. The catalogue of **21 modules and 67 permissions** lives in [`packages/shared/src/permissions.ts`](../packages/shared/src/permissions.ts), the single source of truth used by:

- **the seed:** `turbo run db:seed` syncs the `modules`, `permissions` and `role_permissions` tables to it;
- **the API:** routes are guarded with `RequirePermission("users.create")`;
- **the client:** menu entries and buttons are shown with `useCan()` / `RequirePermission`.

## How a permission is decided

For each key, the first layer with an opinion decides:

1. **User override**: a per-user grant or deny, optionally with an expiry. Expired overrides are ignored.
2. **Custom role**: a grant or deny from the user's custom role (e.g. _Senior Med Tech_).
3. **Base role**: what the user's base role grants.
4. Otherwise **denied**.

**Admins always have every permission** at the base layer, and admin base grants can't be edited, so nobody can lock the admins out. A custom role built on admin (e.g. _President_) can still deny specific keys.

Permissions are resolved **on every request**, so a changed role or override applies on the user's next click without signing in again. Login, `/auth/me` and password change return the user's effective `permissions` so the client can hide what they can't use.

## Custom roles

Admins with `roles.manage` build custom roles at **Users → Roles & Permissions**. A custom role:

- is **built on one base role**, which is fixed once the role exists;
- lists only what it **changes**: each permission is _Inherit_ (the default), _Allow_ or _Deny_;
- can only be given to users of the same base role, by someone with `roles.assign` (from the "⋯" menu on All Users, or when creating a staff account);
- can't be deleted while anyone holds it;
- can't be given to yourself, so an admin can't lock themselves out.

Seeded examples:

| Role            | Built on | Changes                                                 |
| --------------- | -------- | ------------------------------------------------------- |
| President       | Admin    | denies `settings.manage`, `roles.manage`                |
| Senior Med Tech | Med Team | allows `routes.manage`, `teams.roster`, `leave.approve` |

## Catalogue and default grants

**P** patient · **M** med team · **D** doctor · **S** support. Admin has everything.

| Module       | Permissions                                                                  | P                              | M           | D                       | S                         |
| ------------ | ---------------------------------------------------------------------------- | ------------------------------ | ----------- | ----------------------- | ------------------------- |
| dashboard    | view                                                                         | ✓                              | ✓           | ✓                       | ✓                         |
| users        | view, create, update, deactivate, reset_password, export                     |                                |             |                         | view                      |
| roles        | view, manage, assign                                                         |                                |             |                         |                           |
| permissions  | view, override                                                               |                                |             |                         |                           |
| procedures   | view, manage                                                                 | view                           | view        | view                    | view                      |
| promotions   | view, manage                                                                 | view                           |             |                         | view                      |
| shifts       | view_own, view, manage                                                       |                                | view_own    | view_own                | view_own                  |
| leave        | request, view, approve                                                       |                                | request     | request                 | request                   |
| holidays     | view, manage                                                                 |                                | view        | view                    | view                      |
| teams        | view, manage, roster                                                         |                                | view        |                         |                           |
| appointments | book, view_own, view_all, accept, reject, reschedule, assign, cancel, review | book, view_own, cancel, review |             | view_all                | view_all, reschedule      |
| visits       | view_assigned, collect, schedule_return                                      |                                | all         |                         |                           |
| routes       | view, manage                                                                 |                                | view        |                         |                           |
| notes        | view, create, attach                                                         |                                | all         | view, create            | view                      |
| results      | view_own, review, upload, release                                            | view_own                       |             | review, upload, release |                           |
| payments     | pay, view_own, view_all, record_cash, refund, export                         | pay, view_own                  | record_cash |                         | view_all                  |
| support      | create_ticket, view_own, view_queue, handle, assign, close                   | create_ticket, view_own        |             |                         | view_queue, handle, close |
| chat         | use                                                                          | ✓                              | ✓           | ✓                       | ✓                         |
| audit        | view                                                                         |                                |             |                         |                           |
| reports      | view, save, export                                                           |                                |             |                         |                           |
| settings     | view, manage                                                                 |                                |             |                         |                           |

### What "view" shows in the catalogue

- `procedures.view` shows **active** procedures only. People with `procedures.manage` also see inactive ones and can filter by status; for everyone else an inactive procedure answers 404.
- Category changes (add, rename, delete) need `procedures.manage`.
- `promotions.view` shows **running** promotions only; `promotions.manage` sees every status and can create, edit and switch them off. Sale prices in the procedure list are shown to everyone with `procedures.view`, even without `promotions.view`.

## Adding a permission (for a new module)

1. Add the action to its module in `packages/shared/src/permissions.ts` (and to `defaultBaseGrants` if a base role should have it). Update the counts in the catalogue test and the table above.
2. Run `turbo run db:seed` to sync the database.
3. Guard the API route: `adapt(controller, ...can("module.action"))` in `routes.ts`.
4. Give the menu entry `permission: "module.action"`, and hide buttons with `useCan()`.

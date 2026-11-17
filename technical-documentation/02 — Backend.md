# SIMPUSKAPA — Backend

> The NestJS API of SIMPUSKAPA. Covers `src/server/**`, `prisma/`, the data
> model, business flows, and the open API-side work. For system context see
> [00 — Architecture Overview.md](./00%20—%20Architecture%20Overview.md); for the
> client see [01 — Frontend.md](./01%20—%20Frontend.md).

> **Branch scope:** describes the **`trunk`** branch. The two backend files that
> leaked secrets to logs were fixed by the `fe/optimization` merge (`4e35c487`,
> 2026-06-01) — see §6.0, now **DONE**. Everything else here is current `trunk`
> state. §6 lists API-side work the **frontend is waiting on**; §10 lists pure
> backend debt.

---

## 1. Stack

| Concern    | Choice                                                           |
| ---------- | ---------------------------------------------------------------- |
| Framework  | **NestJS 9.4.1** on Express                                      |
| ORM        | **Prisma 4.11.0** → PostgreSQL                                   |
| Sessions   | Redis (client file misnamed `memached.client.ts`)                |
| Storage    | AWS S3 (presigned URLs)                                          |
| Mail       | Nodemailer                                                       |
| Monitoring | Sentry                                                           |
| API docs   | OpenAPI/Swagger (`/swagger`, `/swagger-json`) + Scalar (`/docs`) |
| Testing    | Jest (unit — currently minimal)                                  |

Build: `nest build` via `tsconfig.server.json` → `dist-server/server/main.js`.
Entrypoint [src/server/main.ts](src/server/main.ts). All routes versioned `/v1/...`.

---

## 2. Layout

```
src/server/
├── controllers/   # HTTP route handlers (12)
├── services/      # business logic
├── repositories/  # Prisma data-access layer
├── middleware/    # auth.jwt.middleware.ts (session check)
├── common/        # prisma client, redis client, exception filters
├── commands/      # CLI/console commands (mail transporter, bucket creation)
└── main.ts        # Nest bootstrap
prisma/            # schema.prisma, migrations, seeders
```

Cross-cutting in [src/server/common/](src/server/common/):

- `prisma.client.ts` — shared Prisma client (`CommonPrismaClient`).
- `memached.client.ts` — Redis client (`CommonRedisClient`) for sessions
  (filename is a "memcached" typo; it is Redis).
- `catch.response.ts` — global exception filters (validation, not-found,
  bad-request, Prisma, unauthorized).

---

## 3. Module map

Wired in [app.module.ts](src/server/app.module.ts). Uniform pattern:
**Controller → Service → Repository → Prisma.**

| Domain                               | Controller                       | Service                    | Key repositories                                                                      |
| ------------------------------------ | -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Identity / users / ACL               | `user.controller`                | `user.service`             | `user.repository`                                                                     |
| Employees, contracts, trainings      | `employee.controller`            | `employee.service`         | `employee.repository`, `employee.contract.repository`, `employee.training.repository` |
| Performance                          | `employee.performace.controller` | (in employee service)      | `employee.performance.repository`                                                     |
| Time-off                             | `timeoff.controller`             | `time.off.request.service` | `time.off.quota.repository`                                                           |
| Programs & budgets                   | `program.controller`             | `program.service`          | `program.repository`, `budget.repository`, `activity.repository`                      |
| Projects                             | `project.controller`             | `project.service`          | `project.repository`                                                                  |
| Requisition Forms (RF)               | `rf.controller`                  | `rf.service`               | `rf.repository`                                                                       |
| Payment Requests (PR)                | `pr.controller`                  | `pr.service`               | `pr.repository`                                                                       |
| Vendors                              | `vendor.controller`              | `vendor.service`           | `vendor.repository`, `vendor.package.repository`                                      |
| Partners                             | `partner.controller`             | `partner.service`          | `partner.repository`                                                                  |
| Files (S3)                           | `file.controller`                | `file.service`             | —                                                                                     |
| Metadata / dashboard / notifications | `metadata.controller`            | `metadata.service`         | `notification.repository`, `general.repository`, `mail.repository`                    |

> Business logic is split between service and repository — when in doubt about a
> rule, read both together. Largest services encode real rules: `pr.service.ts`
> (~2.1k lines), `program.service.ts` (~1.5k), `rf.service.ts` (~1.46k).

---

## 4. Authentication & authorization

### Login

Two paths, both [user.controller.ts](src/server/controllers/user.controller.ts) →
[user.service.ts](src/server/services/user.service.ts):

1. **Google OAuth** — `/v1/auth/oauth/google` → `/v1/auth/oauth/google/callback`,
   restricted to `ALLOWED_EMAIL_DOMAINS`.
2. **Credential login** — `/v1/auth/login` (and `/v1/auth/login-arbitary`).

On success the API issues `auth_token` (short-lived) + `refresh_token`
(`refreshTTl = '14d'`).

### Server session — the real auth control

A server-side session lives in Redis under `session:<userId>`.
[auth.jwt.middleware.ts](src/server/middleware/auth.jwt.middleware.ts) rejects any
request whose user has no live Redis session or is inactive. **Logout / revoke =
delete the Redis key.** This is the authoritative gate — not the FE.

### Authorization model (ACL)

Fine-grained ACL **keys**, not just roles:

- **Roles** — [role.access.ts](src/shared/role.access.ts): `staff`, `supervisor`,
  `hr_team`, `admin`, `superadmin`, `head_of_finance`, `head_of_operation`,
  `finance_team`, `ops_team`.
- **ACL keys** — [acl.labels.ts](src/shared/acl.labels.ts): granular permissions
  (`EMPLOYEE_UPDATE_ANY/_SUBORDINATE/_SELF`). Scope: org-wide / direct reports /
  own record. Bundled into `acl_templates` and assigned to users.

> **Invariant:** every protected endpoint must authorize the caller server-side
> from the session/ACL and trust no client-sent role/claim. The FE ACL gate is a
> UX affordance and is trivially bypassable. See §6.3.

---

## 5. Domain & business flows

### 5.1 Money pipeline

```
Program (Budget + Activities + Perdiem)  →  Project  →  RF  →  PR
```

- **Program** approval: `pending → revision → success | rejected | cancelled`
  (legacy misspelled enum value `deafted` — code may depend on the literal
  string; check before renaming). Budget availability checked via
  `remaining-budget-rf`, `remaining-budget-by-activity-id`,
  `pending-requested-buget`, `paid-buget`.
- **RF** — [rf.type.ts](src/shared/rf.type.ts): 4 types `PROCUREMENT`,
  `PERSONAL_HIRE`, `TRAVEL`, `STAFF_COST`; routes under
  `/v1/programs/:program_id/projects/:project_id/rf/<type>`. Lifecycle:
  create → `/rf/:rf_id/approval` → `/rfs/:id/action-by/ack` →
  `/rf/close-rf/:rf_id`. Multi-party (`RFApprovalBy`).
- **PR** — [pr.type.ts](src/shared/pr.type.ts): 5 variants (`payment-request`,
  `advance-payment-request`, `advance-perdiem-fee`, `travel-expense`,
  `advance-payment-statement`). Approval status
  `pending → approved | rejected | revision`; chain (`PRApprovalBy`) Program
  Manager → Budget Controller → Head of Operation → Head of Finance. Finance
  processing state machine on `/v1/payment-requests/:id`:
  `set-ready-to-process → mark-on-checking ⇄ unmark → checking-passed |
checking-revision → mark-processed ⇄ unmark → mark-paid`. Tax via `tax_tier`,
  recalculated by `/v1/pr/:id/tax-recalculation`; audited in `finance_logs`.

### 5.2 People & time-off

- **Employees** — `employee_contracts`, trainings, `performances`
  (`DocType: planning | mid_year | end_year`).
- **Time-off** — `LeaveType` (annual, sick certified/uncertified, special,
  compensatory, maternity, paternity, work_remotely, …); `TimeOffRequestStatus`
  (`requested → approved | declined | rejected | cancelled`). Annual quota reset
  tracked (`annual_timeoff_reset_history`, `/v1/timeoff/annual-timeoff-reset`).

### 5.3 Files

All file IO via S3 presigned URLs
([file.controller.ts](src/server/controllers/file.controller.ts)):
`presign/upload`, `presign/download`, delete. The browser uploads/downloads
**direct to S3** — the API only mints URLs. Buckets created by the console
command `pnpm make:buckets`.

---

## 6. Open API-side / backend security work (frontend is waiting on these)

> **This entire section is backend-owned and kept separate from the frontend debt
> list** in [01 — Frontend.md](./01%20—%20Frontend.md) §12, so there is no overlap:
> if it needs an API/contract/server change, it lives here.

### 6.0 Secret-leaking logs — FIXED on trunk (via `fe/optimization` merge)

The two backend files that leaked secrets to logs were fixed by merge `4e35c487`
(2026-06-01):

- [src/server/commands/create.bucket.ts](src/server/commands/create.bucket.ts) —
  the `console.log`s of `S3_ACCESS_KEY` / `S3_SECRET_KEY` are **removed**. (It
  still logs `S3_ENDPOINT` / `S3_REGION` on startup — non-secret, acceptable.)
- [src/server/middleware/auth.jwt.middleware.ts](src/server/middleware/auth.jwt.middleware.ts) —
  the JWT/session-claim `console.log` is **removed**. (A `console.log(err)` /
  `console.error(sessionError)` on the error paths remains — no claims.)

**Status: DONE.** No action needed beyond rotating any S3 keys that may have been
exposed in historical logs before the fix landed.

### 6.1 Stop accepting tokens in URL query strings (security, high)

FE refresh still calls `GET /v1/auth/refresh?refresh_token=…`, and the
login/OAuth handoff passes tokens in the redirect URL — they leak into access
logs, proxies, history, `Referer`. **(FE cannot fix without a new endpoint.)**

**Requested:**

- Add `POST /v1/auth/refresh` taking `{ refresh_token }` in the **body** (or an
  `Authorization` header).
- For login/OAuth, set tokens as **Set-Cookie** (httpOnly for `refresh_token`)
  instead of redirect-URL params.

Then the FE drops query-string token passing in `middleware.ts` / `welcome` /
OAuth-callback handoff.

### 6.2 Make `auth_token` cookie `httpOnly` (security, high)

`auth_token` is `httpOnly: false` so client JS can decode roles for the ACL gate
→ any XSS becomes token theft. **(FE cannot flip this without a BE source for claims.)**

**Requested (pick one):**

- Expose `GET /v1/auth/me` returning the current user's roles/claims, so the FE
  stops decoding the JWT client-side and `auth_token` can become
  `httpOnly: true`; **or**
- Issue a separate **non-sensitive** cookie carrying only ACL claims (not a
  usable bearer), leaving the real `auth_token` httpOnly.

### 6.3 Confirm server-side authorization (security, must-confirm)

The FE gate is UX only. **Confirm every protected endpoint independently
authorizes the caller's role/ACL server-side and trusts no FE-sent claim.**

### 6.4 Confirm arbitrary/dev login is disabled in production (security)

FE has a dev-login affordance gated on `APP_ENV !== 'NONE'`
(`/v1/auth/login-arbitary`). **Confirm** prod env closes the FE gate **and** the
backend rejects the arbitrary-login endpoint in prod regardless of the FE.

### 6.5 Sanitize log/activity `message` HTML at the source (defense-in-depth)

The FE now renders `log.message` through DOMPurify (`SafeHtml`, merged to `trunk`).
That's client-side defense only — **also sanitize/escape HTML on write** so stored
data is safe for any client that reads it directly (API consumers, exports).

### 6.6 Add a batch presign endpoint (performance)

`getServerSideProps` on detail pages presigns **per item** (N+1). Add a batch
presign endpoint taking `[{ bucket, key }]` and returning all signed URLs in one
call; the FE replaces the loop with a single request.

---

## 7. Data layer

- Schema: [prisma/schema.prisma](prisma/schema.prisma) — ~30 models + enums.
- ~121 migrations in `prisma/migrations/`. Prefer `migrate deploy` in prod,
  `migrate dev` locally. Seeders in `prisma/seeder/` (`pnpm prisma db seed`).
- Core tables: `users`, `acl_templates`, `employee`, `employee_contracts`,
  `programs`, `projects`, `activities`, `budgets`, `requisition_form`,
  `payment_request`, `tax_tier`, `finance_logs`, `vendor*`, `partners`,
  `notifications`, `time_off_request`.

**Enum cleanups to schedule (string literals may be referenced — check first):**

- `MaritalStatus` has both `maried` and `married` — consolidate via migration.
- `ProgramApproval` contains misspelled `deafted` ("drafted").

---

## 8. Environment

Read from `.env`. No `.env.example` — create one from placeholders.

| Variable                                                                         | Used for                        |
| -------------------------------------------------------------------------------- | ------------------------------- |
| `DATABASE_URL` / `DATABASE_URL_TEST`                                             | Postgres (Prisma) / tests       |
| `NEST_PORT` / `PORT`                                                             | API listen port (default 8000)  |
| `JWT_SECRET`                                                                     | JWT signing                     |
| `ALLOW_CLIENT`                                                                   | CORS allow-list                 |
| `ALLOWED_EMAIL_DOMAINS`                                                          | Google OAuth domain restriction |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_SECRET_KEY`                             | Google OAuth                    |
| `GOOGLE_CALLBACK_URI` / `GOOGLE_REDIRECT_URI` / `GOOGLE_OAUTH_REDIRECT_FE`       | OAuth redirects                 |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_REGION`                                  | AWS S3                          |
| `SENTRY_DSN`                                                                     | Sentry                          |
| `NEXT_PUBLIC_MAIN_URL_FE` / `NEXT_PUBLIC_MAIN_URL_BE` / `NEXT_PUBLIC_API_URL_FE` | Public FE/BE base URLs          |
| `NEXT_PUBLIC_APP_ENV` / `NEXT_PUBLIC_APP_VERSION` / `NEXT_PUBLIC_ASSETS`         | Env / version / asset base      |
| `NEXT_SIMPUSKAPA_SDK_HOST`                                                       | SDK generation host             |

Per-env files in [deployment/envs/](deployment/envs/).

---

## 9. SDK contract sync (process)

`sdk/` is generated from the live Swagger spec
(`pnpm gen:init && pnpm gen:client`). A stale SDK causes silent runtime shape
mismatches. **Whenever the API contract changes, publish the updated swagger and
re-run `pnpm gen:client`** — ideally enforce it in CI.

---

## 10. Backend technical debt to schedule (no FE dependency)

This list is **backend-only** and intentionally disjoint from the frontend list
in [01 — Frontend.md](./01%20—%20Frontend.md) §12, so each team owns its column.

1. **(DONE)** Secret-log removal landed via the `fe/optimization` merge (§6.0) —
   S3 access/secret keys and session claims are no longer logged. Rotate any S3
   keys that may have leaked into historical logs.
2. **No `.env.example`**; ensure real `.env`, `*.pem`, and any `multi_backup.sql`
   dump are gitignored. **Rotate all secrets after any handover.**
3. **TypeScript strict mode off** across the repo.
4. **Dependencies aging:** NestJS 9, Prisma 4, TS 4.7 — plan staged upgrades.
5. **Very large services carrying real business rules** — refactor incrementally
   with tests: `pr.service.ts`, `program.service.ts`, `rf.service.ts`,
   `utils/saveExcelRf.ts`.
6. **Backend services have ~0 unit tests** — add coverage on the finance/PR state
   machine first (highest business risk).
7. **Enum cleanups** (`maried`/`married`, `deafted`) — §7, behind migrations.
8. **API security items in §6** (token-in-query, `httpOnly`, server-side authz
   confirmation, arbitrary-login lockdown, HTML-on-write sanitization, batch
   presign) — these unblock the FE and are all backend work.

---

_Describes the `trunk` branch. Cross-check line counts and routes against
`/swagger-json` on the live API._

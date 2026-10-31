# SIMPUSKAPA — Architecture Overview

> Management Information System for **PUSKAPA** (Pusat Kajian dan Advokasi
> Perlindungan dan Kualitas Hidup Anak — Center for Study and Advocacy on Child
> Protection and Quality of Life), an internal back-office system for an NGO.
>
> This is the **system-level** document. For each side in depth see
> [01 — Frontend.md](./01%20—%20Frontend.md) and
> [02 — Backend.md](./02%20—%20Backend.md). For commands see `README.md`.

> **Branch scope.** This documentation describes the **`trunk`** branch — the
> integration branch and the source of truth for current behaviour. The
> **`fe/optimization`** security + performance pass has now been **merged into
> `trunk`** (merge `4e35c487`, 2026-06-01); all its items are live. The remaining
> open items in §7 are **API/backend-dependent** work that was never part of that
> branch (they need new BE endpoints or repo-wide changes). Where a section names
> a status, check the flag — don't assume.

---

## 1. What this system is

A single-repository, two-process system covering:

- **HR / People** — employees, contracts, trainings, performance evaluations, time-off.
- **Programs & Projects** — program budgets, activities, perdiem settings, fund-received tracking.
- **Procurement** — Requisition Forms (RF): procurement, travel, personal hire, staff cost.
- **Finance** — Payment Requests (PR) and 5 variants, tax tiers, finance reporting.
- **Vendors & Partners** — vendor registration, categories, packages, partners.
- **Admin** — users, ACL templates (role-based access control).

---

## 2. Architecture

**Hybrid Next.js + NestJS monorepo, two runtime processes.** Frontend and
backend share one repo but build and run separately.

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│    ▼                                                         │
│  Next.js app (Pages Router)                                  │
│    - src/pages/**          (routes, getServerSideProps, SEO) │
│    - src/middleware.ts     (auth gate on /dashboard/*)       │
│    - sdk/ generated client ───────────────────────► API      │
│    - S3 presigned URLs ──────────────────────────► S3 direct │
└───────────────────────────────────────────────┬──────────────┘
                                                │
┌───────────────────────────────────────────────▼─────────────┐
│  NestJS API (src/server/**)                                 │
│    Controller → Service → Repository → Prisma → PostgreSQL  │
│    + Redis (sessions), AWS S3 (files), Nodemailer (mail)    │
│    + Sentry (errors), Swagger/Scalar (/swagger, /docs)      │
└─────────────────────────────────────────────────────────────┘
```

| Layer         | Technology                                                                |
| ------------- | ------------------------------------------------------------------------- |
| Frontend      | Next.js 13.2.4 (Pages Router), React 18.2, TypeScript 4.7.4, Tailwind 3.3 |
| Backend       | NestJS 9.4.1, Express, Prisma ORM 4.11.0                                  |
| Database      | PostgreSQL                                                                |
| Cache/Session | Redis (client file misnamed `memached.client.ts`)                         |
| Storage       | AWS S3 (presigned URLs)                                                   |
| Mail          | Nodemailer                                                                |
| Monitoring    | Sentry                                                                    |
| API docs      | OpenAPI/Swagger (`/swagger`) + Scalar (`/docs`)                           |
| Testing       | Jest (unit), Playwright (E2E)                                             |
| Package mgr   | pnpm (`pnpm@9.6.0`)                                                       |

**Node baseline:** `.tool-versions` pins Node 20.18.1; production PM2 scripts have
historically run Node 18.17.0. Treat **Node 18 LTS** as the safe production
baseline; confirm with the deploy server before upgrading.

### Build targets

- **Frontend:** `next build` → `.next`.
- **Backend:** `nest build` (`tsconfig.server.json`) → `dist-server/server/main.js`.
  Entrypoint [src/server/main.ts](src/server/main.ts).

---

## 3. Repository layout (top level)

```
src/
├── pages/          # Next.js routes (Pages Router), gated under /dashboard
├── middleware.ts   # Next edge middleware — FE auth gate
├── server/         # NestJS backend (controllers/services/repositories/...)
├── shared/         # types/libs used by BOTH FE & BE (jwt, role, acl, pr/rf enums)
├── providers/      # React context (ACL gate, dashboard state, form wizards)
├── layout/         # large feature page layouts (the real screens)
├── components/     # reusable UI (ui/, radix/, icon/)
├── hooks/          # pagination, search, sorting, filter, acl gate
└── utils/          # SDK wrappers, auth helpers, excel exports, constants
sdk/                # GENERATED typescript-axios client — DO NOT hand-edit
prisma/             # schema.prisma, migrations, seeders
deployment/         # artifact build + deploy scripts, per-env .env files
```

`src/shared/` is the contract seam between the two processes — JWT encode/decode,
role names, ACL keys, PR/RF enums all live there and are imported by both sides.

---

## 4. The core domain — the money pipeline

The two flows carrying the most business logic (and the largest files) are
**Requisition Forms (RF)** and **Payment Requests (PR)**.

```
Program (Budget + Activities + Perdiem settings)
   └── Project
         └── Requisition Form (RF)        ← request to spend against budget
               └── Payment Request (PR)   ← actual disbursement + tax
```

- **Program** approval: `pending → revision → success | rejected | cancelled`
  (note the legacy misspelled enum value `deafted`). Carries budgets and
  fund-received history. Budget availability is checked at several points
  (`remaining-budget-rf`, `remaining-budget-by-activity-id`,
  `pending-requested-buget`, `paid-buget`).
- **RF** — 4 types: `PROCUREMENT`, `PERSONAL_HIRE`, `TRAVEL`, `STAFF_COST`.
  Lifecycle: create → approval → acknowledge → close. Multi-party approvals.
- **PR** — 5 variants: `payment-request`, `advance-payment-request`,
  `advance-perdiem-fee`, `travel-expense`, `advance-payment-statement`.
  Approval chain: Program Manager → Budget Controller → Head of Operation →
  Head of Finance. Finance processing state machine
  (`set-ready-to-process → mark-on-checking ⇄ unmark → checking-passed |
checking-revision → mark-processed ⇄ unmark → mark-paid`). Tax via `tax_tier`,
  recalculated by `/v1/pr/:id/tax-recalculation`; actions audited in `finance_logs`.

The FE mirrors this pipeline across routes; the cross-page budget→RF→PR carriers
live in `DashboardProvider` + `localStorage` (see Frontend §state).

---

## 5. Authentication & authorization (system view)

- **Login:** Google OAuth (`/v1/auth/oauth/google`, restricted to
  `ALLOWED_EMAIL_DOMAINS`) or credential login (`/v1/auth/login`).
- **Tokens:** API issues a pair — short-lived `auth_token` and long-lived
  `refresh_token` (`refreshTTl = '14d'`).
- **Server session:** stored in Redis under `session:<userId>`; backend
  [auth.jwt.middleware.ts](src/server/middleware/auth.jwt.middleware.ts) rejects
  any request with no live session or an inactive user — logout = delete the key.
- **FE gate:** [src/middleware.ts](src/middleware.ts) guards `/dashboard/:path*`,
  refreshing tokens and rewriting cookies as needed.
- **ACL:** fine-grained keys (`EMPLOYEE_UPDATE_ANY/_SUBORDINATE/_SELF`) bundled
  into `acl_templates`. Roles + keys in
  [src/shared/role.access.ts](src/shared/role.access.ts),
  [src/shared/acl.labels.ts](src/shared/acl.labels.ts).

> **Security invariant:** the FE ACL gate is a UX affordance only. Every
> protected endpoint must authorize the caller server-side and trust no FE-sent
> claim. See Backend §security for the items that depend on this.

---

## 6. Environment & deployment

- Env vars read from `.env` (no `.env.example` — create one from Backend §env,
  placeholders only). Per-env files in [deployment/envs/](deployment/envs/).
- **Deploy — two generations of tooling exist; confirm which is authoritative
  with whoever operates the servers.**
  - **Artifact flow (preferred):** `pnpm deploy:build` → builds, zips `.next`,
    uploads to `s3://simpuskapa-web-builds/webapp/`; `pnpm deploy:update` →
    SSH, pull, swap `.next`, restart PM2.
  - **Legacy flow:** `pnpm deploy:fe` / `deploy:be` — SFTP + `systemctl restart`.
- **CI:** `.github/workflows/{staging,prod}.yml`, `workflow_dispatch` only
  (manual). No automated lint/test gate before build — add one (see both side docs).

| Env         | FE host         | API/SSH host             | Notes                           |
| ----------- | --------------- | ------------------------ | ------------------------------- |
| Development | `103.150.92.73` | same                     | PM2 process `web`               |
| Staging     | `13.214.75.123` | `ec2-user@13.214.75.123` | AWS EC2, PM2                    |
| Production  | `18.138.190.9`  | `ec2-user@18.138.190.9`  | AWS EC2, PM2 — verify live host |

---

## 7. Branch & optimization map

`trunk` is the integration branch. The `fe/optimization` security + performance
pass is **now merged into `trunk`** (merge `4e35c487`, 2026-06-01). The table
below is the authoritative cross-reference; each side's doc carries the same
status flags. The remaining **OPEN** rows are backend/API-dependent and were never
part of `fe/optimization`.

| Item                                         | On `trunk` now                                         | Source                   | Status        | Owner     |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------ | ------------- | --------- |
| Open-redirect guard in `refresh.tsx`         | **Present** (`getSafeRedirect`)                        | landed on trunk directly | **DONE**      | FE        |
| `ssrAuth` helpers (no-throw token/JWT parse) | **Present** (`src/utils/ssrAuth.ts`)                   | `fe/optimization`        | **DONE**      | FE        |
| `SafeHtml` (DOMPurify) for log HTML          | **Present** — used in 7 former raw-HTML sinks          | `fe/optimization`        | **DONE**      | FE        |
| Top-level `ErrorBoundary` in `_app`          | **Present** (`src/components/ErrorBoundary.tsx`)       | `fe/optimization`        | **DONE**      | FE        |
| `getPaymentBasedOnBudgetCode` O(n²)→O(n)     | **O(n)** (`Map` + `buildBudgetResult`)                 | `fe/optimization`        | **DONE**      | FE        |
| Lazy-load excel libs                         | **Lazy** (`await import('exceljs')` in export handler) | `fe/optimization`        | **DONE**      | FE        |
| Travel-expenses scroll-listener leak         | **Fixed** (scoped cleanup)                             | `fe/optimization`        | **DONE**      | FE        |
| Stop logging secrets in `create.bucket.ts`   | **Removed** (S3 access/secret key logs dropped)        | `fe/optimization`        | **DONE**      | BE (file) |
| Stop logging JWT/session claims in auth mw   | **Removed**                                            | `fe/optimization`        | **DONE**      | BE (file) |
| `auth_token` cookie `httpOnly: false`        | yes (by design, for ACL decode)                        | needs BE endpoint        | **OPEN (BE)** | BE        |
| `refresh_token` in URL query string          | yes (`GET /v1/auth/refresh?refresh_token=`)            | needs BE endpoint        | **OPEN (BE)** | BE        |
| Batch presign endpoint (N+1)                 | per-item presign                                       | needs BE endpoint        | **OPEN (BE)** | BE        |
| TS strict mode off                           | off                                                    | repo-wide                | **OPEN**      | both      |
| CI lint/build gate                           | none                                                   | repo-wide                | **OPEN**      | both      |

> **Done:** `fe/optimization` is merged — run `pnpm lint && pnpm build:next` and
> smoke-test as part of the next release. Remaining frontend debt is in
> [01 — Frontend.md](./01%20—%20Frontend.md) §12; backend / API-dependent debt in
> [02 — Backend.md](./02%20—%20Backend.md) §6
>
> - §10. The two lists are kept disjoint so each team owns its column.

---

## 8. Onboarding path (new owner)

1. Get access: GitHub, AWS (S3 `simpuskapa-web-builds`, EC2), SSH keys, Google
   OAuth console, Sentry, Postgres.
2. **Rotate every secret handed over** (`.env`, `*.pem`, OAuth secret, JWT
   secret, AWS keys). The repo root has historically contained `.env`, `*.pem`,
   and a `multi_backup.sql` dump — confirm these are gitignored / removed.
3. Run locally: `pnpm install` → Postgres → `npx prisma migrate dev` →
   `npx prisma db seed` → `pnpm start:dev`. Open `/swagger` + `/docs`.
4. Read [01 — Frontend.md](./01%20—%20Frontend.md) then
   [02 — Backend.md](./02%20—%20Backend.md); trace one money-flow path end to end.
5. Review §7 — `fe/optimization` is merged; the remaining OPEN rows are
   backend/API work for you to pick up.
6. Confirm the live deploy flow and prod host before touching production.

---

_Describes the `trunk` branch. Line counts and hosts are approximate —
cross-check against the live system._

# SIMPUSKAPA — Frontend

> The Next.js client of SIMPUSKAPA. Covers only the frontend: `src/pages`,
> `src/layout`, `src/components`, `src/providers`, `src/hooks`, `src/utils`,
> `src/shared`, `src/styles`, `src/middleware.ts`, `sdk/`. For system context see
> [00 — Architecture Overview.md](./00%20—%20Architecture%20Overview.md); for the
> API see [02 — Backend.md](./02%20—%20Backend.md).

> **Branch scope:** describes the **`trunk`** branch. The `fe/optimization`
> security + performance pass is **now merged into `trunk`** (merge `4e35c487`,
> 2026-06-01) — all its FE items are live. §11 records what landed; §12 lists the
> FE debt that remains (no BE dependency).

---

## 1. Stack

| Concern         | Choice                                                                 |
| --------------- | ---------------------------------------------------------------------- |
| Framework       | **Next.js 13.2.4 — Pages Router** (not App Router)                     |
| Language        | TypeScript 4.7.4 (`strict: false`, `strictNullChecks: false`)          |
| UI runtime      | React 18.2                                                             |
| Styling         | TailwindCSS 3.3 + design tokens; shadcn/ui + Radix primitives          |
| Data fetching   | `getServerSideProps` (SSR) + **SWR / `swr/mutation`** (client)         |
| API client      | **auto-generated `typescript-axios` SDK** in `sdk/` (do not hand-edit) |
| Forms           | `react-hook-form` 7.43 + multi-step wizard providers                   |
| Tables          | `@tanstack/react-table` 8.9 (`TableCore` / `TableCoreSSR`)             |
| Auth (FE)       | JWT cookies + `src/middleware.ts` edge gate; ACL via React providers   |
| State           | React Context + `localStorage` / `sessionStorage` (no Redux/Zustand)   |
| Notifications   | `react-toastify` · Route progress: `nprogress` · Monitoring: Sentry    |
| Excel export    | `exceljs` / `jszip` / `file-saver`                                     |
| Package manager | **pnpm** (`pnpm@9.6.0`)                                                |

---

## 2. Run & build

```bash
pnpm install
pnpm start:next-dev      # next dev — frontend only
pnpm build:next          # next build → .next
pnpm analyze             # ANALYZE=true next build (bundle analyzer)
pnpm lint                # eslint --fix + prettier --write
pnpm gen:client          # regenerate sdk/ from live swagger spec
```

Required `NEXT_PUBLIC_*` env (read in [src/utils/constant.ts](src/utils/constant.ts)):

| Var                       | Use                                                                     |
| ------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_MAIN_URL_FE` | FE base URL (SEO, redirects)                                            |
| `NEXT_PUBLIC_MAIN_URL_BE` | **API base** — all SDK calls hit this                                   |
| `NEXT_PUBLIC_API_URL_FE`  | FE API base                                                             |
| `NEXT_PUBLIC_S3_ENDPOINT` | S3 asset endpoint                                                       |
| `NEXT_PUBLIC_APP_ENV`     | env flag; `!== 'NONE'` enables arbitrary-login button on employee table |

Path aliases ([tsconfig.json](tsconfig.json)): `@/*` → `src/*`, `@sdk` → `sdk`,
`@server/*` → `src/server/*` (backend — avoid importing from FE).

---

## 3. Source layout

```
src/
├── middleware.ts          # Next edge middleware — auth gate on /dashboard/*
├── pages/                 # Pages Router routes (§4) — thin: routing + SSR + SEO
├── layout/                # the real screens (business-heavy UI lives here)
│   ├── Dashboard.tsx      # page shell (breadcrumb + content)
│   ├── Sidebar.tsx        # nav, mounted in _app for /dashboard/*
│   ├── form-wizard/       # AddEmployee / AddProgram / AddVendor multi-step forms
│   ├── procurement/       # RF screens (RequisitionDetail.tsx ~3.4k lines)
│   ├── finance/           # PR variants (TravelExpenses, AdvancePaymentRequest, …)
│   ├── program/ project/ payment-request/ employee-detail/ external/ timeoff-list/
├── components/            # reusable UI (§8) incl. LogActivity
│   ├── ui/                # shadcn/ui   radix/ # Radix combobox   icon/ # SVGs
├── providers/             # React Context (ACL gate, dashboard state, wizards)
├── hooks/                 # pagination / search / sorting / filter / acl gate
├── utils/                 # SDK wrappers, auth helpers (apiAuthToken), excel, constants
├── shared/                # cross-cutting (jwt, role/acl labels, pr/rf enums) — shared w/ BE
└── styles/                # globals.css + custom-component.css

sdk/                       # GENERATED typescript-axios client — DO NOT hand-edit
```

> **Pattern to internalize:** `pages/**` files are thin — routing,
> `getServerSideProps`, SEO — then delegate the screen to a `layout/**`
> component. Business-heavy UI lives in `layout/`.

---

## 4. Routing

Pages Router. All authed routes live under `/dashboard/*`; `next.config.js`
redirects `/` → `/dashboard`.

| Route group                                                                                                                  | Domain                          |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `/dashboard`                                                                                                                 | landing dashboard               |
| `/dashboard/admin-zone/user-management`                                                                                      | users, ACL templates            |
| `/dashboard/internal/{employee,employment-contract,evaluation,timeoff-*}`                                                    | HR / people                     |
| `/dashboard/program`, `/dashboard/project`                                                                                   | programs/projects               |
| `/dashboard/procurement`                                                                                                     | requisition forms (`[...slug]`) |
| `/dashboard/finance/{payment-request,advance-perdiem-fee,travel-expenses,advance-payment-statement,reporting,employees-tax}` | PR + finance                    |
| `/dashboard/external/vendor-adm`                                                                                             | vendors                         |
| `/dashboard/internal-needs`, `/dashboard/user/{need-action,need-approval,request-tracking}`                                  | needs/queues                    |

**Public pages** (outside the gate): `login`, `welcome`, `refresh`,
`refresh-token-expired`, `inactive-user`, `unauthorize`, `404`, `500`,
`error-general`.

**Conventions:** `[id].tsx` = single record; `[...slug].tsx` = catch-all for
nested detail/sub-views. `next.config.js` rewrites employee `edit/:path*` →
`employee/add` (add and edit share one wizard; id read from query).

### `_app.tsx`

Wraps the tree in `DashboardLayoutProvider`. Mounts `Sidebar` only for
`/dashboard/*`. Global `ToastContainer`, `DefaultSeo`, NProgress on route events,
Plus Jakarta Sans font. Renders nothing until `router.isReady` — components can
assume query is ready.

> **Note (trunk):** `_app` now wraps the tree in a top-level
> [`ErrorBoundary`](src/components/ErrorBoundary.tsx) — an uncaught render error
> shows a fallback instead of a white screen. Landed via `fe/optimization` (§11).

---

## 5. Auth & access control (frontend side)

Three overlapping layers — know all three.

### 5.1 Edge gate — [src/middleware.ts](src/middleware.ts)

Matches `/dashboard/:path*`. Per request: read `auth_token` + `refresh_token`
cookies → decode `auth_token` (jose); if `!is_active` redirect `/inactive-user`
and clear cookies; if decode throws (expired) call the BE refresh and rewrite
`auth_token` / `refresh_token` / `refreshed_at`; refresh fails → `/login`; no
cookies → `/login`.

> **Security note (trunk):** refresh is still called as
> `GET ${MAIN_URL_BE}/v1/auth/refresh?refresh_token=${refreshToken}` — the
> refresh token travels in the **URL query string** (leaks to logs/proxies/history).
> `auth_token` cookie is set `httpOnly: false` so client JS can decode ACL claims.
> Both are **BE-dependent** to fix — see [02 — Backend.md](./02%20—%20Backend.md) §6.

### 5.2 SSR auth

When middleware refreshes mid-request, `getServerSideProps` does **not** see the
new cookie via `context.req.cookies`; the fresh token is in the `set-cookie`
response header. Earlier each SSR page inlined token resolution and JWT decode
manually, which could throw a `TypeError` and 500 the page on a missing/odd
`set-cookie` header.

`trunk` now ships [src/utils/ssrAuth.ts](src/utils/ssrAuth.ts) with
`resolveAuthToken` / `safeDecodeJwt` (no-throw); ~30 SSR pages use it (merged via
`fe/optimization`, §11). **New SSR pages must use these helpers** — don't inline
header parsing.

### 5.3 Component / route ACL gates

- **`useAccessControlGate(acl, redirect)`** — [src/hooks/acl.gate.hook.ts](src/hooks/acl.gate.hook.ts):
  decodes `auth_token`, redirects if the ACL key is absent. Page-level guard.
- **`<AccessGateProvider roles={[...]} replaceWith={...}>`** — renders children
  only if the user's JWT `role` intersects `roles`. Empty `roles` = always allow.
- **`ProgramRoleAccessControl`** + `RoleFilterProvider` / `FeatureFlag` — finer
  program/feature gating.

ACL is **claims-in-JWT**: `auth_token` payload carries `role[]`, `acl[]`,
`employee_id`, `email`, `avatar`. Constants in
[src/shared/role.access.ts](src/shared/role.access.ts) and
[src/shared/acl.labels.ts](src/shared/acl.labels.ts). Scope suffix:
`_ANY` / `_SUBORDINATE` / `_SELF`.

> The FE gate is **UX only** — real authorization is server-side. See
> [02 — Backend.md](./02%20—%20Backend.md) §4 / §6.

---

## 6. API access — the generated SDK

All backend calls go through the generated `typescript-axios` client in `sdk/`.
**Never hand-edit `sdk/`** — regenerate with `pnpm gen:client` after any contract
change.

- [src/utils/apiRequestHelper.ts](src/utils/apiRequestHelper.ts) — one Api object
  per domain + ~40 named helpers (`getEmployeeDetail`, `getProgramListSSR`,
  `getPaymentList`, `getOpenUrl`, …). **Prefer the helpers; reuse before adding.**
- [src/utils/apiAuthToken.ts](src/utils/apiAuthToken.ts) —
  `createAPIConfig(authToken?)` builds the SDK `Configuration` (`basePath =
MAIN_URL_BE` + bearer); on the client reads `auth_token` cookie, on the server
  you pass the token explicitly (§5.2). `createAxiosInstance()` adds a `401` →
  `/refresh` response interceptor.
- **Files / S3:** browser uploads/downloads go **direct to S3 via presigned
  URLs**. `getOpenUrl(bucket, key, expiry, countSize)` mints a download URL;
  `downloadS3File`, `getS3HeaderInformation` build on it. Upload UI:
  `FileUploadDragDrop*`, `SwitchableUploadField*` (each has a `.README.md`).

---

## 7. State management

No Redux/Zustand. Two mechanisms:

1. **`DashboardLayoutProvider`** ([src/providers/DashboardProvider.tsx](src/providers/DashboardProvider.tsx))
   — the one global store: sidebar state, `isInternal`, decoded
   `userLoggedinInformation`, and the cross-page **money-flow carriers**
   (`budgetsFromProgramToProcurements`, `requisitionIdentifier`,
   `budgetsFromProcurementsToPaymentRequest`, `paymentRequestIdentifier`,
   `project`). Consume via `useDashboardContext()`. Carriers are mirrored into
   `localStorage` so the budget→RF→PR pipeline survives navigation/reload.
   `sessionStorage` holds in-progress form-wizard state.
2. **SWR** for client server-data — `useSWRMutation` + a trigger in `useEffect`
   for manual-refetch control. SSR data arrives via `pageProps`.

---

## 8. Components & layout

- **`layout/Dashboard.tsx`** — page shell (breadcrumb + children).
- **`layout/Sidebar.tsx`** — nav; receives `pageProps.activeSidebar`.
- **`components/`** — `Button`, `Input`/`InputV2`, `Badge`, `Modal`, `Drawer`,
  `Pagination`, `ComboboxAutocomplete`, `DatePickerCalendar`, `CurrencyInput`,
  `TableCore` / `TableCoreSSR`, file-upload fields.
- **`components/LogActivity.tsx`** — renders backend activity-log HTML through the
  DOMPurify-backed [`SafeHtml`](src/components/SafeHtml.tsx) component (merged via
  `fe/optimization`, §11). `SafeHtml` is now the sink for all 7 former raw-HTML
  spots (log activity, RF/budget-needs detail, 4 finance detail pages) — **render
  backend HTML only through `SafeHtml`, never raw `dangerouslySetInnerHTML`.**
- **Dynamic imports** for screens via `dynamic(() => import(...).then(m => m.X))`
  (smaller initial bundles; typed `any`, so no prop type-checking on those).

### Tables — `TableCore`

`@tanstack/react-table` wrapped in `TableCore` (client data) /
`TableCoreSSR` (server-paginated). Columns via `createColumnHelper<T>()`;
companion hooks `usePagination`, `useSearch`, `useSorting`, `useFilter`.

### Forms — multi-step wizards

`layout/form-wizard/{AddEmployee,AddProgram,AddVendor}Wizard.tsx` driven by the
matching `Add*FormWizardProvider`. Draft state persists to `sessionStorage`;
`form_progress` % tracked per draft. Built on `react-hook-form`.

---

## 9. Styling

- Tailwind ([tailwind.config.js](tailwind.config.js)) — brand `primary` orange
  (#FF7B00) + gray/error/warning/success/blue scales; extra breakpoints
  `xxs:420px`, `xs:576px`; plugins `@tailwindcss/forms`, `tailwind-scrollbar`,
  `tailwindcss-animate`.
- Global CSS: [src/styles/globals.css](src/styles/globals.css),
  `custom-component.css` (imported in `_app`). Font: Plus Jakarta Sans via
  `next/font/google`. Prettier with `prettier-plugin-tailwindcss` +
  `prettier-plugin-organize-imports`; ESLint includes `eslint-plugin-tailwindcss`.

---

## 10. Performance notes (current `trunk` behaviour)

These describe **trunk as it runs today** — the `fe/optimization` improvements are
merged and live (§11).

- **Excel export libs are lazy-loaded.** `project/[...slug].tsx` defers
  `exceljs` / `jszip` / `file-saver` via `await import()` inside the export
  handler, keeping them out of the initial page bundle. **Keep new heavy export
  deps lazy** — don't add top-level `import ... from 'exceljs'` in page modules.
  (The `src/utils/saveExcel*.ts` helpers and the BE `pr.controller.ts` still import
  `exceljs` statically — that's server/utility code, not the page bundle.)
- **`getPaymentBasedOnBudgetCode`** ([apiRequestHelper.ts](src/utils/apiRequestHelper.ts))
  now indexes payments into a `Map` (O(n)) and centralizes the perdiem/tax math in
  a single `buildBudgetResult`, shared by the nested and flat branches. **Edit the
  formula in `buildBudgetResult` only** — there's no longer a duplicated branch.
- **Scroll listeners** (travel-expenses) — cleanup is now scoped per container
  (`addEventListener`/`removeEventListener` paired in the effect), no longer
  leaking across re-runs.

---

## 11. `fe/optimization` — FE changes now merged into trunk

These changes shipped to `trunk` via merge `4e35c487` (2026-06-01). All are
**live**. Cross-reference: [00 — Architecture Overview.md](./00%20—%20Architecture%20Overview.md) §7.

| Area        | Change                                                                                  | Status   |
| ----------- | --------------------------------------------------------------------------------------- | -------- |
| Security    | `SafeHtml` (DOMPurify) replacing raw `dangerouslySetInnerHTML` on log/detail HTML (XSS) | **DONE** |
| Security    | Open-redirect guard in `refresh.tsx` (`getSafeRedirect` validates `referer` host)       | **DONE** |
| Robustness  | `ssrAuth` helpers — token parsing / JWT decode no longer throw → no 500 on odd cookies  | **DONE** |
| Robustness  | Top-level `ErrorBoundary` in `_app` — render errors show a fallback, not a white screen | **DONE** |
| Performance | `getPaymentBasedOnBudgetCode` O(n²)→O(n) via `Map`; perdiem/tax math de-duplicated      | **DONE** |
| Performance | Excel export libs lazy-loaded out of the initial bundle                                 | **DONE** |
| Bug fix     | Travel-expenses scroll-listener cleanup scoped per container (was leaking)              | **DONE** |
| Bug fix     | `reduce()` accumulator corrected (`b.total0` → `b.total, 0`)                            | **DONE** |
| Cleanup     | Debug `console.log` removed; errors use `console.error`                                 | **DONE** |

> **Post-merge check:** run `pnpm lint && pnpm build:next`, then smoke-test login →
> dashboard → one SSR detail page → an excel export → an activity-log render before
> the next release cut.

---

## 12. Frontend technical debt to schedule (no BE dependency)

This list is **frontend-only** and intentionally disjoint from the backend list
in [02 — Backend.md](./02%20—%20Backend.md) §6/§10, so each team owns its column.

> The `fe/optimization` security + perf pass is **merged** (§11) — the XSS sink,
> SSR 500-on-odd-cookie risk, missing `ErrorBoundary`, and O(n²) payment calc are
> all resolved on `trunk`. The items below are the FE debt that remains.

1. **TypeScript strict mode is off** (`strict`, `strictNullChecks`,
   `strictBindCallApply` all `false` in [tsconfig.json](tsconfig.json)). Tighten
   incrementally.
2. **No CI lint/build gate.** `next.config.js` has `ignoreBuildErrors` /
   `ignoreDuringBuilds` (currently commented) — add a lint + `build:next` gate so
   broken TS/lint cannot ship.
3. **Very large business-rule files** — `RequisitionDetail.tsx` (~3.4k lines),
   `travel-expenses/[id].tsx`, `TravelExpenses.tsx`, `AddEmployeeWizard.tsx`,
   `project/[...slug].tsx`. Refactor incrementally, with tests.

### Frontend items that are BE-dependent (cannot fix on FE alone)

Listed here only as pointers — the actual work is backend; see
[02 — Backend.md](./02%20—%20Backend.md) §6.

- **`refresh_token` in URL query** — move to POST body/cookie once BE exposes it.
- **`auth_token` cookie `httpOnly: false`** — flip to `true` once BE exposes
  `GET /v1/auth/me` (or a non-sensitive claims cookie).
- **Per-item S3 presign (N+1) in SSR** — replace the loop once BE adds a batch
  presign endpoint.

---

_Describes the `trunk` branch. Line counts approximate — verify against the tree._

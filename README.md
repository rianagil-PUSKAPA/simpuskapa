# SIMPUSKAPA v2.0.0

Management Information System for the Center for Study and Advocacy on Child Protection and Quality of Life (Sistem Informasi Manajemen Pusat Kajian dan Advokasi Perlindungan dan Kualitas Hidup Anak).

## Tech Stack

| Layer      | Technology                                       |
| ---------- | ------------------------------------------------ |
| Frontend   | Next.js 13.2 , React 18, TypeScript, TailwindCSS |
| Backend    | NestJS 9.4, Express, Prisma ORM 4.11             |
| Database   | PostgreSQL                                       |
| Storage    | AWS S3                                           |
| Monitoring | Sentry                                           |
| Docs       | OpenAPI / Swagger + Scalar                       |
| Testing    | Jest, Playwright                                 |
| Package    | pnpm 9.6+                                        |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9.6+
- PostgreSQL instance

### Installation

```bash
pnpm install
```

### Environment Setup

```bash
cp .env.example .env
# Fill in your database URL, AWS credentials, Sentry DSN, etc.
```

### Database

```bash
# Run migrations
npx prisma migrate dev

# Fresh reset (destroys all data)
npx prisma migrate reset --force

# Seed initial data
npx prisma db seed
```

### Generate SDK

```bash
NEST_PORT=8000 pnpm gen:init && pnpm gen:client
```

## Development

```bash
# Run both frontend and backend
pnpm start:dev

# Frontend only
pnpm start:next-dev

# Backend only
pnpm start:nest-dev
```

## Build & Production

```bash
# Build everything
pnpm build

# Build separately
pnpm build:next    # frontend
pnpm build:nest    # backend

# Start production server
pnpm start:prod
```

## Linting

```bash
pnpm lint --fix
```

## Testing

```bash
# Unit / integration tests
pnpm test

# Tests with coverage
pnpm test:cov

# Playwright E2E tests
pnpm test:e2e

# Playwright E2E (headed)
pnpm exec playwright test --project=chromium --headed

# Single test file
npx playwright test 002-program.spec.ts --project=chromium --workers=1 --headed

# Playwright codegen
npx playwright codegen --viewport-size=1920,1080 localhost:3000

# Show Playwright test report
pnpm test:e2e:report
```

## Refactoring & Metrics

Before refactoring, capture baseline metrics to measure improvements:

```bash
# Capture baseline (runs tests, build, and analysis)
pnpm measure:baseline

# After refactoring, capture again and compare
pnpm measure:baseline
pnpm measure:compare 2026-02-15 2026-02-16

# Full measurement (comprehensive)
pnpm measure:full
```

Metrics captured:

- **Build size** - Next.js and NestJS bundle sizes
- **Test coverage** - Line, statement, function, and branch coverage
- **Bundle analysis** - Largest chunks and dependencies
- **Code metrics** - File counts, components, and complexity

See [REFACTORING_METRICS.md](./REFACTORING_METRICS.md) for detailed guide.

### Current Baseline (2026-02-16)

| Metric                | Value          | Target   |
| --------------------- | -------------- | -------- |
| **Build**             |                |          |
| Next.js build size    | 3.22 GB        | < 50 MB  |
| Total pages           | 46             | -        |
| Largest chunk         | 914 KB         | < 500 KB |
| **Code**              |                |          |
| Total files           | 433            | -        |
| TypeScript files      | 396            | -        |
| React components      | 249            | -        |
| Test files            | 25             | -        |
| **Bundle**            |                |          |
| Total dependencies    | 120            | < 100    |
| **Tests**             |                |          |
| Jest test files       | 25             | 40+      |
| Playwright test files | 9              | -        |
| Test coverage         | 0% (needs run) | > 70%    |

**Optimization opportunities identified:**

- ⚠️ Next.js build is 3.22 GB (likely includes dev cache) - Run production build
- ⚠️ 1 chunk over 500KB - Split large bundle
- ⚠️ Test coverage needs to be measured - Run `pnpm test:cov`

## Project Structure

```
simpuskapa-x/
├── prisma/                  # Schema, migrations, seeders
├── src/
│   ├── pages/               # Next.js file-based routing
│   ├── components/          # Reusable React components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── radix/           # Radix UI primitives
│   │   └── icon/            # Icon components
│   ├── layout/              # Feature-specific page layouts
│   │   ├── finance/         # Payment, tax, travel expense layouts
│   │   ├── procurement/     # Requisition form layouts
│   │   ├── program/         # Program management layouts
│   │   └── form-wizard/     # Multi-step form wizards
│   ├── server/              # NestJS backend
│   │   ├── controllers/     # Route handlers (12 controllers)
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── middleware/       # Express middleware
│   │   └── common/          # Exception filters, response formatters
│   ├── providers/           # React context providers (ACL, roles, feature flags)
│   ├── hooks/               # Custom React hooks (pagination, search, sorting)
│   ├── utils/               # Helper functions
│   ├── shared/              # Shared types & libs (JWT, ACL, roles)
│   ├── types/               # TypeScript type definitions
│   ├── tests/               # Jest unit + Playwright E2E tests
│   └── i18n/                # Internationalization
├── sdk/                     # Auto-generated API client
├── deployment/              # Build & deploy scripts
└── .github/                 # CI/CD workflows
```

## CI/CD & Deployment

### Git Branching Strategy

```
feature-branch → development     (triggers deploy to dev)
development    → main            (triggers deploy to staging)
main           → tag vx.x.x     (triggers deploy to production)
hotfix/*       → main → tag      (fast-track to production)
```

### Deploy Scripts

```bash
./deploy-fe.sh    # Frontend deployment
./deploy-be.sh    # Backend deployment
```

---

## Improvement Roadmap

A comprehensive analysis of the codebase identified the following areas for improvement, organized by priority.

### Critical — Security & Stability

| #   | Issue                              | Location                    | Details                                                                                               |
| --- | ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | Auth token exposed to JS           | `src/utils/apiAuthToken.ts` | `httpOnly: false` on auth cookie makes it vulnerable to XSS. Change to `httpOnly: true`.              |
| 2   | Refresh token in URL               | `src/middleware.ts`         | Refresh token passed as URL query parameter — visible in logs and browser history. Move to POST body. |
| 3   | TypeScript errors ignored in build | `next.config.js`            | `ignoreBuildErrors: true` allows broken code in production. Remove this setting.                      |
| 4   | ESLint errors ignored in build     | `next.config.js`            | `ignoreDuringBuilds: true` suppresses lint errors in production builds. Remove this setting.          |
| 5   | No `.env.example`                  | project root                | Real `.env` may be committed. Create `.env.example` with placeholders and add `.env` to `.gitignore`. |

### High — Code Quality

| #   | Issue                                   | Location             | Details                                                                                                  |
| --- | --------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | TypeScript strict mode disabled         | `tsconfig.json`      | `strict`, `strictNullChecks`, `noImplicitAny` all set to `false`. Enable for better type safety.         |
| 2   | Outdated dependencies                   | `package.json`       | Next.js 13 (current: 15), NestJS 9 (current: 10), TypeScript 4.7 (current: 5.x), Prisma 4 (current: 5+). |
| 3   | ESLint plugin version mismatch          | `package.json`       | `@typescript-eslint/eslint-plugin` v6 paired with `@typescript-eslint/parser` v5. Should match.          |
| 4   | No frontend Error Boundary              | `src/pages/_app.tsx` | Unhandled client-side errors crash the whole app. Add a React Error Boundary wrapper.                    |
| 5   | No tests in CI/CD                       | `.github/workflows/` | Staging and production pipelines skip linting and testing entirely. Add lint + test steps before build.  |
| 6   | getServerSideProps lacks error handling | 35 page files        | No try/catch in data-fetching functions — unhandled API failures cause 500 errors.                       |

### Medium — Maintainability

| #   | Issue                              | Location                        | Details                                                                                                                       |
| --- | ---------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | `globalHelper.ts` is 1,177 lines   | `src/utils/globalHelper.ts`     | Mixed concerns (string, date, cookie, role utils). Split into focused modules.                                                |
| 2   | `apiRequestHelper.ts` is 661 lines | `src/utils/apiRequestHelper.ts` | All API calls in one file. Split by domain (employee, vendor, program, etc.).                                                 |
| 3   | 5 components over 3,000 lines each | `src/layout/`, `src/utils/`     | `saveExcelRf.ts` (4,123 lines), `RequisitionDetail.tsx` (3,548), `TravelRequest.tsx` (3,230), etc. Break into sub-components. |
| 4   | Deprecated packages                | `package.json`                  | `moment` (use existing `dayjs`), `react-beautiful-dnd` (unmaintained — migrate to `@dnd-kit`).                                |
| 5   | 515 console.log statements         | codebase-wide                   | Replace with structured logging (Pino or Winston) for backend; remove from frontend.                                          |
| 6   | Prisma enum typo                   | `prisma/schema.prisma`          | `MaritalStatus` has both `maried` and `married`. Consolidate via migration.                                                   |
| 7   | Backend services have 0 unit tests | `src/server/services/`          | `pr.service.ts` (2,104 lines), `program.service.ts` (1,535 lines), `rf.service.ts` (1,461 lines) — no test coverage.          |

### Low — Polish

| #   | Issue                         | Location                   | Details                                                                                     |
| --- | ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | No `React.memo` usage         | `src/layout/`              | 43 layout components with complex state — memoization could reduce re-renders.              |
| 2   | 4 separate Excel export files | `src/utils/saveExcel*.ts`  | Similar patterns repeated. Consolidate into a shared export utility.                        |
| 3   | No component-level tests      | `src/tests/`               | Only E2E (Playwright) and 2 unit tests. Add `@testing-library/react` for component testing. |
| 4   | Modal accessibility gaps      | `src/components/Modal.tsx` | Missing `aria-labelledby` on Dialog.Panel; close button lacks keyboard support.             |
| 5   | Bundle analyzer disabled      | `next.config.js`           | Bundle analysis commented out. Enable periodically to track bundle size.                    |
| 6   | No `.nvmrc`                   | project root               | No Node.js version pinned for contributors. Add `.nvmrc` with target version.               |

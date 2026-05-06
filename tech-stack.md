# RegAxis RIM — Tech Stack

Version: 1.0
Date: 2026-05-05
Status: Decided

---

## 1. Stack Overview

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS | SSR/SSG flexibility, file-based routing, strong type safety, utility-first styling matching the dark navy design system |
| **Data fetching** | TanStack Query v5, Zod, React Hook Form | Server-state caching with stale-while-revalidate; schema-validated forms; Zod reused across web and api via `packages/types` |
| **Backend** | Express.js on Node.js 20, TypeScript | Thin, explicit HTTP layer; full control over middleware stack; runs on EC2 under PM2 with Nginx as reverse proxy |
| **Database** | PostgreSQL 16 (AWS RDS) | Production-proven relational store; supports `pg_trgm` full-text search, JSONB, TIMESTAMPTZ, and the complex schema in `rim_schema.sql` |
| **Connection pooling** | AWS RDS Proxy | Multiplexes connections across EC2 instances; essential for 21 CFR Part 11 stateless-backend requirement (TR-NF-010/011) |
| **Auth** | AWS Cognito (JWT) | Managed user pools, JWT access tokens verified on every API request via JWKS; multi-tenant with org-level isolation |
| **Storage** | AWS S3 | Pre-signed PUT/GET URLs; no file bytes proxied through backend; SSE-S3/KMS encryption at rest; per-org key prefix isolation |
| **Email** | AWS SES | Transactional emails (renewal alerts, submission milestones, HA query notifications); async dispatch, bounce/complaint handling |
| **AI / LLM** | Anthropic Claude API (`@anthropic-ai/sdk`) | Dossier gap analysis, HA query response drafting, renewal package generation, Copilot chat; all calls proxied through backend |
| **Monorepo** | Turborepo | Shared build cache, parallel task execution across `apps/web`, `apps/api`, `packages/types` |
| **IaC** | AWS CDK (TypeScript) | Infrastructure as code under `infra/`; provisions EC2, RDS, S3, Cognito, SES, ALB, ElastiCache |
| **Hosting — frontend** | Vercel | Zero-config Next.js deployment; global CDN; preview deployments per branch |
| **Hosting — backend** | AWS EC2 + ALB | EC2 instances managed by PM2; ALB handles TLS termination and health checks (`GET /health`, `GET /health/db`) |
| **Cache** | Redis (AWS ElastiCache) | Session-independent caching for rate-limit counters, AI response memoisation |
| **CI/CD** | GitHub Actions | Build, lint, test, and deploy pipeline; `npm audit` dependency scanning in every run |
| **Testing** | Vitest (unit/integration), Playwright (E2E), k6 (load), axe-core (a11y) | Full pyramid: unit → integration → E2E → load → accessibility |

---

## 2. Environment Tiers

The system uses the `APP_ENV` variable with three tiers: `local`, `demo`, `production`.
All environment-specific branching is encapsulated in two files — `lib/config.ts` and `lib/services.ts` — never scattered across handlers or components.

### 2.1 Tier Comparison Table

| Service | local | demo | production |
|---------|-------|------|------------|
| **Database** | Docker PostgreSQL `postgres:16` (via `docker-compose.yml`); no RDS Proxy | AWS RDS PostgreSQL (small instance, e.g. `db.t3.micro`); RDS Proxy capped at 5 connections | AWS RDS PostgreSQL (sized instance, e.g. `db.r6g.large`); RDS Proxy with full pool |
| **Auth** | Cognito mock via LocalStack **or** middleware bypass with a hard-coded test JWT (`X-Test-User` header) | Real AWS Cognito — dedicated demo user pool with sandbox users | Real AWS Cognito — production user pool; JWKS verified on every request |
| **Storage** | LocalStack S3 (`http://localhost:4566`); no ACL restrictions | Real AWS S3 — demo bucket (`regaxis-demo-docs`); 10 MB max per file, 1 GB org total cap enforced by backend | Real AWS S3 — production bucket (`regaxis-prod-docs`); configurable per-org limits; SSE-KMS encryption |
| **Email** | Console log / no-op adapter — no emails sent | Real AWS SES in sandbox mode; only verified recipient addresses receive mail | Real AWS SES in production mode — any address on a verified domain; bounce/complaint SNS topic configured |
| **AI (LLM)** | Stub adapter — returns hard-coded mock JSON responses; no Anthropic API calls | Real Anthropic Claude API; rate-limited to 10 requests/min per tenant; exponential back-off on 429 | Real Anthropic Claude API; full quota; per-org rate limit configurable via `preferences` JSONB |
| **Cache** | None — in-process `Map` for rate-limit counters; flushed on restart | AWS ElastiCache Redis (small, `cache.t3.micro`); shared across demo tenants | AWS ElastiCache Redis (production cluster); per-org key namespacing |
| **Migrations** | Auto-run on container start via `docker-compose` entrypoint | Run manually before deploy or via CI step targeting demo RDS | Run as a pre-deploy step in the GitHub Actions release workflow; idempotent, reversible |

### 2.2 `APP_ENV` Implementation Contract

The contract for environment handling is strict: **process.env is read in exactly one place**.

```
apps/api/src/lib/config.ts        — sole reader of process.env; Zod-validated at startup
apps/api/src/lib/services.ts      — factory that reads config.APP_ENV and returns concrete adapters
docker-compose.yml                — defines all services for APP_ENV=local
.env.example                      — APP_ENV is the first variable listed
```

**`apps/api/src/lib/config.ts`**
- Parses all environment variables with Zod; the application fails to start (`process.exit(1)`) if any required variable is missing or malformed.
- Exports a typed `config` object and an `env` helper with boolean flags:
  - `env.isLocal` — `APP_ENV === 'local'`
  - `env.isDemo` — `APP_ENV === 'demo'`
  - `env.isProd` — `APP_ENV === 'production'`

**`apps/api/src/lib/services.ts`**
- Single factory function; imports `config` and constructs the correct concrete adapter for each external service.
- Returns a `Services` object consumed by all handler and service layers.
- No handler, service, or repository file imports from `process.env` directly.

**`docker-compose.yml`**
- Defines: `postgres:16`, `localstack` (for S3 + Cognito mock), and the `api` service.
- Sets `APP_ENV=local` for the `api` service; no AWS credentials required for local development.

**`.env.example`**
- `APP_ENV` is listed first, with a comment explaining valid values (`local | demo | production`).
- All other required variables follow, grouped by service.

---

## 3. Monorepo Structure

```
/
├── apps/
│   ├── web/                  (Next.js 15 — App Router)
│   │   ├── app/              (routes, layouts, pages)
│   │   ├── components/       (PascalCase component files)
│   │   ├── services/         (all fetch calls; never in components)
│   │   ├── hooks/            (custom React hooks)
│   │   ├── lib/              (client-side utilities, Zod schemas)
│   │   └── public/
│   └── api/                  (Express on Node.js 20)
│       └── src/
│           ├── handlers/     (route handlers — input validation + delegate)
│           ├── services/     (business logic)
│           ├── repositories/ (DB queries; parameterised only)
│           ├── lib/
│           │   ├── config.ts (sole env reader; Zod-validated)
│           │   └── services.ts (adapter factory)
│           ├── middleware/   (auth, RBAC, rate-limiting, error handling)
│           └── migrations/   (versioned up/down migration files)
├── packages/
│   └── types/                (shared TypeScript types and Zod schemas)
├── infra/                    (AWS CDK — TypeScript)
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 4. Key Conventions

### Layering rule
```
handlers → services → repositories → DB
```
- No upward imports. Handlers never touch the DB. Repositories contain no business logic.
- Business logic lives exclusively in `services/`.

### Frontend fetch calls
- All `fetch` / HTTP calls are in `apps/web/src/services/` — never inside React components or hooks directly.
- TanStack Query wrappers in `hooks/` call service functions, not fetch directly.

### Barrel exports
- Every folder that is imported from outside (e.g., `packages/types`, `services/`, `repositories/`) has an `index.ts` barrel.
- The `app/` directory (Next.js route segments) is exempt — no barrel files there.

### Naming
- **Components:** PascalCase (`RegistrationCard.tsx`)
- **Folders:** kebab-case (`registration-card/`, `dossier-management/`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE_BYTES`)
- **Database columns:** snake_case (mirrors `rim_schema.sql`)

### Environment variables
- Validated with Zod in `apps/api/src/lib/config.ts` on startup.
- Application must not start if any required variable is absent.
- `.env.local` is git-ignored; `.env.example` is always kept up to date.

### Secrets
- All secrets stored in AWS Secrets Manager or injected as runtime environment variables.
- No secrets committed to the repository (enforced by `.gitignore` and CI secret scanning).

### Audit trail
- Every create, update, and delete on core entities writes to the `audit_log` table via a service-layer hook.
- Audit log rows are append-only; no application code may UPDATE or DELETE them (enforced at the database role level).

### SQL safety
- All queries use parameterised statements (`pg` placeholder syntax) or a query builder.
- Raw string interpolation into SQL is prohibited.

---

## 5. Third-Party Libraries

### Frontend (`apps/web`)

| Package | Purpose |
|---------|---------|
| `next` ^15 | App Router framework |
| `react` ^19 | UI rendering |
| `typescript` ^5 | Static typing (strict mode) |
| `tailwindcss` ^3 | Utility-first CSS |
| `@tanstack/react-query` ^5 | Server-state caching and synchronisation |
| `zod` ^3 | Schema validation (shared with backend via `packages/types`) |
| `react-hook-form` ^7 | Performant form state management |
| `lucide-react` ^latest | Icon set (SVG, Retina-safe) |
| `date-fns` ^3 | Date formatting and timezone utilities |
| `@aws-amplify/auth` ^6 | Cognito Hosted UI / JWT token management |

### Backend (`apps/api`)

| Package | Purpose |
|---------|---------|
| `express` ^4 | HTTP server framework |
| `typescript` ^5 | Static typing (strict mode) |
| `pg` ^8 | PostgreSQL client; parameterised queries |
| `zod` ^3 | Runtime request validation (TR-NF-023) |
| `@aws-sdk/client-s3` ^3 | S3 pre-signed URL generation, object operations |
| `@aws-sdk/client-ses` ^3 | Transactional email dispatch |
| `@aws-sdk/client-cognito-identity-provider` ^3 | User pool management, JWKS token verification |
| `@anthropic-ai/sdk` ^latest | Claude API calls (proxied; never called from frontend) |
| `ioredis` ^5 | Redis client for ElastiCache |
| `cors` ^2 | CORS policy (Vercel domain + dev origins only) |
| `helmet` ^7 | Security headers |
| `morgan` ^1 | HTTP request logging |
| `winston` ^3 | Structured application logging |
| `node-pg-migrate` ^6 | Versioned database migrations (up/down) |
| `express-rate-limit` ^7 | Auth endpoint and AI Copilot rate limiting |

### Testing

| Package | Purpose |
|---------|---------|
| `vitest` ^2 | Unit and integration tests for both `apps/web` and `apps/api` |
| `@testing-library/react` ^16 | Component rendering and interaction tests |
| `@playwright/test` ^1 | End-to-end browser tests across Chrome, Firefox, Safari |
| `k6` (CLI) | Load testing — validates P95 latency targets (TR-NF-001) |
| `axe-core` ^4 | WCAG 2.1 AA accessibility assertions in Playwright runs |

### Monorepo / Toolchain

| Package | Purpose |
|---------|---------|
| `turbo` ^2 | Task orchestration, remote build cache |
| `@repo/tsconfig` (internal) | Shared `tsconfig.base.json` extended by each app |
| `eslint` ^9 + `@typescript-eslint` | Lint rules; `no-any` rule enforces no untyped code |
| `prettier` ^3 | Code formatting |

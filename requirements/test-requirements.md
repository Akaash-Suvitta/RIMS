# RegAxis RIM — Test Requirements

Version: 1.0
Date: 2026-05-05
Status: Draft

---

## 1. Testing Philosophy and Approach

RegAxis RIM operates in a regulated domain (pharmaceutical and biotech). Every defect has potential downstream consequences — missed renewal deadlines, incorrect audit trails, or exposed cross-tenant data carry compliance and reputational risks beyond typical SaaS. The testing strategy therefore prioritises:

- **Correctness over coverage percentages** — 80% coverage of inconsequential code is less valuable than 100% coverage of business-critical paths (status transitions, audit logging, RBAC enforcement, AI content labelling).
- **Test isolation** — every test run starts from a deterministic state. No test may depend on the outcome of another. Each integration or E2E run uses a fresh, seeded database.
- **Fast feedback loops** — unit and integration tests must complete in under 3 minutes total. E2E tests run in parallel and must complete in under 15 minutes. Slow tests block developers and reduce adoption.
- **Shift-left security and compliance** — auth boundary tests, RBAC checks, and audit log verification are part of the standard integration suite, not a separate security phase.
- **Three-tier parity** — the same test suite runs in local (Docker Compose), demo (real AWS, limited data), and production-mirrored environments. Any environment-specific failure is treated as a blocker.

---

## 2. Testing Tools and Framework

| Layer | Tool | Notes |
|-------|------|-------|
| Unit tests (backend) | Vitest | Fast, native ESM, TypeScript-first |
| Integration tests (backend) | Vitest + Supertest | HTTP layer tested against a real Postgres test database |
| Unit tests (frontend) | Vitest + React Testing Library | Component-level rendering and interaction |
| End-to-End tests | Playwright | Multi-browser, runs headed locally and headless in CI |
| API contract tests | Supertest (within Vitest) | Request/response shape validated against Zod schemas |
| Database migration tests | node-pg-migrate + Vitest | Up and down migrations applied against a blank DB |
| Performance / load tests | k6 | Scripted scenarios for key API endpoints |
| Accessibility tests | Playwright + axe-core | WCAG 2.1 AA assertions on every page |
| Dependency vulnerability scan | npm audit + `audit-ci` | Blocks CI on high/critical findings |
| Security static analysis | ESLint security plugin | SQL injection, XSS, regex DoS pattern detection |

---

## 3. Coverage Targets by Layer

| Layer | Minimum Coverage | Notes |
|-------|-----------------|-------|
| Repository functions (DB queries) | 90% | Every query path must be exercised |
| Service functions (business logic) | 90% | All status-transition guards, AI call orchestration |
| API route handlers | 85% | Including error branches (400, 403, 409, 422) |
| Frontend components (logic-bearing) | 70% | Forms, data tables, modal flows |
| Frontend components (pure display) | 50% | Charts, KPI cards — snapshot tests sufficient |
| Utility / shared lib functions | 95% | Date helpers, validators, formatters |
| Audit log writes | 100% | Every service mutation must emit a confirmed audit entry |
| RBAC enforcement points | 100% | Every role-restricted endpoint must have a deny test |

Coverage is measured with Vitest's built-in c8 / v8 provider. Coverage reports are uploaded to CI as artefacts on every PR.

---

## 4. Test Data Strategy

### 4.1 Factories and Fixtures

All test data is generated via typed factory functions living in `packages/test-utils/factories/`. Each factory produces a valid record shape conforming to the Zod schema of the entity.

```
packages/test-utils/factories/
  organizationFactory.ts
  userFactory.ts
  productFactory.ts
  registrationFactory.ts
  submissionFactory.ts
  dossierFactory.ts
  documentFactory.ts
  labelFactory.ts
  haQueryFactory.ts
  aiInsightFactory.ts
```

Factories accept partial overrides so individual tests can set only the properties they care about. Default values are always valid and realistic (e.g. `expiry_date` defaults to 90 days from now; `status` defaults to the initial state of the entity lifecycle).

### 4.2 Isolated Test Database

- Integration and E2E tests run against a dedicated PostgreSQL instance (Docker Compose locally; a separate RDS schema in CI/demo).
- Before each test suite, the database is reset to a clean state and the seed script (`rim_schema.sql` reference data — countries, health authorities) is applied.
- Each test file wraps mutations in a transaction that is rolled back after the test, so tests never persist state to subsequent tests.
- Factories insert data directly using the repository layer, not the HTTP API, to keep setup fast.

### 4.3 S3 and External Services in Tests

- **S3:** Integration tests use a LocalStack S3 container (Docker Compose). No real AWS S3 is contacted during unit or integration tests.
- **AWS Cognito:** A test JWT is minted using the RS256 private key from the test Cognito pool. Integration tests inject this token in the `Authorization` header. No live Cognito is required for unit/integration runs.
- **Anthropic API:** All AI endpoint tests mock the Anthropic SDK using Vitest's `vi.mock`. The mock returns deterministic structured responses. At least one integration test per AI feature (gap check, HA response draft, renewal package) uses the real API against the demo environment using a dedicated low-credit test API key.
- **AWS SES:** Email delivery is mocked in all test tiers. Demo-tier E2E tests assert that the correct SES `sendEmail` call was made using a spy on the SES client.

---

## 5. CI/CD Integration

### 5.1 Pipeline Stages (GitHub Actions or equivalent)

```
PR opened / push to feature branch:
  Stage 1 — Lint and Type Check (parallel)
    ├── ESLint (apps/web, apps/api, packages/)
    ├── TypeScript strict mode check (tsc --noEmit)
    └── npm audit --audit-level=high (dependency vulnerability scan)

  Stage 2 — Unit Tests (parallel)
    ├── Backend unit tests (Vitest, apps/api)
    └── Frontend unit tests (Vitest + RTL, apps/web)

  Stage 3 — Integration Tests
    └── Backend integration tests (Vitest + Supertest, Postgres + LocalStack)

  Stage 4 — E2E Tests (parallel browsers)
    ├── Playwright — Chromium
    ├── Playwright — Firefox
    └── Playwright — WebKit (Safari)

  Stage 5 — Coverage Report and Gate
    └── Fail if any layer is below minimum threshold (see section 3)

Merge to main:
  All above stages +
  Stage 6 — Performance Regression
    └── k6 smoke test against demo environment (key endpoints only)
```

### 5.2 Merge Gates

A PR may not be merged if:
- Any unit, integration, or E2E test fails.
- Coverage for any layer drops below its minimum threshold.
- `npm audit` reports a high or critical vulnerability.
- TypeScript compilation produces any error.
- ESLint reports any error-level finding.

### 5.3 Test Reports

- JUnit XML reports are generated for all Vitest and Playwright runs and published to CI for inline PR annotation.
- Playwright produces HTML trace reports for failed E2E tests (with screenshots and network logs).
- Coverage HTML report is uploaded as a CI artefact on every PR.

---

## 6. Environment Tiers

| Tier | Infrastructure | DB | AI | Purpose |
|------|--------------|----|----|---------|
| Local | Docker Compose (Postgres + LocalStack) | Fresh per run | Mocked | Developer iteration |
| Demo | Real AWS (EC2 + RDS + S3 + Cognito) | Persistent seed data, reset weekly | Real API, low-credit key | Stakeholder demos; integration smoke tests |
| Production | Full AWS (EC2 + RDS + S3 + Cognito + SES) | Live data | Real API, full key | Smoke tests only post-deploy; no destructive tests |

All three tiers must pass the full test suite before a release is considered complete. Production-tier tests are a read-only smoke suite: they verify that key pages load, login works, and the health endpoint responds — they never mutate data.

---

## 7. Key Test Scenarios by Module

### 7.1 Registrations and Lifecycle

| Scenario | Type | Priority |
|----------|------|---------|
| Create registration with all required fields — verify record persisted and audit log written | Integration | P0 |
| Attempt to create duplicate registration (same product + country + HA + reg number) — expect HTTP 409 | Integration | P0 |
| Valid status transition: `pending_approval` → `under_review` → `active` | Integration | P0 |
| Invalid status transition: `planning` → `active` (jump) — expect HTTP 422 | Integration | P0 |
| `days_until_expiry` is read-only — attempt to set via API and verify it is ignored | Integration | P0 |
| Filter registrations by status, country, HA, and days_until_expiry range — verify correct rows returned | Integration | P1 |
| Soft-delete (archive) registration — verify record excluded from active list but retrievable | Integration | P1 |
| Create post-approval variation linked to registration | Integration | P1 |
| Registration list pagination — request page 2 and verify correct offset | Integration | P1 |
| Read-only user attempts to update a registration — expect HTTP 403 | Integration | P0 |

### 7.2 Renewals

| Scenario | Type | Priority |
|----------|------|---------|
| Registration with `days_until_expiry` = 45 appears in renewals list sorted before `days_until_expiry` = 90 | Integration | P0 |
| Automated SES email triggered when `days_until_expiry` crosses 90-day threshold | Integration | P0 |
| Create renewal record linked to registration — verify status defaults to `not_started` | Integration | P1 |
| AI renewal package generation — mock AI returns package, verify `ai_package_generated = TRUE` | Integration | P1 |
| Renewal email sent to registration owner AND all `regulatory_lead` users in the org | Integration | P0 |
| Renewal page E2E: countdown days render for each registration, sorted ascending | E2E | P1 |

### 7.3 Submissions

| Scenario | Type | Priority |
|----------|------|---------|
| Create submission with all required fields | Integration | P0 |
| Attempt status transition `planning` → `filed` (skip steps) — expect HTTP 422 | Integration | P0 |
| Advance status through full valid chain to `approved` | Integration | P0 |
| Assign task to user; update task status; verify completeness recalculated | Integration | P1 |
| Attach document to submission with CTD section; verify junction record created | Integration | P1 |
| Submission pipeline view returns only non-terminal submissions with correct open query count | Integration | P0 |
| Filter submissions by HA, status, product — verify correct rows returned | Integration | P1 |
| E2E: Create new submission via modal, verify it appears in list | E2E | P1 |

### 7.4 HA Queries

| Scenario | Type | Priority |
|----------|------|---------|
| Create HA query linked to submission | Integration | P0 |
| AI-generated response requires `approved_by` before status can be `response_submitted` — enforce at API | Integration | P0 |
| Approve AI response and set status to submitted — verify `approved_at` timestamp set | Integration | P0 |
| Query with past due_date appears with `overdue` status in open queries view | Integration | P0 |
| Filter HA queries by query_type and AI draft readiness | Integration | P1 |

### 7.5 Dossier Management

| Scenario | Type | Priority |
|----------|------|---------|
| Create dossier and populate modules in CTD hierarchy (parent-child) | Integration | P0 |
| AI gap check sets `ai_gap_detected = TRUE` on incomplete modules, stores `gap_description` | Integration | P0 |
| `completeness_pct` recalculates when module status changes from `in_progress` to `complete` | Integration | P0 |
| Dossier completeness view returns correct aggregate counts per dossier | Integration | P1 |
| Upload document; link to dossier module with CTD path | Integration | P1 |
| E2E: CTD module tree renders in split-panel; AI gap indicators visible | E2E | P1 |

### 7.6 Document Vault

| Scenario | Type | Priority |
|----------|------|---------|
| Upload PDF — S3 pre-signed PUT URL issued, checksum stored on completion | Integration | P0 |
| Upload duplicate file (same checksum) — response includes `duplicate_warning: true` | Integration | P0 |
| Upload new version of existing document — `previous_version_id` set correctly | Integration | P1 |
| Download document — S3 pre-signed GET URL issued with 15-minute expiry | Integration | P0 |
| Full-text search by filename returns matching documents using `pg_trgm` | Integration | P1 |
| Archived documents excluded from default list; retrievable with `include_archived=true` | Integration | P1 |
| File above 5 MB uses S3 multipart upload path | Integration | P1 |

### 7.7 AI Intelligence

| Scenario | Type | Priority |
|----------|------|---------|
| Create AI insight with severity `critical` — verify SES email triggered | Integration | P0 |
| User acknowledges insight — `status` changes to `acknowledged`, `actioned_by` set | Integration | P1 |
| Dismiss insight — `status` changes to `dismissed` | Integration | P1 |
| AI Copilot endpoint accepts prompt; returns structured response within rate limit | Integration | P1 |
| Copilot endpoint returns HTTP 429 when org exceeds 60 requests/hour | Integration | P0 |
| AI insight past `expires_at` has status `expired` | Integration | P1 |
| All AI responses labelled with `ai_model_version` and generation timestamp | Integration | P0 |
| Org-level AI data-sharing toggle `FALSE` — AI call with document content returns HTTP 403 | Integration | P0 |

### 7.8 Labeling

| Scenario | Type | Priority |
|----------|------|---------|
| Create label for product + market + type; unique constraint prevents duplicate | Integration | P0 |
| Create label version with document linkage; version number increments | Integration | P1 |
| Create label translation with language code; status defaults to `pending` | Integration | P1 |
| AI harmonisation action triggers and stores report | Integration | P1 |

### 7.9 Publishing

| Scenario | Type | Priority |
|----------|------|---------|
| Create publishing job with valid format; status defaults to `queued` | Integration | P1 |
| Status transitions: `queued` → `in_progress` → `quality_check` → `submitted` | Integration | P1 |
| Failed job stores error message in `error_log` field | Integration | P1 |
| Publishing queue filtered by status returns correct subset | Integration | P1 |

### 7.10 Audit Log

| Scenario | Type | Priority |
|----------|------|---------|
| Create registration — audit log entry with `action=create`, old_values=null, new_values=full record | Integration | P0 |
| Update registration status — audit log entry with before and after values | Integration | P0 |
| Soft-delete document — audit log entry captured | Integration | P0 |
| API has no endpoint to update or delete audit_log — verify no such route exists | Integration | P0 |
| Audit log queryable by entity_type, entity_id, user_id, and date range | Integration | P1 |
| Audit log entries for one org are not visible to another org | Integration | P0 |

---

## 8. Security Testing

### 8.1 Authentication Boundary Tests

| Test | Expected Result |
|------|----------------|
| Request to protected endpoint with no Authorization header | HTTP 401 |
| Request with malformed JWT (wrong signature) | HTTP 401 |
| Request with expired JWT (past `exp` claim) | HTTP 401 |
| Request with valid JWT but user `is_active = FALSE` | HTTP 401 |
| Request with valid JWT from a deactivated organisation | HTTP 401 |

### 8.2 RBAC Enforcement Tests

Each of the following must return HTTP 403 when the authenticated user has insufficient role:

| Action | Minimum Role Required |
|--------|----------------------|
| Create/update/delete registration | `regulatory_affairs_specialist` or higher |
| Approve document or HA response | `regulatory_lead` or higher |
| Create/deactivate user | `super_admin` |
| Change user role | `super_admin` |
| Access records not explicitly shared | `external_reviewer` blocked to own scope only |
| View analytics across multiple orgs | Blocked — all queries scoped to `org_id` |

### 8.3 Cross-Tenant Isolation Tests

| Test | Expected Result |
|------|----------------|
| Authenticated user from Org A attempts to GET a registration belonging to Org B by ID | HTTP 404 (not 403 — do not reveal existence) |
| Analytics endpoint with Org A credentials returns only Org A aggregates | Verified via count assertions against known data |
| Search query from Org A does not return Org B documents in results | Verified via document count |

### 8.4 Input Validation and Injection

- All API inputs are validated against Zod schemas in integration tests; invalid payloads must return HTTP 400 with field-level error details.
- SQL injection attempt in search/filter parameters — verified to have no effect (parameterised queries).
- XSS payload in text fields — verify stored value is plain text, not executed in E2E render.
- File upload with disallowed MIME type (e.g., `application/exe`) — expect HTTP 400.

---

## 9. Performance Testing

### 9.1 Approach

Performance tests use k6 and run against the demo environment (real AWS infrastructure). They are not run on every PR — they run on merge to `main` and before every release.

### 9.2 Response Time Targets for Key API Endpoints

| Endpoint | P50 Target | P95 Target | P99 Target |
|----------|-----------|-----------|-----------|
| `GET /registrations` (10,000 rows, paginated) | < 120 ms | < 300 ms | < 500 ms |
| `GET /submissions/pipeline` | < 150 ms | < 300 ms | < 500 ms |
| `GET /dashboard` (all widget calls in parallel) | < 400 ms | < 800 ms | < 1,500 ms |
| `POST /registrations` (create) | < 100 ms | < 250 ms | < 400 ms |
| `POST /ai/copilot` (first token, streaming) | < 1,000 ms | < 3,000 ms | < 5,000 ms |
| `POST /documents/upload-url` (pre-signed URL) | < 80 ms | < 200 ms | < 300 ms |
| `GET /audit-log` (date range query) | < 200 ms | < 500 ms | < 800 ms |

### 9.3 Load Scenarios

| Scenario | Concurrent Users | Duration | Pass Criteria |
|----------|-----------------|----------|--------------|
| Steady state | 50 | 5 min | P95 within targets above; error rate < 0.1% |
| Peak load | 200 | 2 min | P95 within 2x targets above; error rate < 1% |
| Spike test | Ramp from 0 to 500 in 30 s | 1 min | No cascade failure; graceful degradation |

### 9.4 Database Query Performance

- Every query path that runs against a table with more than 10,000 rows must be verified with `EXPLAIN ANALYZE` in CI.
- Any plan showing a sequential scan on an indexed table is a blocking failure.
- The EXPLAIN output is captured as a CI artefact for review.

---

## 10. Accessibility Testing

### 10.1 Standard

RegAxis RIM must meet **WCAG 2.1 AA** conformance. Accessibility is not optional — the product is used in highly structured, detail-intensive workflows where accessibility failures directly impact usability for a significant portion of the workforce.

### 10.2 Automated Checks (Playwright + axe-core)

Every Playwright E2E test suite includes an `axe` accessibility scan on the page state being tested. The scan must return zero violations at WCAG AA level. Violations are treated as test failures, not warnings.

| Page / State | axe Scan Coverage |
|--------------|------------------|
| Login page | Yes |
| Dashboard | Yes |
| Registrations list | Yes |
| Registration detail modal (open state) | Yes |
| New registration form (modal) | Yes |
| Renewals page | Yes |
| Submissions list | Yes |
| Dossier management (split panel) | Yes |
| AI Insights page | Yes |
| Analytics page | Yes |
| Labeling page | Yes |
| Archive page | Yes |

### 10.3 Manual Accessibility Checks (pre-release)

The following must be verified manually before every GA release and major version:

| Check | Tool / Method |
|-------|--------------|
| Full keyboard navigation of primary flows (login → create registration → add document) | Keyboard only, no mouse |
| Screen reader compatibility on Dashboard and Registrations pages | NVDA + Chrome; VoiceOver + Safari |
| Focus order is logical and visible on all modals | Keyboard tab sequence review |
| Colour contrast ratio meets WCAG AA (4.5:1 for normal text, 3:1 for large text) | Colour Contrast Analyser |
| Status badges (rose/amber/green/sky) do not rely on colour alone — include icon or text label | Visual review |
| Form error messages are linked to inputs via `aria-describedby` | axe + manual check |
| Data tables have correct `scope` headers and ARIA roles | axe + manual check |

---

## 11. Test Maintenance

- Test files mirror the source file they test. `apps/api/src/services/registrationService.ts` has its tests in `apps/api/src/services/registrationService.test.ts`.
- E2E tests live in `apps/web/e2e/` organised by module (e.g. `registrations.spec.ts`, `dossier.spec.ts`).
- Factories are the single source of truth for test data shape. When schema changes, update the factory first — broken factories surface broken tests immediately.
- Flaky E2E tests must be investigated and fixed within one sprint. A flaky test that cannot be fixed must be quarantined (tagged `@flaky` and excluded from CI gate) with a tracking issue filed.
- Test run time is monitored. If total CI time exceeds 20 minutes, the slowest tests are profiled and optimised or moved to a separate nightly job.

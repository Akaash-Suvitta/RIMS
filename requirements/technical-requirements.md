# RegAxis RIM — Technical Requirements

Version: 1.0
Date: 2026-05-05
Status: Draft

---

## 1. Functional Requirements

Requirements are numbered (TR-F-NNN), testable, and binary (pass/fail).

### 1.1 Authentication and Session Management

| ID | Requirement |
|----|-------------|
| TR-F-001 | The system must authenticate users via AWS Cognito. A valid JWT access token must be required for every protected API endpoint. |
| TR-F-002 | The system must refresh JWT tokens silently before expiry. If the refresh token is invalid or expired, the user must be redirected to the login page. |
| TR-F-003 | The system must enforce org-level data isolation: every API query must apply a WHERE clause filtering by the authenticated user's `org_id`. |
| TR-F-004 | The system must support the eight user roles defined in `user_role_enum`: `super_admin`, `regulatory_lead`, `regulatory_affairs_manager`, `regulatory_affairs_specialist`, `dossier_manager`, `submission_coordinator`, `labeling_specialist`, `read_only`, `external_reviewer`. |
| TR-F-005 | The system must reject API calls where the authenticated user's role is insufficient for the requested action, returning HTTP 403 with a descriptive error. |
| TR-F-006 | User sessions must be invalidated on the server side when a user is deactivated (`is_active = FALSE`). |

### 1.2 Registrations Module

| ID | Requirement |
|----|-------------|
| TR-F-010 | The system must allow creation of a registration record specifying: product, country, health authority, registration type, status, registration number, approval date, and expiry date. |
| TR-F-011 | The system must prevent creation of duplicate registrations (same product + country + health authority + registration number) and return HTTP 409 on conflict. |
| TR-F-012 | The system must expose a filterable, sortable, paginated registrations list supporting filter by: status, country, health authority, product, days_until_expiry range. |
| TR-F-013 | The system must enforce valid registration status transitions as defined in business rule BR-06. An invalid transition must return HTTP 422 with a message listing valid next statuses. |
| TR-F-014 | The `days_until_expiry` computed column must be read-only via the API. |
| TR-F-015 | The system must allow creation, update, and listing of post-approval variations linked to a registration. |
| TR-F-016 | The system must allow creation and tracking of post-approval conditions linked to a registration. |

### 1.3 Renewals Module

| ID | Requirement |
|----|-------------|
| TR-F-020 | The system must display all registrations with `days_until_expiry` between 0 and 365 in the Renewals view, sorted ascending by urgency. |
| TR-F-021 | The system must support creation of a renewal record linked to a registration, capturing: renewal number, status, target submission date, submitted date, and approved date. |
| TR-F-022 | The system must send an automated email notification (via AWS SES) when a registration's `days_until_expiry` reaches 180, 90, 60, 30, and 14 days. Notifications must be sent to the registration owner and all `regulatory_lead` users in the organisation. |
| TR-F-023 | The system must allow an AI renewal package generation action on a renewal record, which triggers an AI content generation call and stores the result. The `ai_package_generated` flag must be set to TRUE and `ai_package_generated_at` recorded. |

### 1.4 Submissions Module

| ID | Requirement |
|----|-------------|
| TR-F-030 | The system must allow creation of a submission record specifying: product, health authority, submission type, internal reference, target file date, PDUFA/action date, and linked dossier. |
| TR-F-031 | The system must enforce valid submission status transitions as defined in business rule BR-07. |
| TR-F-032 | The system must allow creation, assignment, and status updates of submission tasks linked to a submission record. |
| TR-F-033 | The system must allow attachment of documents to a submission, capturing the CTD section and document role. |
| TR-F-034 | The system must support listing and filtering of HA queries linked to a submission, with filter by: query type, status, due date range, and AI draft readiness. |
| TR-F-035 | The system must allow creation of an HA query response with source `ai_generated`, `ai_assisted`, `template`, or `manual`. AI-generated responses must require approval before status can be set to `response_submitted`. |
| TR-F-036 | The system must expose a submission pipeline view returning all active (non-terminal) submissions with open HA query counts, corresponding to the `vw_submission_pipeline` database view. |

### 1.5 Dossier Management Module

| ID | Requirement |
|----|-------------|
| TR-F-040 | The system must allow creation of a dossier linked to a product, specifying dossier format, target health authority, and name. |
| TR-F-041 | The system must allow creation and management of dossier modules in a hierarchical CTD structure (Modules 1–5 with sub-sections), including parent–child relationships via `parent_module_id`. |
| TR-F-042 | The system must allow linking of documents to dossier modules with a CTD path, document status, and primary document flag. |
| TR-F-043 | The system must support an AI dossier gap-check action that analyses the dossier module tree, sets `ai_gap_detected = TRUE` on incomplete modules, and records gap descriptions. |
| TR-F-044 | The dossier completeness percentage must be recalculated and persisted whenever a module's status changes. |
| TR-F-045 | The system must return dossier completeness statistics per dossier, corresponding to the `vw_dossier_completeness` database view. |

### 1.6 Document Vault

| ID | Requirement |
|----|-------------|
| TR-F-050 | The system must support file upload to AWS S3. The S3 path must be stored in `documents.file_path`. Supported MIME types at minimum: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. |
| TR-F-051 | The system must compute and store the SHA-256 checksum of every uploaded file. If an identical checksum already exists in the organisation's vault, the API must return a warning in the response (HTTP 200 with a `duplicate_warning` flag). |
| TR-F-052 | The system must support document versioning: uploading a new version must create a new `documents` row with `previous_version_id` set to the prior version's ID. |
| TR-F-053 | The system must allow full-text search across document file names within an organisation using the `pg_trgm` index. |
| TR-F-054 | Documents must support soft-archival (`is_archived = TRUE`). Archived documents must be excluded from active document lists but retrievable via an explicit filter. |

### 1.7 Publishing Module

| ID | Requirement |
|----|-------------|
| TR-F-060 | The system must allow creation of a publishing job linked to a submission and optionally a dossier, specifying the output format (eCTD v3, eCTD v4, EU CTD, ANVISA e-dossier, etc.). |
| TR-F-061 | The system must track publishing job status through the following states: `queued` → `in_progress` → `quality_check` → `submitted` or `failed`. |
| TR-F-062 | The system must store error logs for failed publishing jobs in `publishing_jobs.error_log`. |
| TR-F-063 | The system must expose a publishing queue list filterable by status and format. |

### 1.8 AI Intelligence Module

| ID | Requirement |
|----|-------------|
| TR-F-070 | The system must allow creation and retrieval of AI insights linked to an organisation, with fields: insight_type, title, insight_text, severity, status, referenced entity, confidence score, and expiry. |
| TR-F-071 | The system must support the following insight types: `gap_detection`, `renewal_risk`, `query_assist`, `market_gap`, `reg_watch`. |
| TR-F-072 | The system must allow users to acknowledge, action, or dismiss an AI insight. Status updates must be recorded with `actioned_by` user ID and `actioned_at` timestamp. |
| TR-F-073 | The system must expose a regulatory intelligence feed of HA guideline updates, filterable by health authority, impact level, and published date range. |
| TR-F-074 | The AI Copilot endpoint must accept a natural language prompt and return a structured response. The endpoint must enforce a per-organisation rate limit. |
| TR-F-075 | All AI API calls to external models (e.g., Anthropic Claude) must be proxied through the backend. The frontend must never call external AI APIs directly. |

### 1.9 Labeling Module

| ID | Requirement |
|----|-------------|
| TR-F-080 | The system must allow creation of a label record per product per market per label type (USPI, SmPC, CCDS, JPI, PIL, etc.), enforcing the unique constraint on (product, label_type, market). |
| TR-F-081 | The system must support creation of label versions with version numbering, change summary, and document linkage. |
| TR-F-082 | The system must support label translations linked to a label, capturing language code, translation status, and AI quality check flags. |
| TR-F-083 | The system must support an AI label harmonisation action that compares label versions across markets and generates a harmonisation report. |

### 1.10 Analytics Module

| ID | Requirement |
|----|-------------|
| TR-F-090 | The system must expose an analytics API returning: total active registrations by status and country, submissions by status and health authority, approval rate per HA, and average submission-to-approval days. |
| TR-F-091 | The analytics API must respect org-level scoping; no aggregate query must return cross-organisation data. |
| TR-F-092 | The system must support date-range filtering on all analytics endpoints. |

### 1.11 Archive Module

| ID | Requirement |
|----|-------------|
| TR-F-100 | The system must expose an archive view of all submissions with status `approved`, `rejected`, or `withdrawn`, including attached documents and HA query responses. |
| TR-F-101 | The system must track total document storage volume per organisation (sum of `file_size_bytes` across non-archived documents). |
| TR-F-102 | Archived submissions must remain searchable by submission number, product, and health authority. |

### 1.12 Audit Log

| ID | Requirement |
|----|-------------|
| TR-F-110 | The system must write an audit log entry for every create, update, and delete operation on the following tables: `organizations`, `users`, `products`, `registrations`, `registration_renewals`, `registration_variations`, `dossiers`, `documents`, `submissions`, `ha_queries`, `labels`, `label_versions`. |
| TR-F-111 | Audit log entries must capture: `org_id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values` (JSONB), `new_values` (JSONB), `ip_address`, `user_agent`, and `occurred_at`. |
| TR-F-112 | The audit log must be queryable by entity type, entity ID, user ID, and date range. |
| TR-F-113 | The API must not expose any endpoint that allows updating or deleting audit log records. |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement |
|----|-------------|
| TR-NF-001 | API endpoints for list views (registrations, submissions, documents) must return responses within 300 ms at P95 for queries against a dataset of 10,000 records per organisation. |
| TR-NF-002 | Dashboard page must complete initial data load (all widget API calls) within 2 seconds on a 10 Mbps connection. |
| TR-NF-003 | File upload to S3 must support files up to 500 MB without timeout. Uploads larger than 5 MB must use S3 multipart upload. |
| TR-NF-004 | The AI Copilot must return an initial streaming response token within 3 seconds of the prompt being submitted. |
| TR-NF-005 | Database queries must not perform sequential scans on tables exceeding 10,000 rows. All high-frequency query paths must be covered by indexed columns (enforced via EXPLAIN ANALYZE in CI). |

### 2.2 Scalability

| ID | Requirement |
|----|-------------|
| TR-NF-010 | The backend must be stateless. All session state must reside in the JWT or AWS Cognito. This enables horizontal scaling via additional EC2 instances behind the ALB. |
| TR-NF-011 | The database connection pool must use RDS Proxy to support connection multiplexing across EC2 instances. |
| TR-NF-012 | The system must support at least 100 concurrent authenticated users per organisation without degradation in response times. |
| TR-NF-013 | S3 storage for document files must have no hard capacity limit at the application level. |

### 2.3 Security

| ID | Requirement |
|----|-------------|
| TR-NF-020 | All HTTP traffic must use TLS 1.2 or higher. HTTP-only traffic must be redirected to HTTPS. |
| TR-NF-021 | All secrets (database credentials, API keys, AWS credentials) must be stored in AWS Secrets Manager or environment variables injected at runtime. No secrets may be committed to the repository. |
| TR-NF-022 | S3 document buckets must have public access blocked. Documents must be served via pre-signed S3 URLs with a maximum expiry of 15 minutes. |
| TR-NF-023 | All user inputs must be validated using Zod schemas on the backend before processing. |
| TR-NF-024 | SQL queries must use parameterised queries or an ORM. Raw string interpolation into SQL is prohibited. |
| TR-NF-025 | Rate limiting must be applied to authentication endpoints (max 10 failed attempts per IP per 15 minutes) and AI Copilot endpoints (max 60 requests per organisation per hour). |
| TR-NF-026 | CORS must be configured to allow only the production Vercel domain and explicitly listed development origins. |
| TR-NF-027 | Sensitive fields (e.g., API keys stored in preferences JSONB) must be encrypted at rest using AES-256 before storage. |

### 2.4 Availability and Reliability

| ID | Requirement |
|----|-------------|
| TR-NF-030 | System uptime must be 99.9% monthly (less than 8.7 hours downtime per month), excluding scheduled maintenance windows announced 48 hours in advance. |
| TR-NF-031 | The backend must return meaningful error responses (with error codes and messages) for all 4xx and 5xx failures. Generic 500 errors with stack traces must not reach the client in production. |
| TR-NF-032 | Database backups must run daily via RDS automated backups with a 30-day retention period. |
| TR-NF-033 | Health check endpoints (`GET /health` and `GET /health/db`) must be available on the backend for ALB target group checks. |

### 2.5 Maintainability

| ID | Requirement |
|----|-------------|
| TR-NF-040 | All database schema changes must be managed as versioned migrations (using a migration tool such as node-pg-migrate or Flyway). Raw schema edits to production are prohibited. |
| TR-NF-041 | The backend must follow the layered architecture: handlers → services → repositories → DB. Business logic must not exist in route files or database queries. |
| TR-NF-042 | Environment variables must be validated at application startup using Zod (`lib/config.ts`). The application must not start if required variables are missing. |
| TR-NF-043 | TypeScript strict mode must be enabled for both `apps/web` and `apps/api`. No `any` types are permitted without an explicit eslint-disable comment and justification. |

---

## 3. Integration Requirements

### 3.1 AWS Cognito

| ID | Requirement |
|----|-------------|
| TR-I-001 | The frontend must use the AWS Amplify or Cognito Hosted UI flow for user login, registration, and password reset. |
| TR-I-002 | The backend must verify JWT tokens issued by the configured Cognito User Pool using the JWKS endpoint. Token verification must occur on every protected request. |
| TR-I-003 | The `sub` claim in the Cognito JWT must be used as the canonical user identifier, linked to the `users` table by a Cognito sub field. |
| TR-I-004 | On first login after Cognito account creation, the backend must create or retrieve the corresponding `users` row and return the user profile to the frontend. |

### 3.2 AWS S3

| ID | Requirement |
|----|-------------|
| TR-I-010 | Document uploads must use pre-signed S3 PUT URLs generated by the backend. The frontend must upload files directly to S3 using the pre-signed URL; files must not be proxied through the backend. |
| TR-I-011 | Document downloads must use pre-signed S3 GET URLs with a 15-minute expiry, generated on demand by the backend. |
| TR-I-012 | S3 bucket must be configured with server-side encryption (SSE-S3 or SSE-KMS). |
| TR-I-013 | S3 object keys must use the pattern: `{org_id}/{entity_type}/{entity_id}/{file_uuid}/{file_name}` to enable per-organisation and per-entity isolation. |

### 3.3 AWS SES

| ID | Requirement |
|----|-------------|
| TR-I-020 | The system must send transactional email via AWS SES for the following events: renewal deadline alerts (180/90/60/30/14 days), submission milestone reached, HA query received, and AI insight of severity `critical` or `high` generated. |
| TR-I-021 | All outbound emails must include the organisation name and a link to the relevant record in the application. |
| TR-I-022 | Email sending must be non-blocking; email dispatch must be queued and processed asynchronously so that the primary API response is not delayed. |
| TR-I-023 | Bounce and complaint handling must be configured via SES event notifications to suppress future sends to addresses that hard-bounced. |

### 3.4 PostgreSQL via RDS

| ID | Requirement |
|----|-------------|
| TR-I-030 | The application must connect to PostgreSQL via RDS Proxy. The connection string must reference the RDS Proxy endpoint, not the RDS instance directly. |
| TR-I-031 | The application must use a connection pool (pg or equivalent) with a maximum pool size configured per EC2 instance. |
| TR-I-032 | Database migrations must be idempotent and reversible. Each migration file must include both an `up` and a `down` step. |

### 3.5 Anthropic AI API

| ID | Requirement |
|----|-------------|
| TR-I-040 | The backend must integrate with the Anthropic Claude API for AI feature endpoints: dossier gap analysis, HA response drafting, renewal package generation, and Copilot chat. |
| TR-I-041 | All Anthropic API calls must include system prompts that enforce regulatory domain context and instruct the model not to fabricate regulatory references. |
| TR-I-042 | The `ai_model_version` field on `ai_insights` and `ha_query_responses` must be populated with the Claude model ID used at generation time. |
| TR-I-043 | The backend must handle Anthropic API rate limit errors (HTTP 429) with exponential back-off and surface a user-friendly error to the frontend if retries are exhausted. |

### 3.6 Future Integrations (Phase 3, defined here for design compatibility)

- **eCTD Authoring Tools:** Veeva Vault, Lorenz eCTD, Extedo — document import via API or SFTP.
- **Agency Portal Submission:** FDA ESG, EMA CESP — structured submission package export.
- **Regulatory Intelligence Vendors:** Citeline, Informa, FDA RSS — automated feed ingestion.
- **SSO/SAML:** Enterprise SAML federation via Cognito Identity Providers.

The Phase 2 architecture must not preclude these integrations. API design must leave extension points (e.g., `metadata` JSONB columns on core tables, configurable webhook destinations).

---

## 4. Data Requirements

### 4.1 Data to be Stored

All entities defined in `rim_schema.sql` are in scope for Phase 2:

- `organizations` — tenant identity
- `users` — RA team members with roles
- `countries`, `health_authorities` — reference data, seeded from schema
- `products` — drug products / therapeutic candidates
- `registrations`, `registration_renewals`, `registration_variations`, `registration_conditions` — registration lifecycle
- `documents` — central document vault (metadata only; file bytes in S3)
- `dossiers`, `dossier_modules`, `dossier_documents` — CTD/eCTD dossier structure
- `submissions`, `submission_documents`, `submission_tasks` — submission workflow
- `ha_queries`, `ha_query_responses` — HA communications
- `labels`, `label_versions`, `label_translations` — labeling lifecycle
- `ai_insights`, `regulatory_intelligence` — AI and intelligence feed
- `publishing_jobs` — publishing queue
- `audit_log` — immutable change history

### 4.2 Data Sensitivity Classification

| Classification | Examples | Controls |
|---------------|----------|---------|
| Highly Sensitive | Unpublished dossier documents, pre-approval submission data, HA query responses | S3 pre-signed URLs only; no public access; encrypted at rest |
| Sensitive | Registration records, user data, organisation data | TLS in transit; org-scoped access; audit logged |
| Internal | Reference data (countries, HAs), analytics aggregates | Read-accessible to all authenticated users within org |

### 4.3 Data Retention

| Entity | Retention Policy |
|--------|-----------------|
| Audit log | Minimum 10 years; never deleted via application |
| Documents (active) | Retained while registration or submission is active |
| Documents (archived) | Minimum 15 years after registration expiry (pharmaceutical regulatory standard) |
| Submissions | Indefinite; archived, not deleted |
| AI insights | Configurable expiry per insight; minimum 1 year in archive |
| User data | Retained while org is active; purged 90 days after org deactivation on request |

### 4.4 Data Residency

- All production data must reside in the AWS `us-east-1` region in Phase 2.
- EU region support (`eu-west-1`) is a Phase 3 requirement for GDPR-strict customers.
- The data model must support a future `data_region` field on the `organizations` table.

---

## 5. Compliance and Security Requirements

### 5.1 21 CFR Part 11 Considerations

21 CFR Part 11 governs electronic records and electronic signatures in FDA-regulated environments. The following controls are required:

| ID | Control | Implementation |
|----|---------|----------------|
| TR-C-001 | Audit trail for all record creation, modification, and deletion | `audit_log` table with old/new values, user, timestamp — implemented via service layer hooks |
| TR-C-002 | Unique user identification — no shared accounts | `users` table has unique email; Cognito enforces unique sub |
| TR-C-003 | Record integrity — records must not be alterable without trace | Soft-delete only; audit log is append-only; database role restricts UPDATE/DELETE on audit_log |
| TR-C-004 | Access control — only authorised users access sensitive records | Role-based access control enforced at API layer; org-scoping on all queries |
| TR-C-005 | Electronic signature linkage — AI-generated responses require named approver | `approved_by` and `approved_at` fields on `ha_query_responses` and `label_versions` |
| TR-C-006 | System date/time — all timestamps in UTC with millisecond precision | `TIMESTAMPTZ` columns; application server NTP synchronised |

### 5.2 GDPR Considerations

| ID | Control |
|----|---------|
| TR-C-010 | Personal data (user email, full_name, phone) must be deletable on user request, subject to retention obligations |
| TR-C-011 | Data processing purposes must be documented in privacy policy and communicated to users on registration |
| TR-C-012 | Third-party AI API calls must not include personally identifiable information in prompts without consent |

### 5.3 General Security Controls

| ID | Control |
|----|---------|
| TR-C-020 | Penetration testing must be performed before GA release |
| TR-C-021 | OWASP Top 10 vulnerabilities must be assessed and mitigated |
| TR-C-022 | Dependency vulnerability scanning must run in CI (using `npm audit` or equivalent) |
| TR-C-023 | No production secrets may be stored in source code or version control |
| TR-C-024 | All administrative actions (user role change, org deactivation) must generate audit log entries |

---

## 6. Browser and Device Support Matrix

### Supported Browsers (Tier 1 — fully supported and tested)

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Google Chrome | Last 2 major versions | Primary target; all features must work |
| Microsoft Edge (Chromium) | Last 2 major versions | Enterprise default at many pharma companies |
| Mozilla Firefox | Last 2 major versions | Secondary; all features must work |
| Apple Safari | Last 2 major versions | macOS users; all features must work |

### Supported Browsers (Tier 2 — best-effort, not actively tested)

| Browser | Notes |
|---------|-------|
| Safari on iOS 16+ | Read-only access may work; full edit flows not guaranteed |
| Chrome on Android | Same as iOS above |

### Unsupported

| Browser | Reason |
|---------|--------|
| Internet Explorer 11 | EOL; lacks CSS Grid, modern ES features |
| Chrome below v100 | Too far behind; ES2020 dependencies |

### Viewport and Device

| Category | Requirement |
|----------|-------------|
| Minimum supported desktop width | 1280px (Phase 2) |
| Recommended design target | 1440px |
| Mobile support | Not required in Phase 2; layout must not break at 768px (no overlapping UI elements) |
| High DPI (Retina) | SVG icons and 2x image assets required; no blurry icons |

### Accessibility

The system must meet WCAG 2.1 AA conformance. See Test Requirements for specific criteria.

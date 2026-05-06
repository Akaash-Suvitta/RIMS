# RegAxis RIM — API Contract

Version: 1.0
Date: 2026-05-05
Status: Approved

This document is the single source of truth for the REST API between the frontend and backend. All endpoint shapes, request/response formats, and error codes defined here govern implementation on both sides.

---

## 1. Conventions

| Convention | Detail |
|------------|--------|
| **Base URL** | `/api/v1` |
| **Content-Type** | All responses: `application/json` |
| **Auth header** | `Authorization: Bearer <jwt>` on all protected routes |
| **Tenant isolation** | `tenantId` sourced from verified JWT (`custom:org_id`) only — never from request body or query params |
| **Timestamps** | ISO 8601 UTC — `2026-05-05T12:00:00Z` |
| **IDs** | UUID strings |

### Pagination (cursor-based)

Query params: `?cursor=<last_id>&limit=<n>` — default `25`, max `100`

Response envelope for all list endpoints:
```json
{ "data": [], "nextCursor": "uuid | null", "total": 142 }
```

### Error Envelope

```json
{ "code": "ERROR_CODE", "message": "Human-readable.", "details": {} }
```

`details` is present only on `VALIDATION_ERROR` (field-level map) and `DEMO_LIMIT_EXCEEDED` (`limit`, `current`).

---

## 2. Error Codes Reference

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist or is not accessible to this tenant |
| `VALIDATION_ERROR` | 400 | Zod validation failed; `details` is a field-to-message map |
| `CONFLICT` | 409 | Unique constraint violation |
| `UNPROCESSABLE` | 422 | Business rule violation (e.g. invalid status transition) |
| `DEMO_LIMIT_EXCEEDED` | 402 | Demo tier cap hit; `details.limit` and `details.current` are set |
| `INTERNAL_ERROR` | 500 | Unexpected server error; stack never exposed to client |

---

## 3. Role Shorthand

| Used below | Covers |
|------------|--------|
| `contributor+` | `regulatory_affairs_specialist`, `dossier_manager`, `submission_coordinator`, `labeling_specialist`, `regulatory_affairs_manager`, `regulatory_lead`, `super_admin` |
| `manager+` | `regulatory_affairs_manager`, `regulatory_lead`, `super_admin` |
| `admin` | `super_admin` |

`read_only` and `external_reviewer` have read access only (externals scoped to explicitly shared records).

---

## 4. Endpoints

### 4.1 Health — Public, no auth

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| `GET` | `/health` | Service liveness | `{ status, env, version }` |
| `GET` | `/health/db` | DB connectivity check (`SELECT 1`) | `{ status, latencyMs }` |

---

### 4.2 Auth — Public

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/auth/refresh` | `{ refreshToken }` | `{ accessToken, expiresIn }` |
| `POST` | `/auth/logout` | — | `204` — invalidates session server-side |

---

### 4.3 Registrations

All endpoints auth-required and tenant-scoped.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/registrations` | any | Paginated list. Query: `?status&market_id&product_id&expiring_within_days&cursor&limit` |
| `POST` | `/registrations` | `contributor+` | Create registration → `201 Registration` |
| `GET` | `/registrations/:id` | any | Registration + `submissionsCount`, `renewalsCount` |
| `PATCH` | `/registrations/:id` | `contributor+` | Partial update; status transitions validated → `200 Registration` |
| `DELETE` | `/registrations/:id/archive` | `manager+` | Soft-archive (sets `archived_at`) → `204` |

**`Registration` response shape:**
```json
{
  "id": "uuid", "productId": "uuid", "marketId": "uuid", "haId": "uuid",
  "ownerUserId": "uuid | null", "registrationNumber": "string",
  "registrationType": "string", "status": "active",
  "approvalDate": "2024-01-15T00:00:00Z", "expiryDate": "2026-01-15T00:00:00Z",
  "nextRenewalDue": "2025-10-15T00:00:00Z", "daysUntilExpiry": 254,
  "renewalInitiated": false, "lifecycleStage": "string | null",
  "notes": "string | null", "archivedAt": null,
  "createdAt": "...", "updatedAt": "..."
}
```

`daysUntilExpiry` is a read-only computed DB column — not accepted on write.

---

### 4.4 Renewals

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/renewals` | any | Paginated list. Query: `?status&due_before&registration_id&cursor&limit` |
| `POST` | `/renewals` | `contributor+` | Create renewal → `201 Renewal` |
| `GET` | `/renewals/:id` | any | Renewal with embedded `tasks[]` |
| `PATCH` | `/renewals/:id` | `contributor+` | Partial update → `200 Renewal` |
| `GET` | `/renewals/:id/tasks` | any | `RenewalTask[]` |
| `POST` | `/renewals/:id/tasks` | `contributor+` | Create task → `201 RenewalTask` |
| `PATCH` | `/renewals/:id/tasks/:taskId` | `contributor+` | Partial update → `200 RenewalTask` |

**`RenewalTask` shape:** `id`, `renewalId`, `assignedUserId`, `title`, `description`, `status` (`todo|in_progress|completed|blocked`), `dueDate`, `completedAt`, `sortOrder`, `createdAt`, `updatedAt`.

---

### 4.5 Submissions

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/submissions` | any | Paginated list. Query: `?type&status&registration_id&ha_id&cursor&limit` |
| `POST` | `/submissions` | `contributor+` | Create submission → `201 Submission` |
| `GET` | `/submissions/:id` | any | Submission with embedded `documents[]` (includes CTD section mapping) |
| `PATCH` | `/submissions/:id` | `contributor+` | Partial update; invalid status transitions → `422` |

**`Submission` key fields:** `id`, `productId`, `haId`, `dossierId`, `submissionType`, `status`, `targetFileDate`, `actualFileDate`, `pdufaDate`, `completenessPct`, `milestones[]`, `archivedAt`, `createdAt`, `updatedAt`.

---

### 4.6 Dossiers

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/dossiers` | any | Paginated list. Query: `?product_id&status&cursor&limit` |
| `POST` | `/dossiers` | `contributor+` | Create dossier → `201 Dossier` |
| `GET` | `/dossiers/:id` | any | Dossier with top-level `sections[]` |
| `GET` | `/dossiers/:id/sections` | any | All modules as flat list; client builds tree via `parentModuleId` |
| `POST` | `/dossiers/:id/sections` | `contributor+` | Create module → `201 DossierModule` |

**`DossierModule` shape:** `id`, `dossierId`, `parentModuleId`, `moduleCode`, `title`, `status` (`not_started|in_progress|complete|gap_identified|pending_review`), `sortOrder`, `aiGapDetected`, `gapDescription`, `createdAt`, `updatedAt`.

---

### 4.7 Documents

File bytes go directly to S3 via pre-signed URL — they never transit the Express process.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/documents/upload-url` | `contributor+` | Generate S3 pre-signed PUT URL and pre-create the document record |
| `POST` | `/documents/confirm-upload` | any | Mark upload complete after S3 PUT succeeds |
| `GET` | `/documents/:id/download-url` | any | Generate pre-signed GET URL (15-min expiry) |
| `DELETE` | `/documents/:id` | `manager+` | Soft-archive (`is_archived = true`) → `204` |

**`POST /documents/upload-url`** request:
```json
{
  "fileName": "string", "mimeType": "application/pdf", "sizeBytes": 1048576,
  "context": { "type": "dossier_section | submission", "id": "uuid" }
}
```
Response: `{ "uploadUrl": "string", "documentId": "uuid" }`. Returns `DEMO_LIMIT_EXCEEDED` (402) if file > 10 MB or org storage quota exceeded.

**`POST /documents/confirm-upload`** request: `{ "documentId": "uuid" }`. Response: `Document` object with `documentStatus: "uploaded"`.

**`GET /documents/:id/download-url`** response: `{ "url": "string", "expiresAt": "ISO timestamp" }`.

---

### 4.8 Labels

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/labels` | any | Paginated list. Query: `?product_id&market_id&status&label_type&cursor&limit` |
| `POST` | `/labels` | `contributor+` | Create label → `201 Label`. Errors: `CONFLICT` (409) on duplicate product+type+market |
| `GET` | `/labels/:id` | any | Label with embedded `versions[]` and `translations[]` |
| `PATCH` | `/labels/:id` | `contributor+` | Partial update → `200 Label` |
| `POST` | `/labels/:id/approve` | `manager+` | Approve a label version. Body: `{ "versionId": "uuid" }` → `200 LabelVersion` |

**`Label` status enum:** `draft | review | approved | superseded`.
**`LabelVersion` shape:** `id`, `labelId`, `documentId`, `versionNumber`, `versionLabel`, `changeSummary`, `aiHarmonized`, `approvedBy`, `approvedAt`, `createdAt`.

---

### 4.9 AI Intelligence

All AI endpoints: auth required. Demo tier: rate-limited to 10 req/min per tenant via Redis. On limit exceeded → `DEMO_LIMIT_EXCEEDED` (402).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ai/gap-analysis` | Body: `{ "registrationId": "uuid" }` → `{ gaps: GapItem[], tokensUsed: number }` |
| `POST` | `/ai/submission-readiness` | Body: `{ "submissionId": "uuid" }` → `{ score: number, issues: Issue[], recommendations: string[] }` |
| `POST` | `/ai/chat` | Body: `{ "message": string, "context": AiContext }` → `{ "reply": string }` |
| `POST` | `/ai/stream-chat` | Same body as `/ai/chat`. Returns `text/event-stream`; tokens streamed as `data: {"token":"..."}`, terminated with `data: [DONE]` |

**`AiContext`:** `{ "module": "registration|renewal|submission|dossier|labeling|general", "entityId": "uuid (optional)" }`

**`GapItem`:** `{ moduleCode, moduleTitle, severity, description, suggestedAction }`

No direct frontend-to-Anthropic calls permitted — all AI calls are proxied through the backend.

---

### 4.10 Analytics

All endpoints auth-required, tenant-scoped, no query params (date range filters deferred to Phase 3).

| Method | Path | Response summary |
|--------|------|-----------------|
| `GET` | `/analytics/portfolio-health` | `{ total, byStatus: { active, pending, suspended, lapsed, archived }, expiringWithin90Days, overdueRenewals }` |
| `GET` | `/analytics/renewal-compliance` | `{ rate: 0.92, byMarket: { [iso2]: { rate, total } } }` |
| `GET` | `/analytics/submission-timelines` | `{ avgDays, byType: { [type]: { avgDays, count } }, byHa: { [code]: { avgDays, benchmarkDays } } }` |

---

### 4.11 Users and Team

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | any | Current user profile |
| `GET` | `/users` | `admin` | Paginated list of all org users |
| `POST` | `/users/invite` | `admin` | Body: `{ email, role }` → `202 { message: "Invitation sent." }`. SES email dispatched async. `CONFLICT` (409) if email exists. |
| `PATCH` | `/users/:id/role` | `admin` | Body: `{ role }` → `200` updated user. Takes effect immediately. |
| `DELETE` | `/users/:id` | `admin` | Deactivate user (`archived_at` + Cognito disable) → `204` |

**`User` shape:** `id`, `tenantId`, `email`, `fullName`, `role`, `phone`, `department`, `preferences`, `lastLoginAt`, `createdAt`, `updatedAt`.

---

### 4.12 Products

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/products` | any | Paginated list |
| `POST` | `/products` | `contributor+` | Create product → `201 Product` |
| `GET` | `/products/:id` | any | Product with embedded `registrations[]` (id, marketId, status, expiryDate) |
| `PATCH` | `/products/:id` | `contributor+` | Partial update → `200 Product` |

**`Product` key fields:** `id`, `tenantId`, `name`, `brandName`, `internalCode`, `inn`, `productType`, `therapeuticArea`, `dosageForm`, `strength`, `routeOfAdmin`, `archivedAt`, `createdAt`, `updatedAt`.

---

### 4.13 Markets (Reference Data)

**`GET /markets`** — Auth required. Returns the full market list (not paginated, ~200 countries).

Response: `Market[]` — each item: `id`, `iso2`, `iso3`, `countryName`, `region`, `regulatoryFramework`, `healthAuthorities[]` (id, code, fullName, acronym).

---

### 4.14 Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notifications` | Paginated list. Query: `?read=false&cursor&limit`. Shape: `id`, `type`, `title`, `body`, `readAt`, `entityType`, `entityId`, `createdAt`. |
| `PATCH` | `/notifications/:id/read` | Mark one notification read → `200 { id, readAt }` |
| `POST` | `/notifications/read-all` | Mark all unread as read → `200 { markedRead: number }` |

**`notification_type` enum:** `renewal_due | submission_update | task_assigned | ai_complete | system`

---

## 5. Common Request DTOs

### `CreateRegistrationDto`
```json
{
  "productId": "uuid", "marketId": "uuid", "haId": "uuid",
  "registrationNumber": "string", "registrationType": "string",
  "status": "pending (optional)", "approvalDate": "ISO date",
  "expiryDate": "ISO date", "nextRenewalDue": "ISO date (optional)",
  "ownerUserId": "uuid (optional)", "notes": "string (optional)"
}
```

### `UpdateRegistrationDto`
All fields optional. Status validated against allowed transitions server-side.
```json
{
  "registrationNumber": "string", "status": "active | suspended | lapsed",
  "approvalDate": "ISO date", "expiryDate": "ISO date",
  "nextRenewalDue": "ISO date", "ownerUserId": "uuid",
  "lifecycleStage": "string", "notes": "string"
}
```

### `CreateRenewalDto`
```json
{
  "registrationId": "uuid", "targetSubmissionDate": "ISO date",
  "assignedTo": "uuid (optional)", "renewalNumber": "string (optional)",
  "notes": "string (optional)"
}
```

### `CreateSubmissionDto`
```json
{
  "productId": "uuid", "haId": "uuid",
  "submissionType": "ctd | nda | maa | ind | bla | jnda | variation | renewal_application | annual_report",
  "dossierId": "uuid (optional)", "internalRef": "string (optional)",
  "targetFileDate": "ISO date (optional)", "pdufaDate": "ISO date (optional)",
  "notes": "string (optional)"
}
```

### `CreateTaskDto`
```json
{
  "title": "string", "description": "string (optional)",
  "assignedUserId": "uuid (optional)", "dueDate": "ISO date (optional)",
  "sortOrder": 0
}
```

---

## 6. Audit Notes

Every mutating operation on a tracked entity writes an `audit_log` row server-side. No separate audit call is required from the frontend.

Tracked entities: `organizations`, `users`, `products`, `registrations`, `registration_renewals`, `registration_variations`, `dossiers`, `documents`, `submissions`, `ha_queries`, `labels`, `label_versions`.

The audit log is read-only and not exposed via this API in Phase 2. A query interface will be added in Phase 3.

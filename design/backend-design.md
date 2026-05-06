# RegAxis RIM — Backend Design Document

Version: 1.0
Date: 2026-05-05
Status: Approved

---

## 1. Layer Architecture

The API follows a strict four-layer pattern. Imports flow downward only — no layer may import from a layer above it.

```
handlers → services → repositories → DB
```

### 1.1 Folder Structure

```
apps/api/src/
├── handlers/             # One file per resource group. Parse, validate, delegate.
│   ├── registrations.ts
│   ├── renewals.ts
│   ├── submissions.ts
│   ├── dossiers.ts
│   ├── documents.ts
│   ├── publishing.ts
│   ├── ai.ts
│   ├── labeling.ts
│   ├── analytics.ts
│   ├── archive.ts
│   ├── users.ts
│   └── health.ts
├── services/             # One file per domain. Business logic and orchestration.
│   ├── registration.service.ts
│   ├── renewal.service.ts
│   ├── submission.service.ts
│   ├── dossier.service.ts
│   ├── storage.service.ts
│   ├── email.service.ts
│   ├── ai.service.ts
│   ├── labeling.service.ts
│   ├── analytics.service.ts
│   ├── audit.service.ts
│   └── user.service.ts
├── repositories/         # One file per entity. SQL only — no business logic.
│   ├── registration.repo.ts
│   ├── renewal.repo.ts
│   ├── submission.repo.ts
│   ├── dossier.repo.ts
│   ├── document.repo.ts
│   ├── ha-query.repo.ts
│   ├── label.repo.ts
│   ├── publishing.repo.ts
│   ├── audit.repo.ts
│   ├── user.repo.ts
│   └── organization.repo.ts
├── middleware/
│   ├── auth.ts           # JWT extraction and Cognito JWKS verification
│   ├── tenant.ts         # Extracts tenantId from verified JWT claims
│   ├── rbac.ts           # requireRole() factory — returns 403 if insufficient role
│   ├── error.ts          # Global error handler (last in Express chain)
│   └── rate-limit.ts     # express-rate-limit configuration per route group
├── lib/
│   ├── config.ts         # Sole reader of process.env. Zod-validated at startup.
│   └── services.ts       # Adapter factory. Returns concrete implementations per APP_ENV.
├── types/                # Request/response interfaces, re-exports from packages/types
│   ├── request.types.ts
│   ├── response.types.ts
│   └── index.ts
├── migrations/           # node-pg-migrate versioned up/down files
└── index.ts              # App bootstrap: creates adapters, registers routes, starts server
```

### 1.2 Layer Responsibilities

| Layer | Responsibility | What it must NOT do |
|-------|---------------|---------------------|
| **Handlers** | Parse and Zod-validate the request body/params/query; call the relevant service; return the HTTP response. | Contain business logic; touch the DB directly; catch domain errors (let them propagate to the error middleware). |
| **Services** | Orchestrate business logic; call repositories and external adapters; enforce business rules and demo limits. | Write raw SQL; read `process.env` directly; import from handlers. |
| **Repositories** | Execute parameterised SQL via `pg.Pool`; return typed rows; map column names to camelCase. | Contain conditional logic; call other repositories in a chain; import from services. |
| **DB** | Raw `pg.Pool` instance, created once in `lib/services.ts` and injected into repositories. | Accessed from anywhere outside repositories. |

---

## 2. Express App Setup

`index.ts` bootstraps the app in this order:

1. Call `createServices(config)` — fails fast if config is invalid.
2. Apply global middleware: `helmet()`, `cors(corsOptions)`, `morgan('combined')`, `express.json({ limit: '10mb' })`.
3. Register route groups (each imports its handler file and the `Services` object).
4. Register the global error handler last (`middleware/error.ts`).
5. Call `app.listen(config.PORT)`.

```typescript
// CORS origin list — never '*' in demo or production
const corsOptions = {
  origin: env.isLocal
    ? ['http://localhost:3000']
    : env.isDemo
      ? [process.env.DEMO_FRONTEND_URL]
      : [process.env.PROD_FRONTEND_URL],
  credentials: true,
};
```

**Health check endpoints** (no auth required — used by ALB target group):

```
GET /health     → { status: 'ok', env: config.APP_ENV }
GET /health/db  → { status: 'ok', latencyMs: <number> }  (runs SELECT 1)
```

---

## 3. Authentication and Authorization

### 3.1 Auth Middleware (`middleware/auth.ts`)

Applied to every protected route group. Steps:

1. Extract the `Authorization: Bearer <token>` header; return 401 if absent.
2. Decode the token header to obtain the `kid` (key ID).
3. Fetch the matching public key from the Cognito JWKS endpoint (`https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`). Keys are cached in-process for 1 hour.
4. Verify the signature, expiry, issuer, and audience. Return 401 if any check fails.
5. Attach the decoded payload to `req.user` (typed as `JwtPayload`).

### 3.2 Tenant Middleware (`middleware/tenant.ts`)

Runs after auth. Extracts `custom:org_id` from the verified JWT claims and attaches it to `req.tenant`. All downstream service and repository calls receive `req.tenant.id` — it is never sourced from the request body or query string.

### 3.3 RBAC (`middleware/rbac.ts`)

```typescript
// Usage in route registration:
router.delete('/registrations/:id', authMiddleware, requireRole(['regulatory_lead', 'regulatory_affairs_manager']), handler);

function requireRole(allowed: UserRole[]): RequestHandler {
  return (req, res, next) => {
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: `Role '${req.user.role}' cannot perform this action.` });
    }
    next();
  };
}
```

Roles mirror `user_role_enum` from the schema: `super_admin`, `regulatory_lead`, `regulatory_affairs_manager`, `regulatory_affairs_specialist`, `dossier_manager`, `submission_coordinator`, `labeling_specialist`, `read_only`, `external_reviewer`.

### 3.4 Row-Level Isolation

Every repository query includes `WHERE tenant_id = $1` (or `WHERE org_id = $1`). The `tenantId` is injected from `req.tenant.id`, sourced from the verified JWT — never from user-supplied input. Cross-tenant data leakage is structurally impossible.

---

## 4. Environment Tier Strategy

This is the most critical design decision in the backend. All environment-specific branching is encapsulated in exactly two files. No handler, service, or repository file is permitted to branch on `APP_ENV` or read `process.env` directly.

### 4a. `config.ts` — The Sole Environment Reader

```typescript
// apps/api/src/lib/config.ts
import { z } from 'zod';

const schema = z.object({
  APP_ENV:               z.enum(['local', 'demo', 'production']),
  PORT:                  z.coerce.number().default(3001),
  DATABASE_URL:          z.string().url(),
  COGNITO_USER_POOL_ID:  z.string(),
  COGNITO_CLIENT_ID:     z.string(),
  AWS_REGION:            z.string().default('us-east-1'),
  S3_BUCKET:             z.string(),
  SES_FROM_ADDRESS:      z.string().email(),
  ANTHROPIC_API_KEY:     z.string(),
  REDIS_URL:             z.string().url().optional(),     // required in demo/prod
  DEMO_FRONTEND_URL:     z.string().url().optional(),
  PROD_FRONTEND_URL:     z.string().url().optional(),
});

// Throws at startup — the app will not start with a bad config.
export const config = schema.parse(process.env);

export type Config = typeof config;

export const env = {
  isLocal: config.APP_ENV === 'local',
  isDemo:  config.APP_ENV === 'demo',
  isProd:  config.APP_ENV === 'production',
};
```

`config.ts` is imported by `lib/services.ts` and `index.ts` only. Nothing else touches `process.env`.

### 4b. `services.ts` — The Adapter Factory

```typescript
// apps/api/src/lib/services.ts
import { config, env } from './config';

export interface StorageAdapter {
  upload(key: string, body: Buffer, mime: string): Promise<string>;
  getSignedUrl(key: string, expirySeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export interface EmailAdapter {
  send(to: string, subject: string, html: string): Promise<void>;
}

export interface AuthAdapter {
  verifyToken(token: string): Promise<JwtPayload>;
}

export interface AiAdapter {
  complete(prompt: string, systemPrompt: string): Promise<string>;
  streamComplete(prompt: string, systemPrompt: string): AsyncIterable<string>;
}

export interface Services {
  db:      pg.Pool;
  storage: StorageAdapter;
  email:   EmailAdapter;
  auth:    AuthAdapter;
  ai:      AiAdapter;
  redis:   Redis | InProcessMap;   // ioredis in demo/prod; in-process Map in local
}

export function createServices(cfg: Config): Services {
  return {
    db:      createDbClient(cfg),
    storage: env.isLocal ? new LocalStackS3Adapter(cfg) : new AwsS3Adapter(cfg),
    email:   env.isLocal ? new ConsoleEmailAdapter()    : new SesEmailAdapter(cfg),
    auth:    env.isLocal ? new MockAuthAdapter()        : new CognitoAuthAdapter(cfg),
    ai:      env.isLocal ? new StubAiAdapter()          : new AnthropicAiAdapter(cfg),
    redis:   env.isLocal ? new InProcessMap()           : new Redis(cfg.REDIS_URL!),
  };
}
```

The `Services` object is created once at startup in `index.ts` and passed into every handler and service constructor. No singleton imports — all dependencies are injected.

### 4c. Concrete Adapter Implementations Per Tier

| Adapter | local | demo | production |
|---------|-------|------|------------|
| **DB** | Docker `postgres:16` via `docker-compose.yml`; `DATABASE_URL=postgres://localhost:5432/rims` | AWS RDS `db.t3.micro`; connection via RDS Proxy endpoint; pool capped at 5 | AWS RDS `db.r6g.large`; RDS Proxy; full pool size per EC2 instance |
| **Storage** | `LocalStackS3Adapter` — calls LocalStack at `http://localhost:4566`; no AWS credentials needed | `AwsS3Adapter` — real S3 bucket `regaxis-demo-docs`; SSE-S3; 10 MB per-file cap; 1 GB per-org quota | `AwsS3Adapter` — production bucket `regaxis-prod-docs`; SSE-KMS; configurable per-org limits |
| **Email** | `ConsoleEmailAdapter` — logs email body to stdout; no SMTP; no AWS calls | `SesEmailAdapter` — real SES in sandbox mode; only verified recipient addresses | `SesEmailAdapter` — SES production mode; any address on a verified sending domain; bounce/complaint SNS topic |
| **Auth** | `MockAuthAdapter` — `verifyToken()` ignores the token and returns a hard-coded `JwtPayload` for a seeded test user; accepts `X-Test-User` header to switch personas | `CognitoAuthAdapter` — real JWKS verification against demo Cognito user pool | `CognitoAuthAdapter` — production Cognito user pool; keys cached 1 hour in-process |
| **AI** | `StubAiAdapter` — returns canned JSON strings mimicking Claude responses; `streamComplete` yields tokens with 50 ms delays; no Anthropic API calls | `AnthropicAiAdapter` — real Claude API; rate-limited to 10 req/min per tenant via Redis counter; exponential back-off on 429 | `AnthropicAiAdapter` — full quota; per-org rate limit configurable via `preferences` JSONB; back-off on 429 |
| **Cache** | `InProcessMap` — JavaScript `Map` instance; cleared on restart; no Redis needed | AWS ElastiCache `cache.t3.micro`; shared across all demo tenants; key namespaced by `org_id` | AWS ElastiCache production cluster; per-org key namespacing; TTL per counter type |

### 4d. Demo Tier Limit Enforcement

Hard limits are checked in the **service layer** — before the adapter is called. The adapter never needs to know it is in demo mode.

| Limit | Where checked | Trigger condition |
|-------|---------------|-------------------|
| File upload cap: 10 MB per file | `StorageService.upload()` | `body.length > 10_485_760` |
| Storage quota: 1 GB per tenant | `StorageService.upload()` | Aggregate `SUM(file_size_bytes)` from `documents` WHERE `org_id = tenantId` |
| AI rate limit: 10 req/min per tenant | `AiService.complete()` | Redis `INCR` + `EXPIRE` counter; reject if count > 10 |

Error format returned to the frontend for all demo limit violations:

```json
{
  "code": "DEMO_LIMIT_EXCEEDED",
  "message": "File exceeds the 10 MB demo upload limit.",
  "limit": "10 MB",
  "current": "14.2 MB"
}
```

The frontend interprets `code: 'DEMO_LIMIT_EXCEEDED'` to display a non-blocking banner rather than crashing the page. The banner reads: "You've reached a demo limit. [Upgrade to production] to remove this restriction." Upgrade link is configurable via env var `UPGRADE_URL`.

Demo limits are enforced only when `env.isDemo === true` inside each service method — a simple guard at the top of the relevant method:

```typescript
// Inside StorageService.upload():
if (env.isDemo && body.length > DEMO_MAX_FILE_BYTES) {
  throw new DemoLimitError('File exceeds the 10 MB demo upload limit.', '10 MB', formatBytes(body.length));
}
```

`DemoLimitError` is a typed operational error class. The global error handler maps it to HTTP 402 with the `DEMO_LIMIT_EXCEEDED` JSON shape.

---

## 5. Multi-Tenancy

- Every application table contains `tenant_id UUID NOT NULL REFERENCES organizations(id)`.
- The tenant middleware attaches `req.tenant.id` from the verified JWT claim `custom:org_id`.
- Repository base pattern: every query receives `tenantId` as the first parameter and binds it as `$1` in a `WHERE tenant_id = $1` clause. No query is written without this guard.
- Services never accept `tenantId` from caller-supplied request data — it is always passed from `req.tenant.id` in the handler and forwarded down the call chain as a plain argument.
- Database role used by the application (`rims_app`) does not have `UPDATE` or `DELETE` privileges on `audit_log`. Immutability is enforced at the DB level, not just the application level (TR-C-003).

---

## 6. Error Handling

### 6.1 Error Classes

```typescript
// packages/types/src/errors.ts
export class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number) {
    super(message);
  }
}
export class ValidationError  extends AppError { constructor(m: string, public fields?: Record<string, string>) { super('VALIDATION_ERROR', m, 400); } }
export class AuthError         extends AppError { constructor(m: string) { super('UNAUTHORIZED', m, 401); } }
export class ForbiddenError    extends AppError { constructor(m: string) { super('FORBIDDEN', m, 403); } }
export class NotFoundError     extends AppError { constructor(m: string) { super('NOT_FOUND', m, 404); } }
export class ConflictError     extends AppError { constructor(m: string) { super('CONFLICT', m, 409); } }
export class UnprocessableError extends AppError { constructor(m: string) { super('UNPROCESSABLE', m, 422); } }
export class DemoLimitError    extends AppError { constructor(m: string, public limit: string, public current: string) { super('DEMO_LIMIT_EXCEEDED', m, 402); } }
```

### 6.2 Global Error Handler (`middleware/error.ts`)

Last middleware registered in `index.ts`. Handles all thrown errors:

- **`ZodError`** → 400 with `{ code: 'VALIDATION_ERROR', errors: { field: message } }`.
- **`AppError` subclasses** → respond with `statusCode` and `{ code, message }`.
- **`DemoLimitError`** → 402 with `{ code, message, limit, current }`.
- **Unexpected errors** → 500 with `{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }`. Full error (including stack) is logged server-side via Winston. Stack traces never reach the client in demo or production.

---

## 7. Audit Logging

Every `create`, `update`, and `delete` on a tracked entity writes a row to `audit_log` via `AuditService.log()`, called at the end of the relevant service method.

```typescript
await auditService.log({
  orgId:      tenantId,
  userId:     req.user.sub,
  action:     'update',
  entityType: 'registration',
  entityId:   registrationId,
  oldValues:  before,
  newValues:  after,
  ipAddress:  req.ip,
  userAgent:  req.headers['user-agent'],
});
```

`AuditService` calls `AuditRepository.insert()`, which executes a single parameterised `INSERT` — never `UPDATE` or `DELETE`. The `rims_app` database role is granted `INSERT` on `audit_log` only.

Tracked entities (TR-F-110): `organizations`, `users`, `products`, `registrations`, `registration_renewals`, `registration_variations`, `dossiers`, `documents`, `submissions`, `ha_queries`, `labels`, `label_versions`.

---

## 8. Logging

Winston is configured in `lib/services.ts` alongside other adapters:

- **Production / demo:** JSON format, written to stdout (picked up by PM2 log rotation and forwarded to CloudWatch).
- **Local:** Pretty-printed with colours via `winston-pretty`.
- **Log levels:** `error`, `warn`, `info`, `debug`. Default level is `info`; override with `LOG_LEVEL` env var.

Structured fields on every log entry: `tenantId`, `userId`, `requestId` (UUID injected by a request-ID middleware at the top of the chain).

Morgan HTTP log format: `:method :url :status :res[content-length] - :response-time ms requestId=:req[x-request-id]`.

---

## 9. Rate Limiting and Security

### 9.1 Rate Limiting

`express-rate-limit` is applied per route group at the Express router level:

| Route group | Limit | Window |
|-------------|-------|--------|
| `POST /auth/*` (Cognito passthrough endpoints) | 10 failed attempts per IP | 15 minutes |
| `POST /ai/copilot` | 60 requests per org | 1 hour |
| All other routes | 300 requests per IP | 1 minute |

Demo AI rate limiting is enforced additionally at the service layer (10 req/min per tenant via Redis), independent of the IP-based rate limiter above.

### 9.2 Security Headers

`helmet()` is applied globally with the following non-default options:

- `X-Frame-Options: DENY` — prevents clickjacking.
- `Content-Security-Policy` — restricts script sources to self and Vercel domain.
- `Strict-Transport-Security` — enabled in demo and production; `max-age=31536000; includeSubDomains`.
- `X-Content-Type-Options: nosniff`.

### 9.3 Input Sanitization

All incoming request bodies and query parameters are validated against Zod schemas in the handler layer before being passed to services (TR-NF-023). Zod `strip()` is used to discard unknown keys — no unvalidated keys reach the service layer. All SQL is parameterised via `pg` placeholder syntax — raw string interpolation into SQL is prohibited (TR-NF-024).

### 9.4 S3 Document Security

Pre-signed PUT URLs are generated by `StorageService.upload()` and returned to the frontend; file bytes never pass through the Express process (TR-I-010). Pre-signed GET URLs expire in 15 minutes (TR-NF-022). S3 bucket blocks all public access; SSE-S3 (demo) or SSE-KMS (production) encryption at rest.

# Production Deployment — RegAxis RIM

This document covers infrastructure requirements, CI/CD pipeline, deployment procedures, database migrations, secrets management, monitoring, and rollback for the RegAxis RIM production environment.

---

## Infrastructure Requirements

### Compute

| Component | Specification | Notes |
|-----------|-------------|-------|
| EC2 (backend) | `t3.medium` minimum; `r6g.large` recommended for steady load | Multi-AZ via ALB; at least two instances in production |
| ALB | One Application Load Balancer | TLS termination; WAF attached in production |
| Vercel (frontend) | Pro plan recommended | Zero-config Next.js deployment; preview deployments per branch |

### Database

| Component | Specification |
|-----------|-------------|
| RDS PostgreSQL | `db.r6g.large` (production); `db.t3.micro` acceptable for demo/staging |
| RDS Proxy | Required for connection multiplexing; caps pool to `max: 10` connections per instance |
| Multi-AZ | Enabled in production for automatic failover |
| Storage | 100 GB gp3 minimum; enable auto-scaling |
| Backup | Automated backups with 7-day retention; point-in-time recovery enabled |

### Storage

| Resource | Specification |
|----------|-------------|
| S3 bucket (production) | SSE-KMS encryption at rest; all public access blocked; versioning enabled |
| S3 bucket (demo) | SSE-S3 encryption; all public access blocked |
| Presigned URL expiry | Upload: 5 minutes; Download: 15 minutes |

### Networking

| Component | Specification |
|-----------|-------------|
| VPC | Private subnets for EC2, RDS, and ElastiCache; no public endpoints for any data service |
| EC2 instances | No public IP; accessible only through the ALB |
| RDS | Private subnet; no public access |
| ElastiCache Redis | Private subnet; used for rate-limit counters and AI response caching |
| WAF | Attached to the ALB in production; blocks common attack patterns |

### Cache

| Component | Specification |
|-----------|-------------|
| ElastiCache Redis | `cache.r6g.large` cluster (production); `cache.t3.micro` (demo) |
| Redis URL | Injected as `REDIS_URL` environment variable |

---

## Environment Variables

All environment variables are injected at runtime via AWS Secrets Manager or EC2 instance environment. No secrets are ever committed to the repository.

### API (`apps/api`) — production values guidance

| Variable | Purpose | Production value guidance |
|----------|---------|--------------------------|
| `APP_ENV` | Selects production tier; enables real AWS adapters and disables mock auth | Set to `production` |
| `PORT` | Express server port (Nginx proxies to this) | `3001` (do not expose publicly) |
| `DATABASE_URL` | PostgreSQL connection string via RDS Proxy | `postgresql://<user>:<pass>@<rds-proxy-endpoint>:5432/rim_prod` — rotate via Secrets Manager |
| `COGNITO_USER_POOL_ID` | Production Cognito user pool ID | From the Cognito console — format: `us-east-1_Xxxxxxxxx` |
| `COGNITO_CLIENT_ID` | Production Cognito app client ID | From the Cognito console |
| `COGNITO_REGION` | AWS region where the user pool lives | `us-east-1` (or whichever region you deployed to) |
| `AWS_REGION` | Region for all AWS SDK clients | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | IAM credentials for EC2 instance (prefer instance profile — leave blank if using instance profile) | Inject from Secrets Manager or use EC2 instance profile |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key (prefer instance profile) | Inject from Secrets Manager or use EC2 instance profile |
| `S3_BUCKET` | Production S3 bucket name | `regaxis-prod-docs` (or your CDK-provisioned bucket name) |
| `S3_ENDPOINT` | Leave unset in production | Omit entirely; the SDK resolves the real AWS endpoint |
| `SES_FROM_ADDRESS` | Verified sender address in SES production mode | `noreply@regaxis.ai` (must be verified in SES) |
| `ANTHROPIC_API_KEY` | Anthropic API key for real Claude calls | Rotate quarterly; store in Secrets Manager |
| `REDIS_URL` | ElastiCache Redis endpoint | `redis://<elasticache-endpoint>:6379` |

### Web app (Vercel) — production values guidance

| Variable | Purpose | Production value guidance |
|----------|---------|--------------------------|
| `NEXT_PUBLIC_API_URL` | Public API URL the browser calls | `https://api.regaxis.ai` (or your ALB/custom domain) |

Set Vercel environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**. Use separate values for Production, Preview, and Development scopes.

---

## CI/CD Pipeline Overview

The pipeline is defined in `.github/workflows/ci.yml` and runs on GitHub Actions.

### Triggers

| Event | Workflow |
|-------|---------|
| Push to `feature/**` | Lint, type-check, unit tests |
| Pull request against `main` | Full check suite (lint, type-check, unit tests, dependency scan) |
| Merge to `main` | Full check suite + build + deploy |

### Pipeline stages (on merge to `main`)

```
1. Lint & type-check        (turbo lint + turbo type-check)
2. Unit tests               (Vitest — API, no DB required)
3. Dependency scan          (npm audit — fails on high/critical CVEs)
4. Build                    (turbo build)
5. Deploy frontend          (Vercel — automatic via GitHub integration)
6. Deploy backend           (SSH to EC2 → git pull → npm ci → pm2 restart)
7. Run migrations           (pre-deploy step on EC2 — see migration runbook below)
```

### Approval gates

Merges to `main` require at least one approved code review from a repository collaborator. Branch protection rules enforce this — direct pushes to `main` are blocked.

For production deployments, consider adding a GitHub Actions environment with a manual approval step before the EC2 deploy job runs.

---

## Deployment Steps (Manual Fallback)

Use this procedure if the GitHub Actions pipeline is unavailable or needs to be bypassed.

**Step 1 — Run migrations on the production RDS instance first:**

SSH into an EC2 instance that can reach the production RDS:

```bash
ssh -i ~/.ssh/regaxis-prod.pem ec2-user@<ec2-ip>
cd /srv/regaxis-rim
APP_ENV=production npm run migrate
```

Verify the migration completed cleanly before proceeding. If any migration fails, stop here.

**Step 2 — Pull latest code on each EC2 instance:**

```bash
cd /srv/regaxis-rim
git fetch origin
git checkout main
git pull origin main
```

**Step 3 — Install production dependencies:**

```bash
npm ci --omit=dev
```

**Step 4 — Build the API:**

```bash
cd apps/api && npm run build
```

**Step 5 — Restart the API process under PM2:**

```bash
pm2 restart all
pm2 save
```

**Step 6 — Verify the server is healthy:**

```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/db
```

Both should return `{ "status": "ok" }`.

**Step 7 — Deploy the frontend to Vercel:**

```bash
npx vercel --prod
```

Or trigger via the Vercel dashboard.

**Step 8 — Run the post-deployment smoke test checklist** (see section below).

---

## Database Migration in Production

Migrations live in `apps/api/migrations/` and are managed by `node-pg-migrate`. All migrations must be idempotent and reversible.

### Pre-deploy runbook

1. **Create a manual RDS snapshot** before every migration that alters tables or drops columns:
   - AWS Console → RDS → Your instance → Actions → Take snapshot
   - Label it with the date and migration number: `pre-migration-014-2026-05-06`

2. **Check for pending migrations** (dry run):
   ```bash
   APP_ENV=production npm run migrate -- --dry-run
   ```

3. **Run pending migrations**:
   ```bash
   APP_ENV=production npm run migrate
   ```

4. **Verify migration applied cleanly** — check the `migrations` table in the database for the new entry, and check logs for errors.

5. **If a migration fails mid-run**, use the `down` command to roll back the last migration:
   ```bash
   APP_ENV=production npm run migrate -- down
   ```
   Then investigate the cause before retrying.

### Schema change rules

- Never drop a column in the same deployment that removes code references to it. Follow a two-step approach: first deploy code that no longer references the column, then drop the column in a subsequent migration.
- Avoid long-running `ALTER TABLE` statements on large tables without a maintenance window. Use `ADD COLUMN ... DEFAULT NULL` (instant) rather than adding a non-null column with a default that rewrites the table.
- The `audit_log` table is append-only at the database level. No migration may add `UPDATE` or `DELETE` grants on this table.

---

## Secrets Management

All production secrets are stored in **AWS Secrets Manager** or **AWS Systems Manager Parameter Store**. No secret ever touches the git repository.

| Secret | Storage | Rotation |
|--------|---------|---------|
| `DATABASE_URL` (RDS credentials) | AWS Secrets Manager | Automatic rotation every 90 days via RDS integration |
| `ANTHROPIC_API_KEY` | AWS Secrets Manager | Manual rotation quarterly |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | EC2 instance profile preferred; fall back to Secrets Manager | Prefer instance profiles — no key rotation needed |
| Cognito pool IDs | SSM Parameter Store (not secret, but environment-specific) | Update when re-provisioning Cognito |

### Injecting secrets at runtime

On EC2, secrets are injected into the process environment via a startup script that reads from Secrets Manager before PM2 launches the API:

```bash
# Example EC2 user-data / startup hook
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id prod/regaxis/database-url \
  --query SecretString --output text)
pm2 start ecosystem.config.js
```

Alternatively, use the AWS SSM Parameter Store integration with the EC2 instance's IAM role to avoid storing credentials on disk.

### Secret rotation procedure

1. Generate the new secret value.
2. Store the new value in Secrets Manager alongside the old value (use the staging label).
3. Deploy a new version of the application that reads the new secret.
4. Verify the deployment is healthy.
5. Promote the new secret to the `AWSCURRENT` label and deprecate the old one.
6. Confirm no application process is still using the old secret, then delete it.

---

## Monitoring and Alerting Setup

### CloudWatch — EC2 and RDS

| Metric | Threshold | Action |
|--------|-----------|--------|
| EC2 CPU utilisation | > 80% for 5 minutes | Alert; scale out |
| EC2 memory (custom metric via CloudWatch Agent) | > 85% | Alert |
| RDS CPU utilisation | > 75% for 5 minutes | Alert |
| RDS DB connections | > 80% of max | Alert; investigate connection leaks |
| RDS free storage | < 20 GB | Alert; increase storage |
| ALB `5XXCount` | > 10 in 1 minute | Alert; investigate API errors |
| ALB `TargetResponseTime` P95 | > 2 seconds | Alert |

### Application-level logging

The API uses `winston` for structured JSON logging and `morgan` for HTTP request logs. In production (`APP_ENV=production`), morgan uses the `combined` format. Forward logs to CloudWatch Logs via the CloudWatch Agent or via EC2 log group configuration.

Key log patterns to alert on:

- `[config] Invalid environment variables` — the server failed to start
- `[db] Failed to acquire connection` — database connectivity issue
- `HTTP 503` responses — database or downstream service degraded
- `RATE_LIMIT_EXCEEDED` spike — possible abuse or misconfigured client

### Vercel analytics (frontend)

Enable Vercel Web Analytics and Speed Insights from the Vercel dashboard. Key metrics:

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5 s |
| Largest Contentful Paint | < 2.5 s |
| Core Web Vitals (INP, CLS) | Pass (green) |

### Health check endpoints

Configure ALB health checks and external uptime monitoring (e.g., Better Uptime, PagerDuty, or AWS Route 53 Health Checks) against:

- `GET /health` — API alive check (200 = ok)
- `GET /health/db` — database connectivity check (503 = DB unreachable)

Alert if either endpoint returns non-200 for two consecutive checks.

---

## Rollback Procedure

### Frontend rollback (Vercel)

In the Vercel dashboard, navigate to **Deployments**, find the last known-good deployment, and click **Promote to Production**. This takes effect within seconds.

### Backend rollback (EC2)

SSH into each EC2 instance and roll back to the previous commit:

```bash
cd /srv/regaxis-rim
git log --oneline -5          # find the last known-good commit SHA
git checkout <previous-sha>
npm ci --omit=dev
cd apps/api && npm run build
pm2 restart all
```

Verify with `curl http://localhost:3001/health`.

### Database rollback

If a migration must be reverted:

```bash
APP_ENV=production npm run migrate -- down
```

This runs the `down` function of the most recently applied migration. Repeat for each migration to roll back.

If the migration is destructive and `down` is insufficient, restore from the RDS snapshot taken before the migration (see migration runbook). A snapshot restore will cause downtime; coordinate with the team before proceeding.

---

## Post-Deployment Smoke Test Checklist

Run these checks immediately after every production deployment.

- [ ] `GET /health` returns `{ "status": "ok", "env": "production" }`
- [ ] `GET /health/db` returns `{ "status": "ok" }` with a latency under 50 ms
- [ ] ALB target group shows all instances in `healthy` state
- [ ] Web app loads at the production URL (no console errors, no 404 on static assets)
- [ ] Log in via Cognito and navigate to the Registrations dashboard — data loads correctly
- [ ] Create a test registration and verify it appears in the list
- [ ] Upload a test document and verify the upload completes (presigned URL flow)
- [ ] Trigger a renewal alert (or verify the notification panel loads without error)
- [ ] Check CloudWatch Logs for any `ERROR` entries in the first 5 minutes post-deploy
- [ ] Verify Vercel deployment is marked as Production in the Vercel dashboard
- [ ] Check the Vercel Web Vitals dashboard — Core Web Vitals should remain green

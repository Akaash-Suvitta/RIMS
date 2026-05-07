# Local Development Setup — RegAxis RIM

This guide takes a developer from a clean machine to a fully running local stack.

---

## Prerequisites

Install these tools before proceeding. Exact versions matter.

| Tool | Required version | Install |
|------|-----------------|---------|
| Node.js | >= 20.0.0 | https://nodejs.org (use `nvm` or `fnm` to manage versions) |
| npm | >= 10.0.0 (bundled with Node 20) | comes with Node |
| Docker Desktop | >= 4.x | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2 (bundled with Docker Desktop) | comes with Docker Desktop |
| Git | any recent version | https://git-scm.com |

Verify your versions:

```bash
node --version    # must print v20.x.x or higher
npm --version     # must print 10.x.x or higher
docker --version  # must print Docker version 24.x.x or similar
git --version
```

---

## Repository Setup

### Clone

```bash
git clone <repo-url> regaxis-rim
cd regaxis-rim
```

### Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code; protected |
| `feature/<name>` | Feature work; open PRs against `main` |
| `fix/<name>` | Bug fixes |

Always branch off `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

---

## Environment Variables

The API reads all environment variables from `apps/api/.env`. The web app reads from `apps/web/.env.local`. Neither file is committed to git.

### API — `apps/api/.env`

Copy the example file and fill in the values:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Purpose | Safe local value |
|----------|---------|-----------------|
| `APP_ENV` | Selects the environment tier (`local`, `demo`, `production`). Controls which adapters are wired for auth, storage, email, and AI. | `local` |
| `PORT` | TCP port the Express server listens on. | `3001` |
| `DATABASE_URL` | PostgreSQL connection string. The Docker Compose postgres service uses these credentials. | `postgresql://rim:rim_dev@localhost:5432/rim_dev` |
| `COGNITO_USER_POOL_ID` | AWS Cognito user pool ID. **Not used in `local` tier** — any non-empty string satisfies the Zod validator. | `us-east-1_XXXXXXXXX` |
| `COGNITO_CLIENT_ID` | AWS Cognito app client ID. Not used locally. | `xxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `COGNITO_REGION` | AWS region for Cognito. Not used locally. | `us-east-1` |
| `AWS_REGION` | AWS region for all AWS SDK clients. | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key. LocalStack accepts any non-empty value. | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key. LocalStack accepts any non-empty value. | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `S3_BUCKET` | S3 bucket name. Points to LocalStack when `S3_ENDPOINT` is set. | `rim-documents-dev` |
| `S3_ENDPOINT` | LocalStack S3 endpoint. Set this to use LocalStack instead of real S3. | `http://localhost:4566` |
| `SES_FROM_ADDRESS` | Sender address for outgoing email. Emails are console-logged locally — SES is never called. | `noreply@regaxis.ai` |
| `ANTHROPIC_API_KEY` | Anthropic API key. AI calls are stubbed locally — the key is still required by config validation but not used. | `sk-ant-api03-EXAMPLE` |
| `REDIS_URL` | Redis connection string. Optional; only required in demo/production. Leave commented out locally. | _(leave commented)_ |

A complete local `.env` looks like this:

```ini
APP_ENV=local
PORT=3001
DATABASE_URL=postgresql://rim:rim_dev@localhost:5432/rim_dev
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=rim-documents-dev
S3_ENDPOINT=http://localhost:4566
SES_FROM_ADDRESS=noreply@regaxis.ai
ANTHROPIC_API_KEY=sk-ant-api03-EXAMPLE
```

### Web app — `apps/web/.env.local`

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Purpose | Local value |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL the browser uses to reach the API. | `http://localhost:3001` |

---

## Service Dependencies

All local infrastructure (database, S3, mail) is managed via Docker Compose.

| Service | Image | Ports | Credentials |
|---------|-------|-------|-------------|
| `postgres` | `postgres:16` | `5432` | user: `rim`, password: `rim_dev`, db: `rim_dev` |
| `localstack` | `localstack/localstack:latest` | `4566` | accepts any non-empty AWS key/secret |
| `mailhog` | `mailhog/mailhog:latest` | `1025` (SMTP), `8025` (web UI) | no auth required |

Start all services:

```bash
docker compose up -d
```

Verify all three containers are running:

```bash
docker compose ps
```

You should see `postgres`, `localstack`, and `mailhog` all in `running` state.

---

## Install and Start Commands

Run these commands in order from the repository root.

**Step 1 — Install all workspace dependencies:**

```bash
npm install
```

**Step 2 — Start Docker services (if not already running):**

```bash
docker compose up -d
```

**Step 3 — Run database migrations:**

```bash
npm run migrate
```

This runs `node-pg-migrate` migrations under `apps/api/migrations/` against the local Docker postgres instance.

**Step 4 — Seed the database with sample data:**

```bash
npm run seed
```

**Step 5 — Start the development servers (API + web in parallel):**

```bash
npm run dev
```

Turborepo starts both `apps/api` (ts-node-dev, hot-reload) and `apps/web` (Next.js dev server) concurrently.

| Service | URL |
|---------|-----|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| MailHog web UI | http://localhost:8025 |
| LocalStack S3 | http://localhost:4566 |

---

## Verify It Works

### 1. API health check

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{ "status": "ok", "env": "local", "version": "1.0.0" }
```

### 2. Database health check

```bash
curl http://localhost:3001/health/db
```

Expected response:

```json
{ "status": "ok", "latencyMs": 3 }
```

### 3. Authenticated request (no Cognito needed locally)

```bash
curl -H "Authorization: Bearer test-token" http://localhost:3001/api/v1/registrations
```

The local auth adapter accepts `test-token` and returns a `regulatory_lead` user in the `test-tenant` org. You can also use `Authorization: Bearer dev-token-alice` to get a user with `userId=alice`.

### 4. Web app

Open http://localhost:3000 in your browser. The app should load and connect to the API at `http://localhost:3001`.

---

## Common Setup Issues and Fixes

**`docker: command not found` or Docker won't start**

Docker Desktop must be running. Open it from your Applications / Start menu before running `docker compose up`.

**Port already in use (5432, 3001, 3000, 4566)**

Another process is using the port. Find and stop it:

```bash
# macOS / Linux
lsof -i :5432
# Windows (PowerShell)
netstat -ano | findstr :5432
```

Then stop the conflicting process, or change the port mapping in `docker-compose.yml`.

**API starts but immediately exits: `[config] Invalid environment variables`**

The Zod config validator requires every non-optional variable to be present. Check that `apps/api/.env` exists and contains all required keys from the table above. A missing or empty variable causes `process.exit(1)`.

**`npm run migrate` fails: `connect ECONNREFUSED 127.0.0.1:5432`**

The postgres container is not running. Run `docker compose up -d postgres` and wait ~5 seconds before retrying.

**`npm run migrate` fails: `role "rim" does not exist`**

The postgres container initialised with different credentials than the `DATABASE_URL` specifies. Destroy the volume and recreate:

```bash
docker compose down -v
docker compose up -d
```

Then re-run migrations.

**LocalStack not reachable / S3 calls fail**

Check that the `localstack` container is running (`docker compose ps`) and that `S3_ENDPOINT=http://localhost:4566` is set in `apps/api/.env`.

**Next.js cannot connect to API (`Network Error` in browser)**

Verify `NEXT_PUBLIC_API_URL=http://localhost:3001` is set in `apps/web/.env.local`. The variable must have the `NEXT_PUBLIC_` prefix to be available in the browser bundle.

**`ts-node-dev` crashes with `Cannot find module`**

Run `npm install` from the repository root again. Turborepo workspaces link packages via symlinks; running `npm install` inside a subdirectory instead of the root breaks the links.

---

## Running Tests Locally

### API unit tests (34 tests, no database or Docker required)

```bash
cd apps/api && npm test
```

All external services (database, S3, Cognito, Anthropic) are mocked. Tests run in isolation.

To run in watch mode during development:

```bash
cd apps/api && npm run test:watch
```

### Frontend unit tests

```bash
cd apps/web && npm test
```

### End-to-end tests (Playwright)

E2E tests require the full dev stack running (Docker + API + web):

```bash
# In one terminal:
npm run dev

# In another terminal:
cd apps/web && npm run test:e2e
```

Playwright runs against Chrome, Firefox, and Safari by default. See `apps/web/playwright.config.ts` to adjust.

### Type checking (all workspaces)

```bash
npm run type-check
```

### Lint (all workspaces)

```bash
npm run lint
```

---

## Useful Dev Commands

| Command | Scope | What it does |
|---------|-------|-------------|
| `npm run dev` | Root | Start API + web dev servers in parallel via Turborepo |
| `npm run build` | Root | Build both apps for production |
| `npm run lint` | Root | Run ESLint across all workspaces |
| `npm run type-check` | Root | Run `tsc --noEmit` across all workspaces |
| `npm run migrate` | Root | Run pending DB migrations against the `DATABASE_URL` in `apps/api/.env` |
| `npm run seed` | Root | Seed the database with sample tenants, products, and registrations |
| `npm test` | Root | Run all unit tests across all workspaces |
| `cd apps/api && npm run migrate` | API | Run migrations directly (same as root command) |
| `cd apps/api && npm run seed` | API | Seed directly |
| `cd apps/web && npm run test:e2e` | Web | Run Playwright E2E tests |
| `docker compose up -d` | — | Start all Docker services in the background |
| `docker compose down` | — | Stop all Docker services (keeps volumes) |
| `docker compose down -v` | — | Stop all services and destroy all volumes (full reset) |
| `docker compose logs -f postgres` | — | Tail postgres container logs |

# Quickstart — RegAxis RIM

## What This App Does

RegAxis RIM is a multi-tenant SaaS platform for regulatory affairs teams at pharma, biotech, and medical device companies. It centralises the full regulatory lifecycle — product registrations, renewals, submissions, dossier management, and AI-powered analytics — into a single web application backed by an Express/Node.js API and PostgreSQL database.

## 5-Minute Setup

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **Git**.

```bash
# 1. Clone the repo
git clone <repo-url> regaxis-rim && cd regaxis-rim

# 2. Install all workspace dependencies
npm install

# 3. Copy and configure environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# apps/api/.env and apps/web/.env.local are ready to use as-is for local dev.
# No AWS credentials required.

# 4. Start infrastructure (postgres, localstack S3, mailhog email)
docker compose up -d

# 5. Run database migrations and seed sample data
npm run migrate && npm run seed

# 6. Start the development servers
npm run dev
```

The web app is at **http://localhost:3000**. The API is at **http://localhost:3001**.

## First Things to Try

**1. Confirm the API is healthy**

```bash
curl http://localhost:3001/health
# {"status":"ok","env":"local","version":"1.0.0"}
```

**2. Make an authenticated API request**

No Cognito setup required — the local auth adapter accepts a static test token:

```bash
curl -H "Authorization: Bearer test-token" \
  http://localhost:3001/api/v1/registrations
```

You can also use `dev-token-<any-user-id>` to impersonate a specific user:

```bash
curl -H "Authorization: Bearer dev-token-alice" \
  http://localhost:3001/api/v1/registrations
```

**3. Browse the seeded data in the web app**

Open http://localhost:3000. The seed script creates sample products, registrations across multiple markets, and upcoming renewal deadlines — explore the Registrations dashboard and Renewals Calendar to see the data model in action.

**4. View captured emails**

Emails (renewal alerts, submission notifications) are captured by MailHog instead of being sent. Open http://localhost:8025 to see all outgoing mail.

**5. Run the unit tests**

```bash
cd apps/api && npm test
# 34 tests, no DB or Docker required — all services are mocked
```

## Where to Go Next

- **Full local setup with troubleshooting** — `docs/local-setup.md`
- **Production deployment guide** — `docs/production-setup.md`
- **Architecture and system design** — `architecture.md`
- **Stack decisions and layer rules** — `tech-stack.md`
- **App feature scope and data model** — `idea.md`

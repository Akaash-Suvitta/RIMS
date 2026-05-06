# RegAxis RIM — Business Requirements

Version: 1.0
Date: 2026-05-05
Status: Draft

---

## 1. Executive Summary

RegAxis RIM is a SaaS Regulatory Information Management System (RIMS) built for Regulatory Affairs (RA) teams at pharmaceutical, biotech, and medical device companies. The platform unifies the entire regulatory lifecycle — product registrations, renewal calendars, regulatory submissions, dossier assembly, labeling management, and publishing workflows — into a single AI-augmented application.

RA teams today operate across fragmented tools: spreadsheets for registration tracking, shared network drives for dossier storage, email chains for submission coordination, and manual calendar reminders for renewal deadlines. This fragmentation creates measurable business risk: missed renewal deadlines that cause market withdrawal, submission errors that delay approvals, audit failures from incomplete change histories, and strategic blindspots from the absence of portfolio-level analytics.

RegAxis RIM Phase 2 delivers a fully functional, data-driven system grounded in the validated prototype design and the production-ready database schema (`rim_schema.sql`). It replaces manual coordination with structured workflows, automated alerts, and AI-powered insights, giving RA teams the situational awareness and operational control their portfolios demand.

---

## 2. Business Objectives

The following objectives are measurable and time-bound to within 12 months of general availability.

| ID  | Objective | Metric | Target |
|-----|-----------|--------|--------|
| BO-01 | Eliminate missed renewal deadlines | % of renewals submitted before expiry | 100% (zero lapses) |
| BO-02 | Reduce submission preparation time | Avg. days from dossier-ready to filed | Reduce by 30% vs. baseline |
| BO-03 | Achieve compliance-ready audit trails | % of record changes captured in audit log | 100% |
| BO-04 | Accelerate HA query response time | Avg. days from query receipt to response draft | Reduce by 40% via AI drafting |
| BO-05 | Provide portfolio-level visibility | % of active registrations visible in real-time dashboard | 100% |
| BO-06 | Reach commercial viability | Paying customers within 12 months of GA | 10 organisations |
| BO-07 | Establish SaaS revenue | ARR at 12 months post-GA | USD 500,000 |
| BO-08 | Reduce onboarding friction | Time from account creation to first registration entered | Under 2 hours |

---

## 3. Success Metrics (KPIs with Targets)

### Product Adoption KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| Monthly Active Users (MAU) | Unique users logging in per month per customer org | Greater than 80% of licensed seats |
| Feature Adoption Rate | % of orgs using each core module | Greater than 70% across all 9 modules within 90 days |
| Session Frequency | Avg. sessions per user per week | Greater than 3 sessions/week |
| Time to First Value | Days from account creation to first data-entry action | Under 2 business days |

### Operational Efficiency KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| Renewal On-Time Rate | Renewals submitted before expiry date | 100% |
| Dossier Completeness Score | Avg. completeness_pct across active dossiers at submission | Greater than 95% |
| HA Query Response Time | Calendar days from query receipt to submitted response | Median under 10 days |
| AI Insight Actioned Rate | % of AI insights with status 'actioned' vs. 'dismissed' | Greater than 60% |

### Technical Health KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| System Uptime | Monthly availability | 99.9% |
| API P95 Response Time | 95th percentile API latency | Under 500 ms |
| Page Load Time | Core pages (Dashboard, Registrations) | Under 2 seconds on broadband |
| Data Export Success Rate | Exports completing without error | 99.5% |

### Business KPIs
| KPI | Definition | Target |
|-----|-----------|--------|
| Customer Retention Rate | Annual renewal rate | Greater than 90% |
| Net Promoter Score (NPS) | Quarterly NPS survey | Greater than 40 |
| Support Ticket Volume | Tickets per active user per month | Under 0.5 |
| Revenue per Seat | ARR / total licensed seats | USD 1,200/seat/year |

---

## 4. Stakeholders

| Stakeholder | Role | Interest | Influence |
|-------------|------|---------|-----------|
| RA Director / VP Regulatory | Executive sponsor; portfolio accountability | Strategic oversight, audit readiness, cost savings | High |
| RA Specialist / Associate | Primary daily user | Ease of use, reliability, correct data | High |
| Regulatory Submissions Manager | Submission planning and filing | Submission accuracy, timeline visibility | High |
| IT / Systems Administrator | Deployment, SSO, user provisioning | Security, integrations, uptime | Medium |
| Chief Medical Officer | Approval milestone visibility | Portfolio read-only dashboards | Medium |
| External CRO Partner | Dossier contribution | Limited-scope access, document upload | Medium |
| RegAxis Product Team | Platform owner | Feature roadmap, customer feedback | High |
| RegAxis Engineering Team | Build and maintain platform | Technical feasibility, maintainability | High |
| Regulatory Agencies (FDA, EMA, PMDA, etc.) | Indirect — system must support agency requirements | Compliance, format correctness | Low (external) |
| Data Protection Officer | GDPR / regulatory data governance | Data residency, consent, retention | Medium |

---

## 5. User Personas

### Persona 1: RA Director

**Name:** Dr. Priya Mehra
**Title:** Vice President, Global Regulatory Affairs
**Organisation Type:** Mid-size pharma (500–2,000 employees), global portfolio
**Goals:**
- Maintain real-time visibility into the entire regulatory portfolio (30+ registrations, 8+ markets)
- Ensure no registration lapses or submission deadlines are missed
- Justify regulatory investments to the C-suite with data-backed reporting
- Reduce time spent on manual status updates and chasing team members

**Pain Points:**
- Portfolio status requires assembling reports from 4 different spreadsheets
- Missed deadlines discovered only when agency sends a warning letter
- Cannot quickly answer "what is our submission timeline for the new PMDA filing?"
- Audit preparation is a weeks-long manual exercise

**Technical Comfort:** Moderate. Uses dashboards, not raw data tools.
**Primary Modules:** Dashboard, Analytics, Registrations, Renewals

---

### Persona 2: RA Specialist

**Name:** James Okonkwo
**Title:** Senior Regulatory Affairs Specialist
**Organisation Type:** Biotech startup (50–200 employees), 2–4 active markets
**Goals:**
- Track and update individual registration and submission records accurately
- Manage dossier documents and flag gaps before submission
- Respond to health authority queries efficiently with good documentation
- Coordinate renewal timelines without missing preparation steps

**Pain Points:**
- Dossier documents are scattered across SharePoint, email attachments, and local drives
- Health authority queries require manual searching through old submission archives
- Renewal prep checklists exist only as Excel files with no tracking
- No audit trail for document changes — version control is done via filename suffixes

**Technical Comfort:** High. Comfortable with structured applications and data entry.
**Primary Modules:** Registrations, Renewals, Dossier Management, Submissions, AI Intelligence

---

### Persona 3: Regulatory Submissions Manager

**Name:** Michelle Tanaka
**Title:** Regulatory Submissions Manager
**Organisation Type:** Large pharma (5,000+ employees), 15+ markets
**Goals:**
- Coordinate multi-market submission packages on concurrent timelines
- Track submission milestones and PDUFA/action dates across all active filings
- Assign and monitor tasks across the submission team
- Generate HA query responses with AI assistance and route for approval

**Pain Points:**
- Submission timelines are tracked in a shared Gantt chart that is always out of date
- Task assignments are managed via email, with no visibility into blockers
- HA queries are managed in a separate ticketing system not linked to submission data
- Publishing job status requires contacting the eCTD publisher directly

**Technical Comfort:** High. Power user; wants bulk actions, keyboard shortcuts, and filters.
**Primary Modules:** Submissions, Dossier Management, Publishing, AI Intelligence, Archive

---

## 6. User Stories

### RA Director (Dr. Priya Mehra)

| ID | Story |
|----|-------|
| US-DIR-01 | As an RA Director, I want to see a live portfolio dashboard showing all active registrations by country and status so that I can identify risk areas without pulling a manual report. |
| US-DIR-02 | As an RA Director, I want to receive automated email alerts when a registration is within 90 days of expiry so that I can ensure the renewal process starts in time. |
| US-DIR-03 | As an RA Director, I want to view approval rate and submission timeline analytics by health authority so that I can set realistic timelines for board-level planning. |
| US-DIR-04 | As an RA Director, I want to export the full regulatory portfolio as a PDF or Excel report so that I can present it to the executive committee without additional formatting work. |
| US-DIR-05 | As an RA Director, I want to see AI-generated insights flagging portfolio-level risks (e.g., multiple registrations expiring in the same quarter) so that I can prioritise resources proactively. |
| US-DIR-06 | As an RA Director, I want to see which HA guideline changes from the Regulatory Intelligence feed affect my product portfolio so that my team can assess impact before a deadline. |

### RA Specialist (James Okonkwo)

| ID | Story |
|----|-------|
| US-SPEC-01 | As an RA Specialist, I want to create a new registration record by entering product, country, health authority, type, and key dates so that the registration is tracked from day one. |
| US-SPEC-02 | As an RA Specialist, I want to upload documents to a dossier module and have the system verify the CTD path so that the dossier stays correctly structured without manual cross-checking. |
| US-SPEC-03 | As an RA Specialist, I want to run the AI gap checker against a dossier so that I receive a list of missing modules with severity ratings before the submission lead reviews the package. |
| US-SPEC-04 | As an RA Specialist, I want to view the full version history of a label document so that I can verify which version was approved and when, in preparation for an audit. |
| US-SPEC-05 | As an RA Specialist, I want to log a health authority query and have the system generate an AI draft response citing relevant dossier sections so that I can reduce response drafting time from 2 days to under 4 hours. |
| US-SPEC-06 | As an RA Specialist, I want to see renewal countdown timers on the Renewals page sorted by urgency so that I can prioritise my workload each week without reviewing every record. |
| US-SPEC-07 | As an RA Specialist, I want to add a variation record under an existing registration and link relevant documents so that post-approval changes are tracked alongside the parent authorisation. |

### Regulatory Submissions Manager (Michelle Tanaka)

| ID | Story |
|----|-------|
| US-MGR-01 | As a Regulatory Submissions Manager, I want to create a submission record with milestones, a target file date, and a PDUFA/action date so that the entire team can track where the filing stands against plan. |
| US-MGR-02 | As a Regulatory Submissions Manager, I want to assign submission tasks to team members with due dates so that accountability is tracked in the system rather than via email. |
| US-MGR-03 | As a Regulatory Submissions Manager, I want to view a Gantt-style timeline of all active submissions so that I can see schedule conflicts and report progress to the RA Director. |
| US-MGR-04 | As a Regulatory Submissions Manager, I want to initiate a publishing job for a completed dossier and monitor its status (queued → in progress → quality check → submitted) so that I know when the package is ready for agency upload. |
| US-MGR-05 | As a Regulatory Submissions Manager, I want to review and approve an AI-drafted HA query response before it is marked ready-to-submit so that quality and regulatory accuracy are maintained. |
| US-MGR-06 | As a Regulatory Submissions Manager, I want to archive a completed submission with all attached documents and responses so that historical records are preserved and accessible for future reference. |
| US-MGR-07 | As a Regulatory Submissions Manager, I want to filter the submissions list by health authority, status, and product so that I can quickly find the submissions relevant to my current project. |

---

## 7. Business Rules and Constraints

### Data Integrity Rules
- **BR-01:** A registration record must be unique per product + country + health authority + registration number combination. Duplicate entries must be rejected at creation.
- **BR-02:** A submission record must be linked to a product and a health authority. A dossier link is optional at creation but required before the status can advance to `ready_to_file`.
- **BR-03:** A dossier completeness percentage (0–100) must be recalculated every time a dossier module's status changes.
- **BR-04:** An HA query response with source `ai_generated` or `ai_assisted` must have an approved_by user ID set before the response status can change to `submitted`.
- **BR-05:** A document uploaded to the system must have its SHA-256 checksum stored. If a file with the same checksum already exists in the organisation's vault, the system must warn the user of a potential duplicate.

### Lifecycle / Status Rules
- **BR-06:** Registration status must follow valid transitions: `pending_approval` → `under_review` → `active`; `active` → `expiring_soon` → `expired`; `active` → `renewal_filed` → `renewal_pending` → `active`. Backward transitions must be blocked except by a `regulatory_lead` or higher role.
- **BR-07:** Submission status must follow valid transitions: `planning` → `dossier_prep` → `internal_review` → `ready_to_file` → `filed` → `under_review` → `approved` or `rejected`. Jump transitions (e.g., `planning` → `filed`) are not permitted.
- **BR-08:** The `days_until_expiry` on a registration is a computed column and must not be editable directly.

### Compliance Rules
- **BR-09:** Every create, update, and delete operation on core entities (registrations, submissions, dossiers, documents, labels, ha_queries, users) must be written to the `audit_log` table with old_values, new_values, user_id, org_id, and occurred_at. This is non-negotiable for 21 CFR Part 11 compliance.
- **BR-10:** Audit log records must be immutable. No application layer code may update or delete audit log rows. A database-level role restriction must enforce this.
- **BR-11:** Deleted records must be soft-deleted (marked `is_archived = TRUE` or status set to `archived`/`withdrawn`) so audit history is preserved.
- **BR-12:** All timestamps must be stored in UTC. The UI must render timestamps in the user's configured timezone.

### Access Control Rules
- **BR-13:** All data must be scoped to the authenticated user's `org_id`. No query may return records belonging to a different organisation.
- **BR-14:** The `external_reviewer` role may only access records explicitly shared with them; they must not see other products or submissions within the organisation.
- **BR-15:** Only `regulatory_lead`, `regulatory_affairs_manager`, and `super_admin` roles may approve documents and HA query responses.
- **BR-16:** Only `super_admin` may create new users, change user roles, or deactivate user accounts.

### AI Rules
- **BR-17:** AI-generated content (insights, response drafts, gap analyses) must be labelled with the source model version and generation timestamp.
- **BR-18:** AI insights must expire (status → `expired`) if not actioned within the `expires_at` window defined at generation time.
- **BR-19:** The AI Copilot must not transmit document contents to external AI APIs without explicit user consent. An organisation-level toggle must control this.

---

## 8. Assumptions and Dependencies

### Assumptions
- **A-01:** Customers will self-serve data entry for initial portfolio population. A bulk-import tool (CSV upload) is in scope; migration from Veeva/Documentum is not in Phase 2 scope.
- **A-02:** The platform is a multi-tenant SaaS with a shared database (row-level `org_id` scoping). Single-tenant deployment is not required in Phase 2.
- **A-03:** Direct electronic submission to agency portals (FDA ESG, EMA CESP) is out of scope. The platform manages records and documents; the user exports and submits manually.
- **A-04:** The AI Intelligence features will use the Anthropic API (Claude models) as the AI backend. No regulatory-specific AI vendor is required in Phase 2.
- **A-05:** The Regulatory Intelligence feed (HA guideline updates) will be seeded manually or via a simple RSS/JSON integration in Phase 2. A full vendor API integration (Citeline, Informa) is a Phase 3 concern.
- **A-06:** File storage will use AWS S3. All file paths in the database are S3 URIs. Dossier size can scale to multi-TB per organisation over time.
- **A-07:** The system is desktop-first (1280px+ viewport). Mobile-responsive layout is a Phase 3 goal.
- **A-08:** Authentication is AWS Cognito with JWT tokens. SSO (SAML/OIDC) federation for enterprise customers is a Phase 3 goal.

### Dependencies
- **D-01:** AWS infrastructure must be provisioned (EC2, RDS PostgreSQL, S3, Cognito, SES) before backend development begins.
- **D-02:** The `rim_schema.sql` is the authoritative data model baseline; any schema changes must be tracked as versioned migrations.
- **D-03:** The Anthropic API access (Claude) must be available with a production API key before AI features can be built.
- **D-04:** A seed dataset of countries and health authorities (as defined in `rim_schema.sql`) must be loaded before any user can create a registration.
- **D-05:** Email delivery (AWS SES) must be configured in production mode (out of sandbox) before deadline-alert notifications can reach customers.
- **D-06:** Vercel deployment is required for the Next.js frontend; the team must have a Vercel project and domain configured before the first staging deployment.

# RegAxis RIM — Idea Brief

## App Name & Tagline
**RegAxis RIM**
*Regulatory Information Management, powered by AI — from submission to approval, all in one place.*

## Problem Statement
Regulatory Affairs teams at pharma, biotech, and medical device companies manage complex, multi-market product registrations using fragmented tools — spreadsheets, shared drives, and disconnected trackers. This creates missed renewal deadlines, submission errors, poor dossier traceability, and no visibility into portfolio-wide regulatory status. There is no purpose-built, AI-augmented platform that unifies the full regulatory lifecycle in a single system.

## Target Users
Regulatory Affairs professionals at pharmaceutical, biotech, and medical device companies — including Regulatory Affairs Managers, RA Specialists, Dossier Coordinators, and Regulatory Operations leads — who manage product registrations across multiple markets and agencies.

## Core Value Proposition
RegAxis RIM centralises the entire regulatory lifecycle — registrations, renewals, submissions, dossiers, labeling, and publishing — into a single AI-enhanced platform. It replaces error-prone manual tracking with automated workflows, deadline alerts, and AI-driven insights, giving RA teams real-time visibility and control over their global regulatory portfolio.

## Key Features (top 5, ranked by priority)

1. **Registrations & Lifecycle Management** — Track global product registrations across markets, agencies, and lifecycle stages (active, pending, lapsed, archived) with status dashboards and audit trails.
2. **Renewals Calendar & Workflow** — Automated renewal tracking with deadline alerts, task assignments, and approval workflows to eliminate missed expirations.
3. **Submission Tracking** — End-to-end tracking of regulatory submissions (CTD, NDA, MAA, etc.) including submission dates, agency responses, and approval timelines.
4. **Dossier & Document Management** — eCTD/dossier assembly, versioning, and maintenance with structured document storage and change tracking.
5. **AI Intelligence & Analytics** — AI-powered regulatory insights, submission timeline predictions, approval rate analytics, and portfolio-level metrics to support decision-making.

## Out of Scope (explicit non-goals)

- Direct electronic submission to regulatory agencies (e.g., eCTD gateway integration with FDA/EMA) — RegAxis RIM manages records and workflows but does not act as a submission gateway.
- Clinical trial management (CTMS functionality).
- Pharmacovigilance / safety reporting (PVMS functionality).
- ERP or supply chain integration.
- Consumer-facing or patient-facing features.
- Building or validating the publishing pipeline for agency-compliant eCTD packages (v1 scope excludes full publishing automation).

## Constraints

- **Platform:** SaaS web application; no desktop or mobile-native clients in v1.
- **Tech stack:** TypeScript monorepo (Turborepo) — Next.js App Router frontend, Express/Node.js backend, PostgreSQL database.
- **Hosting:** AWS-hosted (EC2 + RDS + S3 + Cognito for auth + SES for email); frontend deployed via Vercel.
- **Authentication:** AWS Cognito-based JWT auth; multi-tenant with organisation-level data isolation.
- **Compliance:** Data handling must support 21 CFR Part 11 / GxP audit trail expectations (every record change logged with user, timestamp, and before/after values).
- **UI:** Dark navy design system (consistent with the existing prototype aesthetic); responsive but desktop-first.
- **Prototype baseline:** Existing single-page HTML/CSS/JS prototype and `rim_schema.sql` serve as the design and data-model reference for v1.

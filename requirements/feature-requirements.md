# RegAxis RIM — Feature Requirements

Version: 1.0
Date: 2026-05-05
Status: Draft

Priority key:
- **Must-Have** — required for MVP / Phase 2 launch; blocking
- **Should-Have** — high value; build in Phase 2 if time allows; not launch-blocking
- **Nice-to-Have** — deferred to Phase 3 unless there is spare capacity

---

## Module 1: Registrations and Lifecycle Management

This module is the core of the platform. It tracks every marketing authorisation, its lifecycle status, and all post-approval activity (variations, conditions, renewals).

---

### FR-REG-01: Registration Record Creation

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to create a new registration record specifying product, country, health authority, registration type, status, registration number, approval date, and expiry date so that the authorisation is tracked from day one.

**Acceptance criteria:**
- Form validates all required fields before submission; returns field-level error messages for missing or invalid data.
- Duplicate check enforced: same product + country + health authority + registration number combination returns a clear error.
- Newly created registration appears immediately in the registrations list without page reload.
- An audit log entry with `action=create` and the full new record values is written on successful creation.

---

### FR-REG-02: Registration List View with Filtering and Sorting

**Priority:** Must-Have

**User story:** As an RA Director, I want to see all registrations in a filterable, sortable, paginated table so that I can find and review any registration in my portfolio without scrolling through unrelated records.

**Acceptance criteria:**
- Table supports filtering by: status, country, health authority, product, and days_until_expiry range (e.g., "expiring within 90 days").
- Table supports sorting on any column (ascending / descending).
- Pagination with configurable page size (25 / 50 / 100 rows).
- Active filters are shown as chips above the table; each chip can be individually cleared.
- Filtered state persists across a page refresh (stored in URL query params).

---

### FR-REG-03: Registration Status Tab Navigation

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to switch between status views (All / Active / Pending / Expiring / Expired) using tabs so that I can focus on only the records relevant to my current task without re-entering filters.

**Acceptance criteria:**
- Tabs show the count of records in each status group, updated in real time.
- Clicking a tab filters the list to only that status group.
- The "Expiring" tab shows registrations with `days_until_expiry` between 0 and 180.
- The active tab state is reflected in the URL so it can be bookmarked.

---

### FR-REG-04: Registration Detail View

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to open a detailed view of a registration showing all fields, linked renewals, variations, and conditions so that I can get the full picture of a registration's current state without navigating to separate pages.

**Acceptance criteria:**
- Detail view opens as a modal (progressive disclosure) without navigating away from the list.
- Displays all registration fields, computed `days_until_expiry`, and the full status history.
- Shows linked renewals, variations, and post-approval conditions in collapsible sub-sections.
- Shows the last 5 audit log entries for the record.

---

### FR-REG-05: Registration Status Lifecycle Enforcement

**Priority:** Must-Have

**User story:** As a Regulatory Lead, I want the system to enforce valid status transitions so that registrations cannot be moved to an invalid state by mistake.

**Acceptance criteria:**
- Only valid next statuses are available in the status update dropdown (per BR-06).
- Backward transitions (e.g., `active` → `pending_approval`) are blocked for all roles below `regulatory_lead`.
- Attempting an invalid transition via the API returns HTTP 422 with a message listing valid next states.
- Every status change is audit-logged with before and after values.

---

### FR-REG-06: Post-Approval Variations Tracking

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to record a post-approval variation (Type IA, IB, II, supplement) under a registration so that all changes to a marketing authorisation are traceable alongside the parent authorisation.

**Acceptance criteria:**
- Variation record captures: variation type, description, filed date, approved date, implementation date, and linked documents.
- Variations are listed in the registration detail view under the parent record.
- Variation status follows the enum: `planning → submitted → under_review → approved / rejected / withdrawn`.
- Audit log entry written for every variation create and update.

---

### FR-REG-07: Post-Approval Conditions Tracking

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to record post-approval conditions (PASS, PAES, risk management plan obligations) attached to a registration so that outstanding commitments are tracked with due dates and not forgotten.

**Acceptance criteria:**
- Condition record captures: condition text, category, due date, fulfilled date, and status.
- Overdue conditions (due_date in the past, status not `complete`) are highlighted in the registration detail view.
- Conditions appear in the registration detail without navigating away.

---

### FR-REG-08: Portfolio Country Map (Dashboard Widget)

**Priority:** Must-Have

**User story:** As an RA Director, I want to see a colour-coded grid of markets showing registration status so that I can scan my global portfolio at a glance from the dashboard.

**Acceptance criteria:**
- Each country tile shows the count of registrations per status (active/pending/expiring/expired).
- Tile colour follows the design system urgency palette (green = all active, amber = some expiring, rose = expired).
- Clicking a country tile navigates to the registrations list pre-filtered to that country.
- The grid is driven by real-time database counts, not hardcoded data.

---

### FR-REG-09: CSV Bulk Import

**Priority:** Should-Have

**User story:** As an RA Specialist, I want to upload a CSV file of existing registrations so that I can populate the system quickly without manually entering every record.

**Acceptance criteria:**
- System provides a downloadable CSV template with required and optional column headers.
- Upload validates each row against the registration schema and returns a row-by-row error report for invalid entries.
- Valid rows are imported; invalid rows are skipped and reported, not aborting the entire import.
- Each imported record generates an audit log entry with `action=create`.

---

### FR-REG-10: Registration Export (PDF and Excel)

**Priority:** Should-Have

**User story:** As an RA Director, I want to export the current filtered registration list as a PDF or Excel file so that I can share it with the executive committee without additional formatting.

**Acceptance criteria:**
- Export honours the current active filters and sort order.
- PDF includes a header with organisation name, export date, and applied filters.
- Excel export includes all columns visible in the table view.
- Export is generated server-side and available for download within 10 seconds for up to 1,000 records.

---

## Module 2: Renewals Calendar and Workflow

Renewals are the highest-risk operational area — a missed expiry can cause market withdrawal. This module provides automated tracking and escalating alerts.

---

### FR-REN-01: Renewals Dashboard View

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to see all registrations approaching expiry in a sorted list with countdown timers so that I can prioritise my workload without reviewing the full portfolio.

**Acceptance criteria:**
- All registrations with `days_until_expiry` between 0 and 365 are shown, sorted ascending by urgency.
- Countdown displayed in days with colour coding: rose (≤30 days), amber (31–90 days), sky (91–180 days), muted (181–365 days).
- Each row shows: product name, country, health authority, registration number, expiry date, days until expiry, renewal status, and owner.
- Overdue registrations (expired, no renewal filed) shown at the top with a distinct rose badge.

---

### FR-REN-02: Renewal Record Management

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to create a renewal record linked to a registration and track it through the renewal workflow so that the renewal submission is managed in the system alongside the original registration.

**Acceptance criteria:**
- Renewal record links to a parent registration and captures: renewal number, status, target submission date, actual submitted date, approved date, and renewal expiry date.
- Renewal status follows the enum: `not_started → planning → dossier_preparation → submitted → under_review → approved / rejected`.
- A registration with `renewal_initiated = TRUE` is reflected visually in the renewals list.
- Updating the renewal to `approved` status prompts the user to update the parent registration's expiry date.

---

### FR-REN-03: Automated Deadline Alert Emails

**Priority:** Must-Have

**User story:** As an RA Director, I want the system to automatically email the registration owner and all regulatory leads when a registration is 180, 90, 60, 30, and 14 days from expiry so that no renewal is missed because of a lack of awareness.

**Acceptance criteria:**
- SES emails are dispatched at each threshold (180 / 90 / 60 / 30 / 14 days).
- Email recipients: the registration's `owner_user_id` plus all `regulatory_lead` users in the organisation.
- Email body includes: product name, country, registration number, expiry date, days remaining, and a direct link to the registration record.
- Email sending is non-blocking (queued asynchronously). Dispatch is recorded in the audit log.
- Threshold emails are not re-sent if already sent within the same threshold window.

---

### FR-REN-04: AI Renewal Package Generation

**Priority:** Should-Have

**User story:** As an RA Specialist, I want to trigger AI generation of a renewal package summary for a renewal record so that I have a structured starting point for the renewal dossier without building it from scratch.

**Acceptance criteria:**
- "Generate AI Renewal Package" action available on a renewal record in `planning` or `dossier_preparation` status.
- AI call constructs a structured renewal summary based on the registration record, historical submissions, and health authority requirements.
- `ai_package_generated = TRUE` and `ai_package_generated_at` timestamp are set on completion.
- Generated package is labelled with the AI model version and generation timestamp.
- User can review and edit the package before saving it as a document in the document vault.

---

### FR-REN-05: Renewal Workflow In-App Notifications

**Priority:** Should-Have

**User story:** As an RA Specialist, I want to receive in-app notifications when a renewal I own crosses a deadline threshold so that I am alerted even when I am not actively monitoring the renewals page.

**Acceptance criteria:**
- Bell icon in topbar shows an unread count badge.
- Notification panel lists recent alerts with timestamp, entity link, and severity.
- Notifications can be marked as read individually or all at once.
- Notifications persist for 90 days before being purged.

---

## Module 3: Submission Tracking

---

### FR-SUB-01: Submission Record Creation

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to create a submission record specifying product, health authority, submission type, internal reference, target file date, and PDUFA/action date so that the submission is tracked from the planning phase.

**Acceptance criteria:**
- Form validates all required fields (product, HA, submission type) and optional fields (target file date, PDUFA date).
- Status defaults to `planning` on creation.
- Newly created submission appears in the submissions list and submission pipeline view.
- Audit log entry written on creation.

---

### FR-SUB-02: Submission Status Lifecycle Enforcement

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want the system to enforce valid submission status transitions so that submissions cannot be skipped ahead or moved backward incorrectly.

**Acceptance criteria:**
- Valid transition chain: `planning → dossier_prep → internal_review → ready_to_file → filed → under_review → approved / rejected`.
- Jump transitions (e.g., `planning → filed`) are blocked via the API (HTTP 422).
- On-hold and withdrawn transitions permitted from any active state.
- Each status change is audit-logged.

---

### FR-SUB-03: Submission Task Management

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to create tasks within a submission, assign them to team members with due dates, and track their completion so that accountability is visible in the system rather than in email threads.

**Acceptance criteria:**
- Tasks can be created, assigned, and marked complete within the submission detail view.
- Task status: `not_started → in_progress → blocked → complete / skipped`.
- Task dependencies can be set (a task cannot start until its predecessor is complete).
- Assigned users receive an in-app notification when a task is assigned to them.
- Overdue tasks (due_date past, status not `complete`) are highlighted.

---

### FR-SUB-04: Gantt Timeline View

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to view all active submissions on a date-aware Gantt timeline so that I can identify schedule conflicts and report progress to the RA Director.

**Acceptance criteria:**
- Gantt shows all non-terminal submissions as horizontal bars scaled to actual target dates.
- Each bar is coloured by status (sky = in progress, amber = at risk, rose = overdue/delayed).
- Hovering a bar shows a tooltip with submission details (product, HA, target file date, PDUFA date).
- Timeline can be scrolled horizontally and filtered by health authority or product.
- Date positions are computed from real submission dates, not hardcoded.

---

### FR-SUB-05: HA Query Logging and Management

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to log a health authority query received against a submission and track its status through to response submission so that all HA communications are managed inside the system.

**Acceptance criteria:**
- Query captures: query reference, query text, query type, received date, due date, and status.
- Status: `open → in_progress → response_drafted → response_submitted → closed`.
- Overdue queries (due_date past, not yet closed) are automatically flagged with `overdue` status.
- Query appears in the open HA queries view with days remaining calculated.

---

### FR-SUB-06: AI-Drafted HA Query Response

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to request an AI-drafted response to a health authority query that cites relevant dossier documents so that I can reduce response drafting time from multiple days to hours.

**Acceptance criteria:**
- "Generate AI Draft" action available on any HA query in `open` or `in_progress` status.
- AI draft is generated using the query text and linked dossier documents as context.
- Draft response includes source citations (`document_id`, CTD path, excerpt).
- Draft is labelled with AI model version and generation timestamp.
- AI-generated responses require explicit approval by a `regulatory_lead` or higher before status can advance to `response_submitted` (BR-04).

---

### FR-SUB-07: Submission Document Attachment

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to attach documents from the document vault to a submission with a CTD section mapping so that the submission package is fully documented within the system.

**Acceptance criteria:**
- Documents are selected from the organisation's existing document vault (not re-uploaded).
- Each attachment records: CTD section, document role, and sequence order.
- Attached documents are listed in the submission detail view with their CTD path.
- Removing a document from a submission does not delete it from the vault.

---

### FR-SUB-08: Submission Pipeline View

**Priority:** Must-Have

**User story:** As an RA Director, I want to see a consolidated view of all active submissions showing their status, target date, PDUFA date, and open HA query count so that I have full pipeline visibility without opening each submission individually.

**Acceptance criteria:**
- View returns all non-terminal submissions with: submission number, product, HA, status, target file date, PDUFA date, completeness percentage, and open query count.
- Sortable by any column.
- Filterable by health authority, status, and product.
- Open query count links directly to the filtered query list for that submission.

---

## Module 4: Dossier Management

---

### FR-DOS-01: Dossier Creation

**Priority:** Must-Have

**User story:** As a Dossier Manager, I want to create a dossier for a product specifying the format and target health authority so that the CTD structure is established before document assembly begins.

**Acceptance criteria:**
- Dossier captures: name, product, dossier format (eCTD v3/v4, EU CTD, J-CTD, ANVISA e-dossier, etc.), target HA, and status.
- Status defaults to `in_preparation`.
- `completeness_pct` initialises to 0 and is computed dynamically.
- Dossier appears in the dossier list for the associated product.

---

### FR-DOS-02: CTD Module Hierarchy Management

**Priority:** Must-Have

**User story:** As a Dossier Manager, I want to build and manage the CTD module tree (Modules 1–5 with sub-sections) within a dossier so that the dossier structure reflects the regulatory submission format.

**Acceptance criteria:**
- Modules can be created with a module code (e.g., "3.2.S.4"), name, parent module, and status.
- Hierarchical parent-child relationships are rendered as a collapsible tree.
- Module status: `not_started / in_progress / complete / gap_identified / pending_review`.
- Reordering of modules within the same parent is supported via `sort_order`.

---

### FR-DOS-03: Document Linking to Dossier Modules

**Priority:** Must-Have

**User story:** As a Dossier Manager, I want to link documents from the vault to specific dossier modules with a CTD path so that each module has its supporting documents organised and traceable.

**Acceptance criteria:**
- Documents are selected from the organisation's vault; not re-uploaded.
- Each link records: CTD path, document status within this module, version number, and whether it is the primary document.
- A module can have multiple documents; the primary document is flagged.
- The dossier detail view shows the split-panel: module tree (left 40%) and documents for the selected module (right 60%).

---

### FR-DOS-04: AI Dossier Gap Detection

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to run an AI gap check against a dossier so that I receive a prioritised list of missing or incomplete modules before the submission lead reviews the package.

**Acceptance criteria:**
- "Run Gap Check" action available on any dossier in `in_preparation` or `under_review` status.
- AI analyses the module tree against expected CTD structure for the target HA format.
- Modules with identified gaps have `ai_gap_detected = TRUE` and a `gap_description` stored.
- Gap results are surfaced in the dossier tree view as inline warning indicators (per the prototype UX).
- `ai_last_scanned_at` timestamp is updated on each scan.
- Gap check results are labelled with the AI model version.

---

### FR-DOS-05: Dossier Completeness Tracking

**Priority:** Must-Have

**User story:** As a Dossier Manager, I want to see a live completeness percentage for a dossier that updates when I mark modules complete so that I have a reliable metric for submission readiness.

**Acceptance criteria:**
- `completeness_pct` recalculates every time a module's status changes (service layer hook).
- Completeness percentage is visible on the dossier list and dossier detail view.
- Completeness statistics view shows: total modules, complete modules, modules with AI gaps detected.
- A submission linked to the dossier cannot advance to `ready_to_file` status if `completeness_pct` < 80 (configurable threshold).

---

### FR-DOS-06: Dossier Completeness Summary View

**Priority:** Should-Have

**User story:** As an RA Director, I want to see a summary of dossier completeness across all active products so that I can identify which submission packages need urgent attention.

**Acceptance criteria:**
- Table showing each active dossier with: product, dossier format, target HA, completeness %, gaps detected, and last AI scan date.
- Sortable by completeness % (ascending to surface worst-first).
- Clicking a row navigates to the dossier detail view.

---

## Module 5: Document Vault

---

### FR-DOC-01: Document Upload

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to upload a document (PDF, Word, Excel) to the document vault so that it is securely stored and available for linking to registrations, dossiers, and submissions.

**Acceptance criteria:**
- Upload uses an S3 pre-signed PUT URL (file goes directly to S3; not proxied through the backend).
- Supported MIME types: PDF, DOCX, XLSX, XLS at minimum.
- SHA-256 checksum is computed and stored; duplicate file detection surfaces a warning.
- Upload progress is shown to the user; failure shows a clear error message with retry option.
- Document appears in the vault list immediately after successful upload.

---

### FR-DOC-02: Document Versioning

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to upload a new version of an existing document so that the full version history is preserved and I can retrieve any prior version.

**Acceptance criteria:**
- "Upload New Version" action available on any existing document.
- New version creates a new `documents` row with `previous_version_id` pointing to the prior version.
- Version history tab in the document detail view shows all versions with uploader, date, and status.
- All versions remain accessible (no version is deleted when superseded).

---

### FR-DOC-03: Document Search

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to search the document vault by file name so that I can quickly find a document without scrolling through the full vault.

**Acceptance criteria:**
- Full-text fuzzy search across file names using the `pg_trgm` index.
- Results ranked by match relevance.
- Search results are paginated.
- Archived documents are excluded from default search; an "Include archived" toggle adds them.

---

### FR-DOC-04: Secure Document Download

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to download a document by clicking a link so that I can open it locally without needing to navigate to S3 or a file server.

**Acceptance criteria:**
- Download link generates a pre-signed S3 GET URL with a 15-minute expiry.
- Download link URL is never exposed publicly; it is generated server-side on demand.
- Attempting to reuse an expired link after 15 minutes returns a clear "link expired" error with a refresh option.

---

### FR-DOC-05: Document Soft-Archival

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to archive a superseded document so that it is removed from active lists without being permanently deleted, preserving the audit trail.

**Acceptance criteria:**
- "Archive" action available to users with `dossier_manager` role or higher.
- Archived documents have `is_archived = TRUE` and are excluded from default vault lists.
- Archived documents are retrievable via an explicit filter and remain linked to any dossier modules or submissions they were attached to.
- Archival action is audit-logged.

---

## Module 6: Publishing

---

### FR-PUB-01: Publishing Job Creation

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to create a publishing job for a completed dossier and specify the output format so that the package is queued for generation in the correct eCTD or CTD structure.

**Acceptance criteria:**
- Publishing job links to a submission and optionally a dossier.
- Output format selected from: eCTD v3, eCTD v4, EU CTD, J-CTD, ANVISA e-dossier, CDSCO format, NMPA CTD, non-eCTD, paper.
- Job status defaults to `queued` on creation.
- Job appears in the publishing queue list.

---

### FR-PUB-02: Publishing Job Status Tracking

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to monitor a publishing job's progress through its lifecycle states so that I know when the package is ready for agency upload.

**Acceptance criteria:**
- Status lifecycle: `queued → in_progress → quality_check → submitted / failed`.
- Status transitions are recorded with timestamps (`started_at`, `completed_at`).
- Failed jobs store the error log for review.
- The publishing queue is filterable by status and format.

---

### FR-PUB-03: Publishing Queue Dashboard

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to see all publishing jobs in a queue view sorted by status and creation date so that I can monitor the overall publishing workload.

**Acceptance criteria:**
- Table shows: job reference, submission, dossier, format, status, submitted by, started at, and completed at.
- Filterable by status (queued / in_progress / quality_check / submitted / failed) and format.
- Failed jobs highlighted in rose; completed jobs in green.
- Clicking a row opens the job detail with error log if applicable.

---

## Module 7: AI Intelligence

---

### FR-AI-01: AI Insight Generation and Display

**Priority:** Must-Have

**User story:** As an RA Director, I want to receive AI-generated insights about portfolio risks (e.g., multiple registrations expiring in the same quarter) so that I can prioritise resources proactively before a problem becomes urgent.

**Acceptance criteria:**
- Insights are generated and stored with: type, title, text, severity, referenced entity, confidence score, expiry.
- Insight types: `gap_detection`, `renewal_risk`, `query_assist`, `market_gap`, `reg_watch`.
- Severity levels: `critical`, `high`, `medium`, `low`, `informational`.
- `critical` and `high` severity insights trigger SES email notification to `regulatory_lead` users.
- Each insight is labelled with AI model version and generation timestamp (BR-17).

---

### FR-AI-02: Insight Lifecycle Management

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to acknowledge, action, or dismiss an AI insight so that the system knows I have reviewed it and I can focus on unreviewed items.

**Acceptance criteria:**
- Status transitions: `new → acknowledged → actioned / dismissed`.
- `actioned_by` user ID and `actioned_at` timestamp are recorded on status change.
- Insights past their `expires_at` are automatically set to `expired` status.
- The AI insights page defaults to showing only `new` and `acknowledged` insights; a toggle surfaces dismissed and expired ones.

---

### FR-AI-03: AI Copilot Chat Interface

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to open the AI Copilot side pane and ask natural language questions about my regulatory portfolio so that I can get fast answers without navigating to multiple screens.

**Acceptance criteria:**
- Copilot pane slides in from the right; triggered by a fixed floating button (bottom-right).
- Quick-chip prompts available for common queries: "submissions due this month", "dossier gaps", "renewals at risk", "draft HA response for…".
- Copilot response streams to the UI (streamed tokens visible as they arrive).
- Org-level rate limit: 60 requests/hour. When exhausted, user sees a clear "Rate limit reached" message with time-to-reset.
- AI calls are proxied through the backend; no direct frontend-to-Anthropic calls (TR-F-075).
- Copilot respects the org-level document-sharing consent toggle (BR-19).

---

### FR-AI-04: AI Dossier Gap Analysis (Inline)

**Priority:** Must-Have

**User story:** As a Dossier Manager, I want the AI completeness checker panel to appear alongside the dossier module tree so that I can see gap analysis results in context without switching pages.

**Acceptance criteria:**
- AI completeness panel is rendered on the right side of the dossier module tree view.
- Panel shows: total modules, complete count, gap count, and a list of gap descriptions by module code.
- Each gap item links to the corresponding module in the tree (tree auto-scrolls to it on click).
- "Re-run Gap Check" button triggers a fresh AI scan and refreshes the panel.

---

### FR-AI-05: Regulatory Intelligence Feed

**Priority:** Must-Have

**User story:** As an RA Director, I want to view a feed of health authority guideline updates so that my team can identify which updates affect our portfolio and plan for compliance.

**Acceptance criteria:**
- Feed shows regulatory intelligence items with: title, HA, impact level, summary, published date, and source URL.
- Filterable by health authority, impact level, and published date range.
- AI-summarised items show the AI summary below the original title.
- Items where `affected_product_ids` intersects with the organisation's products are highlighted with a "Affects your portfolio" badge.
- "Assess Impact" action on each item triggers an AI analysis linking the guideline update to specific registrations or submissions.

---

### FR-AI-06: AI Label Harmonisation

**Priority:** Should-Have

**User story:** As a Labeling Specialist, I want to run an AI harmonisation check across label versions for the same product across markets so that inconsistencies between USPI, SmPC, and CCDS are identified before a new label version is finalised.

**Acceptance criteria:**
- "Run Harmonisation Check" action available on a product's labeling page when multiple label types exist.
- AI compares label versions across markets and generates a structured discrepancy report.
- Report highlights sections that differ across markets with suggested harmonised text.
- `ai_harmonized = TRUE` and `ai_harmonized_at` timestamp are set on the label version record after harmonisation.
- Report is stored as a document in the vault linked to the label version.

---

### FR-AI-07: AI Renewal Risk Scoring

**Priority:** Should-Have

**User story:** As an RA Director, I want the renewals dashboard to show an AI-generated risk score for each renewal so that I can see which renewals have the highest probability of missing the deadline, beyond just the raw countdown days.

**Acceptance criteria:**
- Risk score is generated per renewal record using factors: days until expiry, renewal status, historical renewal timeline for this HA, and open renewal tasks.
- Risk score is displayed as a severity badge (critical / high / medium / low) on the renewals list.
- Score is regenerated when any contributing factor changes.
- Score labelled with AI model version and generation timestamp.

---

## Module 8: Labeling Management

---

### FR-LAB-01: Label Record Management

**Priority:** Must-Have

**User story:** As a Labeling Specialist, I want to create and manage label records per product per market per label type so that all approved labels are tracked with their current status and version.

**Acceptance criteria:**
- Label record captures: product, label type (USPI, SmPC, CCDS, JPI, PIL, etc.), market, language, and status.
- Unique constraint: one label per product + label type + market combination.
- Status: `draft → under_variation → translation_review → approved → superseded`.
- All labels for a product listed in the labeling module table view.

---

### FR-LAB-02: Label Version History

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to view the full version history of a label so that I can verify which version was approved, when, and by whom — as required for audit preparation.

**Acceptance criteria:**
- Each label version captures: version number, version label, change summary, document link, approval status, approver, and approved date.
- Version history is listed chronologically (most recent first) in the label detail view.
- Only `regulatory_lead` or higher roles can mark a version as `approved` (BR-15).
- Approval action requires selecting the approving user and records `approved_at` timestamp.

---

### FR-LAB-03: Label Translation Tracking

**Priority:** Must-Have

**User story:** As a Labeling Specialist, I want to track translation status for each label across languages so that I know which translations are pending, in progress, or AI-draft ready before a regional submission.

**Acceptance criteria:**
- Translation record captures: language code, status, AI checked flag, AI flag notes, translator name, and reviewer.
- Status: `pending → in_progress → ai_draft_ready → under_review → approved / flagged`.
- Translations listed per label in the label detail view.
- AI-checked translations showing `ai_flag_notes` are visually distinguished (amber flag) for human review.

---

### FR-LAB-04: Label Harmonisation Report

**Priority:** Should-Have

**User story:** As a Labeling Specialist, I want to generate a cross-market harmonisation report for a product's labels so that I can identify and resolve global inconsistencies across USPI, SmPC, and CCDS before a label update is submitted.

**Acceptance criteria:**
- Harmonisation report generated by AI comparing label text across markets for the same product.
- Report downloadable as a PDF or viewable inline.
- Discrepancies are listed with the differing text from each market and a suggested harmonised version.
- Report linked to the label record and stored in the document vault.

---

## Module 9: Analytics and Reporting

---

### FR-ANA-01: Portfolio KPI Dashboard

**Priority:** Must-Have

**User story:** As an RA Director, I want to see key portfolio metrics on the dashboard so that I can assess the health of my regulatory portfolio in a single view.

**Acceptance criteria:**
- KPI strip shows: total active registrations, registrations expiring within 90 days, open submissions, open HA queries, and overdue renewals.
- Each KPI card is coloured by urgency (rose = needs attention, green = healthy).
- KPI values update in real time (no manual refresh required).
- Clicking a KPI card navigates to the relevant module with appropriate filters pre-applied.

---

### FR-ANA-02: Agency Submission Analytics

**Priority:** Must-Have

**User story:** As an RA Director, I want to see submission counts grouped by health authority and status so that I can understand our submission volume and outcomes per agency.

**Acceptance criteria:**
- Bar chart showing submission counts per health authority, segmented by status (approved, under review, filed, planning, etc.).
- Date range filter applies to the chart.
- Hovering a bar segment shows the exact count and list of submissions.
- Data respects org-level scoping — no cross-tenant aggregation.

---

### FR-ANA-03: Registration Growth Analytics

**Priority:** Must-Have

**User story:** As an RA Director, I want to see registration counts over time so that I can present portfolio growth trends to the board.

**Acceptance criteria:**
- Line or bar chart showing active registration count by month over a configurable time range.
- Filterable by product type, country, or health authority.
- Data exported as CSV on request.

---

### FR-ANA-04: Approval Rate and Timeline Analytics

**Priority:** Should-Have

**User story:** As a Regulatory Submissions Manager, I want to see approval rates and average submission-to-approval timelines by health authority so that I can set realistic timelines for upcoming filings.

**Acceptance criteria:**
- Table and/or chart showing: approval rate (%), average calendar days from filing to approval, per health authority.
- Comparison view: actual timeline vs. the HA's `typical_review_days` benchmark.
- Filterable by submission type and date range.

---

## Module 10: Archive and Audit Trail

---

### FR-ARC-01: Submission Archive View

**Priority:** Must-Have

**User story:** As a Regulatory Submissions Manager, I want to view a searchable archive of all completed submissions (approved, rejected, withdrawn) including attached documents and HA query responses so that historical records are always accessible.

**Acceptance criteria:**
- Archive shows all submissions in terminal statuses with their documents, tasks, and HA queries.
- Searchable by submission number, product name, and health authority.
- Documents in archived submissions are downloadable via pre-signed S3 URLs.
- Archive is read-only; no editing of archived submissions is permitted.

---

### FR-ARC-02: Audit Log Viewer

**Priority:** Must-Have

**User story:** As a Regulatory Lead, I want to view the audit log for any entity (registration, submission, document) filtered by user and date range so that I can produce evidence of all changes for an FDA inspection.

**Acceptance criteria:**
- Audit log queryable by: entity type, entity ID, user ID, action, and date range.
- Each entry shows: timestamp (UTC and user timezone), user name, action, entity type, entity ID, and a before/after diff for updates.
- Audit log is read-only — no edit or delete controls exist.
- Audit log export as CSV is available for a specified date range and entity filter.

---

### FR-ARC-03: Document Storage Volume Tracking

**Priority:** Should-Have

**User story:** As a System Administrator, I want to see total document storage volume consumed by my organisation so that I can monitor S3 usage and plan for storage costs.

**Acceptance criteria:**
- Storage volume (sum of `file_size_bytes` across non-archived documents) displayed on the archive or admin page.
- Broken down by entity type (submission documents, dossier documents, label documents).
- Updated daily (acceptable lag of up to 24 hours).

---

## Module 11: User and Tenant Management

---

### FR-USR-01: User Invitation and Provisioning

**Priority:** Must-Have

**User story:** As a Super Admin, I want to invite a new user by email, assign their role, and have them complete self-registration via Cognito so that team access is managed without requiring manual account setup.

**Acceptance criteria:**
- Super Admin enters email and role; system sends invitation email via SES.
- Invitation link directs user to Cognito Hosted UI to set password.
- On first login, backend creates or retrieves the `users` row linked by Cognito `sub`.
- User appears in the organisation's user list immediately after account creation.

---

### FR-USR-02: Role-Based Access Control

**Priority:** Must-Have

**User story:** As a Super Admin, I want to assign and change user roles so that each team member has the appropriate level of access for their responsibilities.

**Acceptance criteria:**
- Roles available: `super_admin`, `regulatory_lead`, `regulatory_affairs_manager`, `regulatory_affairs_specialist`, `dossier_manager`, `submission_coordinator`, `labeling_specialist`, `read_only`, `external_reviewer`.
- Only `super_admin` may create users, change roles, or deactivate accounts (BR-16).
- Role changes take effect immediately (no re-login required for the affected user).
- Role change is audit-logged.

---

### FR-USR-03: External Reviewer Access Scoping

**Priority:** Must-Have

**User story:** As a Regulatory Lead, I want to grant an external CRO partner access to specific submissions or dossiers only so that they can contribute documents without seeing the rest of the organisation's portfolio.

**Acceptance criteria:**
- `external_reviewer` role users can only see records explicitly shared with them.
- Sharing is at the submission or dossier level, not product-wide.
- External reviewer can upload documents to shared dossiers but cannot create registrations, submissions, or labels.
- Sharing and its removal are audit-logged.

---

### FR-USR-04: User Deactivation

**Priority:** Must-Have

**User story:** As a Super Admin, I want to deactivate a user account when a team member leaves so that their access is immediately revoked without deleting their historical record contributions.

**Acceptance criteria:**
- Deactivation sets `is_active = FALSE`; active sessions are invalidated server-side.
- Deactivated users do not appear in assignee dropdowns.
- Records created or modified by a deactivated user retain their attribution (full name and user ID still visible in history).
- Deactivation is audit-logged.

---

### FR-USR-05: Organisation Settings

**Priority:** Should-Have

**User story:** As a Super Admin, I want to configure organisation-level settings (timezone, AI data-sharing consent, notification preferences) so that the platform behaviour is tailored to our team's practices.

**Acceptance criteria:**
- Settings page configurable by `super_admin` only.
- Settings include: organisation timezone, AI document-sharing consent toggle, renewal alert thresholds, preferred dossier format default.
- AI document-sharing toggle `OFF` prevents the Copilot from including document content in AI prompts (BR-19).
- Changes to settings are audit-logged.

---

## Module 12: Notifications and Alerts

---

### FR-NOT-01: In-App Notification Centre

**Priority:** Must-Have

**User story:** As an RA Specialist, I want to see all system alerts and notifications in an in-app notification panel so that I do not miss important events when I am actively working in the application.

**Acceptance criteria:**
- Bell icon in topbar shows unread notification count badge.
- Notification panel accessible by clicking the bell icon.
- Notifications listed in reverse chronological order with: event type, entity name, timestamp, and a link to the relevant record.
- Notifications can be marked as read individually or all at once.
- Unread notifications persist until explicitly read.

---

### FR-NOT-02: Email Notifications for Critical Events

**Priority:** Must-Have

**User story:** As a Regulatory Lead, I want to receive email notifications for critical events (renewal deadlines, critical AI insights, HA queries received) so that I am alerted even when I am not logged into the platform.

**Acceptance criteria:**
- SES email sent for: renewal deadline thresholds (180/90/60/30/14 days), AI insight of severity `critical` or `high`, new HA query received, submission milestone reached.
- All emails include organisation name, event summary, and a direct link to the record.
- Email dispatch is asynchronous (does not block API response).
- Bounce handling configured; hard-bounced addresses are suppressed from future sends.

---

### FR-NOT-03: Notification Preference Management

**Priority:** Should-Have

**User story:** As an RA Specialist, I want to configure which email notifications I receive so that I am not overwhelmed with notifications for events outside my area of responsibility.

**Acceptance criteria:**
- User-level notification preference panel accessible from the user profile page.
- Toggleable per event category: renewal alerts, AI insights, HA queries, submission milestones, task assignments.
- In-app notifications always received regardless of email preference.
- Preferences stored in `users.preferences` JSONB field.

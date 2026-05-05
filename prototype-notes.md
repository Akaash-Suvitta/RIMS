# RegAxis RIM — Prototype Notes

Source: `Solution-drafts/RIMS+AI/RIM_Prototype.html`
Analyzed: 2026-05-05

---

## What We Validated

**Color scheme and visual language worked well.**
The dark navy palette is coherent and professional. Key hex values confirmed in the prototype:
- `--navy: #0B1929` — page background
- `--navy-mid: #112238` — sidebar and modal backgrounds
- `--navy-light: #1A3350` — active tab/hover fill
- `--teal: #00C2A8` — primary action color, active nav state
- `--sky: #38BDF8` — secondary highlight, info badges
- `--amber: #F59E0B` — warnings, pending states
- `--rose: #F43F5E` — alerts, overdue items, errors
- `--green: #10B981` — approved/active/success states
- `--purple: #A78BFA` — AI-related elements, variation type badges
- `--ai-gradient: linear-gradient(135deg, #7C3AED, #00C2A8)` — used for AI badges, float button, logo mark
- Text: `--text: #E8F0F8` / `--text-muted: #7A9BBD` / `--text-dim: #4A6A8A`
- Borders: sky-tinted with low opacity (`rgba(56,189,248,0.12)` and `0.2`)

**Navigation structure is clear and well-grouped.**
Left sidebar (228px wide) with grouped nav sections:
- Overview: Dashboard
- Registrations: Global Registrations, Renewals
- Submissions: Submissions, Dossier Management, Publishing
- Intelligence: AI Insights, Analytics, Reg Intelligence
- Compliance: Labeling, Archive

Each nav item shows a badge counter for pending items (rose = urgent, amber = warning, teal = informational). Active item gets a teal left-border accent stripe.

**All 11 pages render and navigate correctly** (single-page JS show/hide):
1. Dashboard — KPI strip, AI insight panel, global registration tile map, deadline timeline, active submissions table, HA queries table
2. Global Registrations — search bar, status tabs (All/Active/Pending/Expiring/Expired), AI panel, full portfolio table
3. Renewals — AI risk panel, renewal schedule table with countdown days
4. Submissions — AI planning panel, submission tracker table, Gantt chart
5. Dossier Management — CTD tree explorer, AI completeness checker, recent documents list
6. Publishing — publishing queue table (eCTD/EU CTD/ANVISA formats)
7. AI Insights — product tile grid (Copilot, Response Drafter, Gap Analyzer, Reg Watch), regulatory watch feed, AI activity stats
8. Analytics — KPI strip, agency submission bar chart, registration growth bar chart
9. Regulatory Intelligence — live feed of HA guideline updates with inline AI action links
10. Labeling — AI harmonization panel, label version table (USPI, SmPC, JPI, CCDS)
11. Archive — KPI strip with doc counts, submission archive table

**AI Copilot side pane pattern validated.**
Slides in from the right at 380px width. Has pre-seeded quick-chip prompts (submissions due, draft HA response, dossier gaps, renewals at risk). Keyword-matched canned responses simulate the real interaction convincingly enough for stakeholder demos. The float button (fixed bottom-right, pulsing dot) is a good entry point.

**Modals are the right pattern for create/detail flows.**
Four modals implemented: New Registration, New Submission, Registration Detail, AI-Drafted HA Response. All use a centered overlay with backdrop blur. The AI-drafted response modal is the most detailed — shows the original FDA query, the AI-drafted reply with source citations, and Edit/Approve actions.

**Status badge system is comprehensive.**
Seven badge variants cover all states needed: green (active/approved), amber (pending/warning), rose (expiring/overdue), sky (in-progress/info), teal (AI-ready/new), purple (variation type/AI-drafting), muted (planning/none).

**Gantt chart was a useful prototype element.**
The CSS-only Gantt on the Submissions page communicates timeline positioning simply. Enough to show stakeholders the concept without needing a full chart library.

**CTD dossier tree with inline gap indicators worked.**
The monospace tree showing CTD modules (1–5) with a red "⚠ Missing" node for 3.2.S.4 directly alongside the AI completeness panel on the right was compelling. It shows the AI-to-dossier connection clearly.

**Country tile map on Dashboard is a good spatial summary.**
12-country grid with color-coded status (active/pending/expired) gives a quick portfolio scan. Better than a table for the overview use case.

---

## What Did Not Work

**All data is hardcoded — nothing is dynamic.**
Every number, product name, date, and country count is static HTML. The prototype cannot represent a real user's portfolio. There is no data model behind it.

**AI responses are keyword-matched strings, not real AI.**
The Copilot responds to ~4 hardcoded phrases and returns a default for everything else. It cannot answer new questions, search real data, or generate actual drafts. This gap will be significant when demoing to technically sophisticated users.

**No authentication or role model.**
The user "Sarah Reyes / Regulatory Affairs Lead" is hardcoded in the sidebar footer. There is no login, no multi-user concept, no permissions. The real app needs Cognito-based auth with at minimum Viewer, Contributor, and Regulatory Lead roles.

**No real file handling.**
Dossier documents (e.g., "5.3.5.1 Phase III CSR_v4.pdf") are displayed as text rows with no upload, preview, or version management. The "Auto-fill from Archive" button closes the modal and does nothing.

**Tabs do not filter.**
The status tabs on the Registrations page (All/Active/Pending/Expiring/Expired) switch visual state but the table rows do not change. Filtering, sorting, and pagination are entirely absent.

**No form validation or submission.**
All forms (New Registration, New Submission) accept any input and dismiss on "Create" with no persistence, validation, or feedback.

**The Gantt is purely decorative.**
Bar positions are hardcoded percentages. It does not reflect actual dates, cannot scroll, and has no interaction. A real timeline view needs a proper date-aware component.

**Analytics charts are static markup.**
Bar heights are hardcoded inline styles. There are no real chart libraries, no axis labels with actual values, and no drill-down capability.

**No notification system.**
The bell icon in the topbar shows a static red dot. There is no notification panel, no alert detail, no read/dismiss flow.

**Mobile/responsive layout not attempted.**
The layout uses `overflow: hidden` on the body and fixed sidebar widths. It breaks entirely on narrow viewports.

**No empty states.**
Every screen shows populated data. The real app needs empty states for new customers who have no registrations or submissions yet.

---

## Key UX Decisions Made

1. **Sidebar-primary navigation** over a top nav. The grouped sections (Registrations / Submissions / Intelligence / Compliance) match the mental model of a regulatory affairs professional and scale to 10+ modules without crowding.

2. **AI is surface-level ambient, not intrusive.** Every screen has an AI panel at the top, but it is a card — not a modal or forced flow. Users can ignore it. The floating Copilot button gives on-demand access. This approach avoids the "AI takes over" problem.

3. **Color-coded urgency is consistent across the entire app.** Rose = act now, amber = plan ahead, green = healthy, sky = in progress. This system is used in badges, timeline dots, KPI values, table cell colors, and country tiles — it should be preserved exactly in the real build.

4. **DM Serif Display for page headings, DM Sans for body, JetBrains Mono for reference numbers and dates.** This typographic hierarchy is deliberate: the serif adds authority to a regulatory product; the monospace makes identifiers (NDA-022441, Q-2025-441) scannable and distinct from prose.

5. **Inline AI actions on table rows** (e.g., the "AI Draft: Ready / Drafting / Generate" column in the HA Queries table). This is more discoverable than a separate AI page because the action is in context of the item that needs it.

6. **Progressive disclosure via modals** rather than routing to a new page for create/detail flows. Keeps the user on the same page context, which matters when they are mid-task (e.g., reviewing the registrations list and opening a detail).

7. **Breadcrumb in topbar** (e.g., "RegAxis RIM → Dashboard") stays visible on all pages. Useful when the user arrives deep-linked or loses track of navigation.

8. **KPI strip pattern** (5-across grid of metric cards) is used on Dashboard, Analytics, and Archive. Establishes a consistent "snapshot" pattern for any data-heavy page.

9. **The AI Copilot side pane overlaps content** rather than pushing it. At 380px it covers the right portion of the main content area. In the real app this should either push content or be a separate panel. The overlap worked visually in the prototype but would frustrate real use.

10. **Dossier tree is split-panel**: tree on the left (40%), checker/documents on the right (60%). This prevents the user from needing to context-switch between structure and status.

---

## Open Questions Before Building for Real

**Data model and domain:**
- What is the exact entity hierarchy? Is it: Company → Product → Registration → Submission → Dossier? Or does a submission span multiple registrations?
- Does one "registration" map 1:1 to a product+country+agency combination, or can a single registration cover multiple markets (e.g., EU mutual recognition)?
- How are "variations" modeled — as child submissions under a registration, or as standalone records?
- What is a "publishing job" — is it the act of generating the eCTD package, or does it track the actual transmission to the agency portal?

**AI functionality scope:**
- Which AI features are v1 vs. later? Gap detection and HA response drafting feel core; Reg Watch and Timeline Optimizer feel like v2.
- Does the AI Copilot need to reason over the customer's own dossier documents (RAG over uploaded PDFs), or only over structured data in the database?
- What model and infrastructure backs the AI? Is this an Anthropic API integration, or a third-party regulatory AI vendor?
- Who reviews and approves AI-drafted HA responses before they leave the system? Is there an approval workflow?

**Multi-tenancy and permissions:**
- Is this a multi-tenant SaaS (one database, many companies) or single-tenant per customer?
- What are the roles? The prototype shows one user. In practice there will be Regulatory Managers, Regulatory Associates, Medical Writers, External CRO users, and Read-Only Executives.
- Are there document-level permissions (e.g., a CRO partner can only see dossiers for the product they are working on)?

**Integrations:**
- Does the system need to integrate with existing eCTD authoring tools (Lorenz, Extedo, Veeva Vault)?
- Is there an agency portal submission integration (FDA ESG, EMA CESP), or does the user export and submit manually?
- Does the label management module need to connect to a label repository or artwork management system?

**Regulatory intelligence feed:**
- Is the Reg Watch / Intelligence feed sourced from a vendor API (Citeline, Informa, FDA RSS), or does RegAxis scrape and index this data themselves?
- How do HA guideline updates get mapped to the customer's portfolio automatically?

**File and dossier storage:**
- What file formats must be supported? (PDF, Word, Excel minimum; potentially SAS datasets for clinical modules)
- Is versioning of dossier documents done inside RegAxis RIM, or does it assume an external DMS?
- How large can dossiers get? (A full NDA can be 100,000+ pages across thousands of files)
- The archive shows 2.4 TB storage — is this hosted on S3? What is the access pattern for old submissions?

**Renewals automation:**
- The prototype shows "AI Renewal Package" — what does this actually generate? A pre-filled form? A document bundle? A checklist?
- What are the renewal timelines per market? ANVISA, PMDA, FDA, EMA, CDSCO, NMPA all have different rules.

**The country tile map:**
- Is this a real-time view of the customer's portfolio, or a fixed set of 12 markets? What happens when a customer operates in 60+ countries?
- Is clicking a country tile supposed to filter the registrations table, or navigate to a country-specific view?

**Onboarding:**
- How does a new customer populate the system? Manual entry, bulk import, or migration from Veeva/Documentum?
- The prototype has no empty state — what does the dashboard look like for a customer with 0 registrations?

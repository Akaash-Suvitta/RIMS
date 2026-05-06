# RegAxis RIM — Frontend Design Document

Version: 1.0
Date: 2026-05-05
Status: Approved

---

## 1. Design Philosophy

RegAxis RIM serves regulatory affairs professionals who work with dense, high-stakes data. The design principles reflect that context:

- **Information density over whitespace.** Tables are the primary data container; cards are used only for KPI summaries and AI insight panels. Padding is tight; rows show as much data as fits without scrolling.
- **Urgency through color.** A consistent four-color urgency system runs across every module: rose = act now, amber = plan ahead, sky = in progress, green = healthy. Muted tones (teal, purple) signal AI-generated content. Color meaning never varies between modules.
- **Progressive disclosure via modals.** Create and detail flows open as centered overlays, not route navigations. The user stays in context — reviewing a registrations list and opening a detail does not lose the list state.
- **AI is ambient, not intrusive.** Each module page has a compact AI panel card at the top. The floating Copilot button (fixed bottom-right) provides on-demand access. Neither pattern forces an AI interaction.
- **Typography carries authority.** DM Serif Display for page headings, DM Sans for body text, JetBrains Mono for identifiers (NDA-022441, Q-2025-441) and dates. The serif heading signals a serious regulatory product; the monospace makes reference numbers scannable in dense tables.
- **Accessibility first.** WCAG 2.1 AA compliance throughout. All interactive elements keyboard-navigable with visible focus rings. ARIA labels on icon-only buttons. Screen-reader labels on all data tables and form inputs. Color is never the sole indicator of meaning — badges always carry a text label.

---

## 2. Tailwind Design Tokens

`apps/web/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:       'var(--navy)',       // #0B1929 — page background
        'navy-mid': 'var(--navy-mid)',   // #112238 — sidebar, modal backgrounds
        'navy-light':'var(--navy-light)',// #1A3350 — active tab/hover fill
        teal:       'var(--teal)',       // #00C2A8 — primary action, active nav
        sky:        'var(--sky)',        // #38BDF8 — secondary highlight, info badges
        amber:      'var(--amber)',      // #F59E0B — warnings, pending states
        rose:       'var(--rose)',       // #F43F5E — alerts, overdue, errors
        green:      'var(--green)',      // #10B981 — approved, active, success
        purple:     'var(--purple)',     // #A78BFA — AI elements, variation badges
        text: {
          DEFAULT: 'var(--text)',        // #E8F0F8
          muted:   'var(--text-muted)',  // #7A9BBD
          dim:     'var(--text-dim)',    // #4A6A8A
        },
      },
      fontFamily: {
        serif:  ['DM Serif Display', 'serif'],
        sans:   ['DM Sans', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(56, 189, 248, 0.12)',
        DEFAULT: 'rgba(56, 189, 248, 0.20)',
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #7C3AED, #00C2A8)',
      },
      screens: {
        // Desktop-first; responsive breakpoints for future mobile pass
        xl:  '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
}

export default config
```

CSS custom properties live in `apps/web/src/app/globals.css`:

```css
:root {
  --navy:       #0B1929;
  --navy-mid:   #112238;
  --navy-light: #1A3350;
  --teal:       #00C2A8;
  --sky:        #38BDF8;
  --amber:      #F59E0B;
  --rose:       #F43F5E;
  --green:      #10B981;
  --purple:     #A78BFA;
  --text:       #E8F0F8;
  --text-muted: #7A9BBD;
  --text-dim:   #4A6A8A;
}
```

---

## 3. App Layout

### Authenticated shell

```
┌─────────────────────────────────────────────────────────────┐
│  TopBar (h-14): tenant name | breadcrumb | search | bell | avatar  │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │  Main content area (flex-1, overflow-y-auto)     │
│ (228px   │  — page heading (DM Serif Display)               │
│ collap-  │  — optional AI panel card                        │
│ sible)   │  — primary content (table / form / split panel)  │
│          │                                                   │
└──────────┴──────────────────────────────────────────────────┘
                                      [Copilot float button ↗]
```

**Sidebar** (`components/layout/Sidebar.tsx`):
- Width: 228px expanded, 56px icon-only collapsed (toggle stored in `localStorage`)
- Nav groups: Overview | Registrations | Submissions | Intelligence | Compliance | Settings
- Nav items: icon + label + optional badge counter (rose = urgent, amber = warning, teal = info)
- Active item: teal left-border accent stripe + `bg-navy-light`
- Bottom: user avatar, name, role, collapse toggle

**TopBar** (`components/layout/TopBar.tsx`):
- Left: org logo / tenant name, breadcrumb trail
- Center: global search input (Cmd+K shortcut)
- Right: notifications bell (unread badge), user avatar dropdown (profile, logout)

**Unauthenticated shell** (`components/layout/UnauthShell.tsx`):
- Centered card on full navy background
- Login form or "Continue with SSO" button that redirects to Cognito Hosted UI
- No sidebar or topbar

---

## 4. Page Inventory

### Global

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/login` | UnauthShell | `LoginForm` | Cognito redirect or custom email/password form |
| `/dashboard` | AuthShell | `DashboardPage` | KPI strip, AI insight panel, country tile map, deadline timeline, active submissions table, HA queries table |

### Registrations

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/registrations` | AuthShell | `RegistrationListPage` | Status tabs, filter chips, sortable paginated table; `RegistrationDetailModal` on row click |
| `/registrations/new` | AuthShell modal | `NewRegistrationModal` | Multi-step wizard (product → market → lifecycle → review) |
| `/registrations/[id]` | AuthShell | `RegistrationDetailPage` | Timeline, variations, conditions, last 5 audit entries; deep-link target |

### Renewals

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/renewals` | AuthShell | `RenewalsPage` | AI risk panel, countdown table sorted by urgency; color-coded days column |
| `/renewals/[id]` | AuthShell | `RenewalDetailPage` | Renewal workflow status, tasks, AI package generation action |

### Submissions

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/submissions` | AuthShell | `SubmissionsPage` | Pipeline table + Gantt tab; HA query sub-list |
| `/submissions/new` | AuthShell modal | `NewSubmissionModal` | Create form: product, HA, type, dates |
| `/submissions/[id]` | AuthShell | `SubmissionDetailPage` | Tasks, HA queries with AI draft action, document attachments, CTD mapping |

### Dossier

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/dossiers` | AuthShell | `DossierListPage` | Completeness % column, sortable; AI gaps count |
| `/dossiers/[id]` | AuthShell | `DossierDetailPage` | Split panel: CTD module tree (40%) + documents / AI gap panel (60%) |

### Publishing

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/publishing` | AuthShell | `PublishingPage` | Queue table; format selector; status filter chips; failed jobs in rose |

### AI Intelligence

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/ai` | AuthShell | `AiIntelligencePage` | Insight cards (gap, renewal risk, query assist, reg watch); regulatory feed; AI Copilot pane (global overlay) |

### Labeling

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/labeling` | AuthShell | `LabelingListPage` | Label version table; AI harmonisation panel |
| `/labeling/[id]` | AuthShell | `LabelDetailPage` | Version history, translation tracking, approval workflow, diff view |

### Analytics

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/analytics` | AuthShell | `AnalyticsPage` | KPI strip; agency submission bar chart; registration growth chart; approval timeline table |

### Archive

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/archive` | AuthShell | `ArchivePage` | Read-only submission archive; audit log viewer; storage volume stats |

### Settings

| Route | Layout | Primary component | Notes |
|-------|--------|-------------------|-------|
| `/settings/profile` | AuthShell | `ProfileSettingsPage` | User details, notification preferences |
| `/settings/team` | AuthShell | `TeamSettingsPage` | User list, invite, role assignment, deactivation |
| `/settings/integrations` | AuthShell | `IntegrationsSettingsPage` | Org-level settings, AI consent toggle, renewal thresholds |

---

## 5. Component Architecture

```
apps/web/src/
├── app/                        # Next.js App Router — layouts, pages, loading.tsx, error.tsx
│   ├── (auth)/                 # Route group: authenticated pages share AuthShell layout
│   │   ├── dashboard/
│   │   ├── registrations/
│   │   ├── renewals/
│   │   ├── submissions/
│   │   ├── dossiers/
│   │   ├── publishing/
│   │   ├── ai/
│   │   ├── labeling/
│   │   ├── analytics/
│   │   ├── archive/
│   │   └── settings/
│   └── (unauth)/
│       └── login/
├── components/
│   ├── ui/                     # Primitive, domain-agnostic components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx           # Sortable, paginated base table
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx           # Urgency badge variants
│   │   ├── DatePicker.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx           # Notification toasts
│   │   ├── Tabs.tsx
│   │   ├── FilterChip.tsx
│   │   ├── EmptyState.tsx
│   │   ├── KpiCard.tsx
│   │   └── index.ts
│   ├── layout/                 # Shell components
│   │   ├── AuthShell.tsx
│   │   ├── UnauthShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── CopilotPane.tsx     # AI Copilot slide-in (380px, global)
│   │   └── index.ts
│   ├── registrations/
│   │   ├── RegistrationTable.tsx
│   │   ├── RegistrationDetailModal.tsx
│   │   ├── NewRegistrationModal.tsx
│   │   ├── CountryTileMap.tsx
│   │   └── index.ts
│   ├── renewals/
│   │   ├── RenewalTable.tsx
│   │   ├── CountdownCell.tsx
│   │   └── index.ts
│   ├── submissions/
│   │   ├── SubmissionTable.tsx
│   │   ├── GanttTimeline.tsx
│   │   ├── HaQueryTable.tsx
│   │   ├── AiDraftModal.tsx
│   │   └── index.ts
│   ├── dossiers/
│   │   ├── CtdTree.tsx
│   │   ├── GapPanel.tsx
│   │   ├── DocumentList.tsx
│   │   └── index.ts
│   ├── ai/
│   │   ├── InsightCard.tsx
│   │   ├── RegWatchFeed.tsx
│   │   └── index.ts
│   ├── labeling/
│   │   ├── LabelTable.tsx
│   │   ├── TranslationList.tsx
│   │   └── index.ts
│   └── analytics/
│       ├── SubmissionBarChart.tsx
│       ├── RegistrationGrowthChart.tsx
│       └── index.ts
├── services/                   # All fetch calls — never in components
│   ├── registrations.ts
│   ├── renewals.ts
│   ├── submissions.ts
│   ├── dossiers.ts
│   ├── documents.ts
│   ├── publishing.ts
│   ├── ai.ts
│   ├── labeling.ts
│   ├── analytics.ts
│   ├── users.ts
│   └── index.ts
├── hooks/                      # TanStack Query wrappers + custom hooks
│   ├── useRegistrations.ts
│   ├── useSubmissions.ts
│   ├── useDossier.ts
│   ├── useNotifications.ts
│   └── index.ts
├── lib/
│   ├── config.ts               # Client env vars, Zod-validated
│   ├── auth.ts                 # Cognito JWT helpers (decode, expiry check)
│   ├── formatters.ts           # Date, number, status label formatters
│   ├── constants.ts            # SCREAMING_SNAKE_CASE constants
│   └── index.ts
└── types/                      # Re-exports from packages/types
    └── index.ts
```

Naming rules:
- Component files: PascalCase (`RegistrationTable.tsx`)
- Folders: kebab-case (`dossier-detail/`)
- Every folder imported externally has a barrel `index.ts`; `app/` is exempt

---

## 6. State Management and Data Fetching

**Server state:** TanStack Query v5 exclusively. No data from the server is stored in component state.

Query key conventions:
```ts
['registrations', filters]          // list
['registration', id]                 // single record
['submissions', { status, haId }]   // filtered list
['dossier', dossierId, 'modules']   // nested resource
['notifications', userId]
```

**Mutation pattern:** on success, invalidate the parent list key plus the affected record key.

**Local UI state:** `useState` / `useReducer` for modal open/close, wizard step, filter panel open — nothing that belongs on the server.

**No global client store.** Redux and Zustand are not installed. If a cross-page shared value is needed (e.g., Copilot pane open state), a React context with a single value is sufficient.

**Stale time:** 30 seconds for lists; 60 seconds for detail records. Background refetch on window focus enabled.

---

## 7. Authentication Flow

1. On app load, `lib/auth.ts` checks for a valid Cognito JWT (cookie or `localStorage`).
2. If absent or expired, redirect to `/login`. The login page either shows a custom email/password form (Amplify Auth) or a "Sign in with SSO" button that redirects to Cognito Hosted UI.
3. On successful login, Cognito returns an ID token and access token. The access token is stored (HttpOnly cookie preferred; `localStorage` as fallback for demo tier).
4. The access token is decoded client-side only for UI display (user name, role). All authorization enforcement is on the backend — the frontend never gates by role alone.
5. All API requests include `Authorization: Bearer <access_token>` via a fetch wrapper in `services/`.
6. On token expiry, `@aws-amplify/auth` refreshes silently. If refresh fails, the user is redirected to `/login`.
7. Logout: call Amplify `signOut()`, clear token storage, redirect to `/login`.

---

## 8. Form Handling

All forms use `react-hook-form` with a `zodResolver`.

**Single-step forms** (new submission, new renewal): standard `useForm` with field-level error messages rendered below each input.

**Multi-step wizard** (new registration, new dossier): a `WizardForm` component manages step index in `useState`. Each step's schema is a Zod slice; validation runs per-step on "Next". The parent form accumulates values across steps and POSTs on final "Create".

**File uploads:**
1. User drops or selects files into `DropZone` (`components/ui/DropZone.tsx`).
2. Frontend calls `POST /api/uploads/presign` with file metadata to obtain an S3 presigned PUT URL.
3. File bytes are sent directly to S3 via `fetch(presignedUrl, { method: 'PUT', body: file })`.
4. On S3 success, frontend calls `POST /api/documents` with the S3 key and metadata to complete the record.
5. Upload progress is tracked via `XMLHttpRequest` `progress` events.

---

## 9. Error and Loading States

**Loading:** `Skeleton.tsx` renders placeholder rows/cards during initial data fetch. Tables show 5 skeleton rows; KPI strips show 5 skeleton cards. Never show a blank page.

**Mutations:** `Toast` notifications for success and error. Toasts appear top-right, auto-dismiss after 5 seconds, manually dismissable.

**Empty states:** Every list view has an `EmptyState` component with an icon, message, and a CTA button (e.g., "Add your first registration"). New tenants with no data see this on every module page.

**Error boundary:** `app/error.tsx` at the route-group level catches unhandled render errors and shows a recovery page with a retry button and a link to the dashboard.

**Network errors:** TanStack Query retries failed GET requests up to 3 times with exponential back-off. Mutations do not auto-retry; the toast error message includes a "Try again" action.

**AI rate limit:** When the Copilot hits the 60 req/hour org limit, a dismissable banner inside the Copilot pane shows "Rate limit reached — resets at HH:MM UTC".

**404 / 403:** Dedicated `not-found.tsx` and an inline 403 message ("You don't have permission to view this record") rather than a redirect.

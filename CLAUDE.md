# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config; extends `eslint-config-next/core-web-vitals` + `/typescript`)


## Stack and conventions

- **Next.js 16.2.3** with the **App Router** (`app/` directory). React 19.2.4. TypeScript strict mode. Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.*` — configuration lives in `app/globals.css`).
- `npm test` runs `node --test` over `tests/*.test.mjs` (type-stripped TS; runtime imports between lib modules need an explicit `.ts` extension).
- Path alias `@/*` resolves to the repo root (see `tsconfig.json`), so imports like `@/lib/...` and `@/components/...` work from anywhere.
- `app/layout.tsx` is the root layout (ThemeProvider, ToasterClient, IBM Plex Sans). Global styles and design tokens live in `app/globals.css`.

## Critical: this is Next.js 16, not the version in your training data

`AGENTS.md` is authoritative on this — Next.js 16 has breaking changes relative to older versions you may remember. **Before writing code that touches Next.js APIs, routing conventions, caching, server components, metadata, fonts, or file-structure conventions, read the relevant guide under `node_modules/next/dist/docs/`** (entry point `node_modules/next/dist/docs/index.md`; App Router docs under `01-app/`). Obey any deprecation notices you find there rather than relying on prior knowledge.

## Route structure

```
app/
  layout.tsx            — root layout: ThemeProvider + ToasterClient, IBM Plex Sans
  page.tsx              — public landing page (/)
  login/page.tsx        — /login, public
  change-password/      — /change-password (outside (app): no alert polling while forced)
  (app)/                — protected route group
    layout.tsx          — AppShell: AlertsProvider + Sidebar + TopBar + PageGuard
    overview/           — today's summary, the alert inbox, classroom devices
    alerts/             — Needs review tab; alerts/all = All alerts; alerts/[id] = detail + review actions
    reports/            — charts + saved reports (guidance and admins)
    classrooms/         — classroom cards; classrooms/[id] = devices, area map, recent alerts
    people/             — user accounts
    activity/           — Account actions; activity/system = System logs
    settings/           — per school (school admin, or super admin inside a school): Notifications,
                          settings/hours, settings/sensitivity, settings/words (global list with per-school
                          turn-off + the school's own words). Super admin outside a school: settings = read-only
                          Detection settings, settings/words = the editable global list
    schools/            — super admin: All schools (Enter school)
    profile/            — avatar menu: account + notifications
```

`lib/access.ts` is the single source of truth for page access and the sidebar (`navItemsFor(role, mode)`):
staff 2 items, counselor 3, admin 7; a super admin sees 4 platform items, or the admin's 7 after entering a
school. `proxy.ts` and the `(app)` PageGuard both read it. Old URLs redirect from `next.config.ts`
(`lib/legacy-routes.ts`). New protected pages must go inside `(app)/` and get a rule in `ROUTE_ACCESS`.

## Super admin school scope

`lib/school-scope.ts` stores the entered school in localStorage (cleared on login, logout and session reset).
While set, `apiRequest` adds `school_id` to every request; the backend accepts it only from super admins.

## Data flow

`AlertsProvider` (`lib/AlertsProvider.tsx`) polls `GET /alerts/` every 3 seconds and exposes `alerts`,
`stats`, `online`, `loading`, `lastUpdated` and `updateAlert` via `useAlerts()`; it starts a fresh feed when the
school scope changes. Reviews go through `useReviewAlert()` (`POST /alerts/{id}/review`, with Undo).
Device Online/Offline comes from each device's own `last_seen_at` via `GET /devices/status`
(`lib/useDeviceStatus.ts`; online = seen in the last 2 minutes, `lib/device-status.ts`), never the global
`system_settings` heartbeat.

The backend URL is `NEXT_PUBLIC_API_URL` (`.env.local`).

## School settings

`lib/school-settings.ts` parses `/school-settings` (push levels, school hours, sensitivity) and
`/school-settings/terms`; `components/settings/*` render them. `useSettingsMode()` picks school or platform
view (super admin with no entered school = platform). Alerts carry `outside_school_hours` (stored, not pushed).

## Design system

- **Tokens live only in `app/globals.css`** (`:root` and `.dark`), exposed as Tailwind utilities:
  `bg-bg`, `bg-surface`, `border-line`, `border-line-strong` (form controls), `text-ink`, `text-muted`,
  `bg-brand`/`text-brand-ink` (primary actions and the active nav item), `text-link`, `sev-high|medium|low`
  (+ `-bg`), `danger`, `chart`. Do not use raw Tailwind palette colors or per-component `dark:` overrides.
- Radius by hierarchy: `rounded-panel` (12) › `rounded-control` (8) › `rounded-tag` (4). One shadow,
  `shadow-pop`, for menus and dialogs only.
- Type: IBM Plex Sans; scale `text-display`, `text-title`, `text-body-lg`, `text-body`, `text-small`,
  `text-figure`; add `num` for tabular numbers. Sentence case, no all-caps labels.
- Severity is always a word plus color (High red, Medium amber, Low blue). Green is never severity.
- Shared primitives: `components/ui` (Button, Page, PageHeader, Panel, TabLinks, EmptyState, ErrorState,
  Field, Menu) and `components/ui/status.tsx` (SeverityTag, SeverityStripe, ReviewState, DeviceStatus).
- Motion only in response to actions (`animate-pop-in`, `animate-row-out`); reduced motion is respected.
- No emojis in UI. Empty and error states say what to do next.

## Key types (`lib/types.ts`)

- `Alert` — includes `status: "active" | "reviewed" | "resolved"` ("active" = needs review)
- `DeviceStatusItem`, `SchoolSummaryCard` — from `/devices/status` and `/schools/summary`
- `AuthUser` — `{ id, email, role, school_id, is_super_admin, must_change_password }` (in `lib/auth.ts`)

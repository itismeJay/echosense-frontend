# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config; extends `eslint-config-next/core-web-vitals` + `/typescript`)

No test runner is configured in this repo.

## Stack and conventions

- **Next.js 16.2.3** with the **App Router** (`app/` directory). React 19.2.4. TypeScript strict mode. Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config.*` — configuration lives in `app/globals.css`).
- Path alias `@/*` resolves to the repo root (see `tsconfig.json`), so imports like `@/lib/...` and `@/components/...` work from anywhere.
- `app/layout.tsx` is the root layout (ThemeProvider, ToasterClient, Geist fonts). Global styles and design tokens live in `app/globals.css`.

## Critical: this is Next.js 16, not the version in your training data

`AGENTS.md` is authoritative on this — Next.js 16 has breaking changes relative to older versions you may remember. **Before writing code that touches Next.js APIs, routing conventions, caching, server components, metadata, fonts, or file-structure conventions, read the relevant guide under `node_modules/next/dist/docs/`** (entry point `node_modules/next/dist/docs/index.md`; App Router docs under `01-app/`). Obey any deprecation notices you find there rather than relying on prior knowledge.

## Route structure

```
app/
  layout.tsx          — root layout: ThemeProvider + ToasterClient (wraps all routes)
  page.tsx            — public landing page (/)
  login/page.tsx      — login page (/login), public
  (app)/              — protected route group
    layout.tsx        — AppShell: AlertsProvider + Navbar + Sidebar + flash overlay
    dashboard/page.tsx
    analytics/page.tsx
    logs/page.tsx
    settings/page.tsx
```

`middleware.ts` (project root) guards all `(app)` routes — it reads the `echosense_token` cookie and redirects unauthenticated users to `/login`. New protected pages must go inside `(app)/`.

## Authentication

- **Cookie:** `echosense_token` (JWT, set client-side via `document.cookie`, max-age 24h)
- **`lib/auth.ts`** — owns all auth logic: `login()`, `logout()`, `setAuthCookie()`, `clearAuthCookie()`, `useCurrentUser()` hook (decodes JWT payload client-side with `atob`, no library)
- **`lib/api.ts`** — `apiFetch()` reads the cookie and attaches `Authorization: Bearer <token>` on every request; auto-clears the cookie and redirects to `/login` on 401
- Backend endpoint: `POST /auth/login` → `{ access_token, token_type, user: { id, email, role } }`

## Data flow

`AlertsProvider` (`lib/AlertsProvider.tsx`) is the single source of truth for live data. It polls the FastAPI backend every 3 seconds (`getAlerts`, `getLogs`, `getLogsStats` in parallel) and exposes `alerts`, `logs`, `stats`, `online`, `loading`, `flashKey`, and `uptimeMs` via `useAlerts()`. It also fires a `toast.error` and increments `flashKey` when a new high-severity alert arrives — `flashKey` is used as a React `key` on the flash overlay div in `(app)/layout.tsx` to re-trigger the CSS animation without setState-in-effect.

The backend URL is `NEXT_PUBLIC_API_URL` (`.env.local`). When the backend is unreachable, components degrade gracefully — no mock data fallback currently exists.

## Design system

- **Colors:** indigo (#6366f1) / purple (#a855f7) / cyan (#22d3ee) for primary UI. Severity: `red-500` (high), `amber-500` (medium), `emerald-500` (low). Never use plain blue or yellow for severity.
- **Dark mode:** `next-themes` with `attribute="class"`. Every component must include `dark:` variants. `suppressHydrationWarning` is on `<html>`.
- **Glassmorphism** (used on cards inside the app): `bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-2xl`
- **Login page** uses a shadcn-style flat design (`bg-zinc-50 dark:bg-zinc-950`, clean card with `border border-zinc-200 dark:border-zinc-800`) — intentionally different from the app interior.
- Custom CSS keyframes in `globals.css`: `float` (blob animation), `alert-flash` / `alert-flashing` (red inset glow on high alert), `wave-bar` (AudioVisualizer), `pulse-dot`, `slide-in-top`.
- No emojis in UI. All severity indicators use lucide-react icons.

## Key types (`lib/types.ts`)

- `Alert` — `{ id, severity, confidence, duration, location, status, created_at }`
- `LogsStats` — `{ total_alerts, high_severity, medium_severity, low_severity }`
- `Settings` — `{ confidence_threshold, duration_threshold, notifications, location }`
- `AuthUser` — `{ id, email, role: "admin" | "user" }` (defined in `lib/auth.ts`)

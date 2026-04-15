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
- Path alias `@/*` resolves to the repo root (see `tsconfig.json`), so imports like `@/app/...` work from anywhere.
- `app/layout.tsx` is the root layout and loads Geist/Geist Mono via `next/font/google`; global styles live in `app/globals.css`.

## Critical: this is Next.js 16, not the version in your training data

`AGENTS.md` is authoritative on this — Next.js 16 has breaking changes relative to older versions you may remember. **Before writing code that touches Next.js APIs, routing conventions, caching, server components, metadata, fonts, or file-structure conventions, read the relevant guide under `node_modules/next/dist/docs/`** (entry point `node_modules/next/dist/docs/index.md`; App Router docs under `01-app/`). Obey any deprecation notices you find there rather than relying on prior knowledge.

# Scalific Agency Website

A premium digital growth agency website for Scalific. All public content (services, team, contact form) is live from Supabase. Includes a full admin panel protected by Supabase Auth.

## Run & Operate

- `pnpm --filter @workspace/scalific run dev` — run the Scalific frontend (port injected by workflow)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages

## Initial Setup

### Step 1 — Run the database migration
1. Open [Supabase dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**
2. Paste and run the full contents of `supabase-migration.sql` at the project root
3. This creates all tables, RLS policies, storage buckets, and seed data

### Step 2 — Create your admin user
The admin panel at `/admin` uses Supabase Auth (email/password). To create your first admin account:

1. Go to [Supabase dashboard](https://supabase.com/dashboard) → your project → **Authentication** (left sidebar)
2. Click the **Users** tab
3. Click **Add user** → **Create new user**
4. Enter an email address and a strong password, then click **Create user**
5. Go to `your-site-url/admin/login` and sign in with those credentials

> **Note:** Any user you create in Supabase Auth will be able to log into the admin panel, since the RLS policies grant write access to all `authenticated` users. Only share credentials with people you trust to manage site content.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage)
- API Server: Express 5 (for any server-side operations needing service role)

## Where Things Live

- `artifacts/scalific/` — main Scalific website
- `artifacts/scalific/src/lib/supabase.ts` — Supabase browser client (anon key)
- `artifacts/scalific/src/lib/types.ts` — TypeScript types for all Supabase tables
- `artifacts/scalific/src/pages/` — all page components (Home, Admin/*)
- `supabase-migration.sql` — run once in Supabase SQL editor to set up schema

## Supabase Tables

- `site_settings` — key/value settings (logo_url, etc.)
- `services` — agency services shown on public site
- `team_members` — team grid on public site
- `content_blocks` — editable content (hero_title, hero_subtitle, about_text)
- `contact_form_fields` — dynamic contact form configuration
- `contact_submissions` — incoming contact form submissions

## Supabase Storage Buckets

All public-read: `logos`, `team-photos`, `service-icons`, `media`

## Environment Variables (Secrets)

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (exposed to client via vite define)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key (exposed to client via vite define)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only, never client)

## Architecture Decisions

- Vite `define` config maps `NEXT_PUBLIC_SUPABASE_*` secrets to `VITE_SUPABASE_*` at build time, so secrets stay as Replit Secrets while Vite can bundle them.
- All public data fetching uses the Supabase anon key + RLS (no API proxy needed).
- Admin panel uses Supabase Auth email/password; session persisted in localStorage.
- Service role key is reserved for the Express API server only (never bundled into client).
- Contact form submissions are public-insert via RLS; only authenticated users can read them.

## User Preferences

- Brand: green gradient #22C55E → #15803D, accent #86EFAC, dark #181B20
- Premium, dark-mode-first aesthetic with Framer Motion animations
- All content managed via admin panel — nothing hardcoded

## Gotchas

- Run supabase-migration.sql before the app will have any data
- The Supabase anon key is intentionally exposed client-side (this is the Supabase design)
- Admin login requires a Supabase Auth user — create one in Supabase Auth dashboard

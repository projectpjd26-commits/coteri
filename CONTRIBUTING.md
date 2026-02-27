# Contributing to COTERI

## Before opening a PR

- Run **`npm run build`** and **`npx tsc --noEmit`** — the repo CI runs these; fix any errors before pushing.
- Run **`npm run lint:app`** — lints the active app (`app/`, `src/`). Legacy `src/app-legacy/` was removed.
- Or run **`npm run check`** — runs build, tsc, and lint:app in one command (same as CI).
- If you add or change **Supabase tables or views**, update **`docs/SUPABASE-SQL-RUNBOOK.md`** (key tables list) and add migrations under `supabase/migrations/`.
- **Releases:** When cutting a release, bump version in package.json and add an entry under **`CHANGELOG.md`** (move [Unreleased] items into the new version).
- **Dependency audit:** Run **`npm audit`** periodically; fix or accept risk for reported issues. Optional: add `npm audit` to a maintenance checklist (see SYSTEMS-AUGMENTATIONS).

## Branch protection

The default branch (`main`) should have **Require status checks to pass before merging** with the **CI** workflow selected. See `docs/DEPLOY.md` for setup. Only merge when CI (build, tsc, lint:app) is green.

## Docs

- **Project state:** `docs/PROJECT-STATE-AND-HANDOFF.md`
- **Deploy:** `docs/DEPLOY.md`
- **Pre-production:** `docs/PRE-PRODUCTION-CHECKLIST.md` (before go-live)
- **Supabase / SQL:** `docs/SUPABASE-SQL-RUNBOOK.md`
- **RLS audit:** `docs/RLS-AUDIT.md` (periodic RLS checks)
- **Backup / restore:** `docs/BACKUP-RESTORE-RUNBOOK.md` (production backups, PITR)
- **Legacy migration:** `docs/APP-LEGACY-MIGRATION.md` (app-legacy removed; all routes in `app/`)
- **System checklist:** `docs/SYSTEM-REVIEW.md`
- **Backlog:** `docs/TODO.md`
- **Future / optional:** `docs/FUTURE-BACKLOG.md` (middleware proxy, Redis/KV, OpenAPI, Sentry, feature flags, i18n, CI budget, test restore). When you implement an item from that doc, update its **Implementation log** table.

## Env

Copy `.env.example` to `.env.local` and set at least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` (use `http://localhost:3000` for local dev).

## Optional: E2E / smoke tests

For sign-in → dashboard or critical path coverage, consider adding Playwright or Cypress and a minimal smoke test (e.g. sign-in → dashboard, or staff → Verify: sidebar link → /verify loads). Not required for PRs; document in README or this file if added.

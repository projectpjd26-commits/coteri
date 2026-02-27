# System Augmentations

**Purpose:** Actionable commands, sub-agents, rules, tasks, and automations that enhance execution capability and architectural leverage for COTERI. Use this doc to drive automation coverage and AI-assisted development.

---

## 1. Command suggestions

| Command / trigger | Purpose |
|-------------------|--------|
| `npm run build && npx tsc --noEmit` | Verify build and TypeScript before deploy. |
| `npm run check` | Run build + tsc + lint:app (same as CI). Use before PR. See [CONTRIBUTING.md](CONTRIBUTING.md). |
| `npx eslint app src` | Lint active app (use when `next lint` fails with invalid project directory). Legacy `src/app-legacy/` was removed. |
| `supabase db push` | Apply all pending migrations (after `supabase link`). |
| `npm audit` | Periodic dependency audit; fix or accept risk. See CONTRIBUTING. |
| `vercel alias set <deployment-url> coteri.vercel.app` | Point production alias at latest deployment after deploy. |
| `curl -s -o /dev/null -w "%{http_code}" https://<your-app>/api/health` | Health check; expect 200. Use for uptime or LB. |
| **External AI design critique** | Copy `docs/EXTERNAL-AI-CRITIQUE-PROMPT.md` (full doc) + attach screenshots or live URL; send to external AI or design reviewer. Use output to prioritize V2 items. See PRE-PRODUCTION §7. |

---

## 2. Sub-agent recommendations

| Agent | Use when |
|-------|----------|
| **Explore** | Broad codebase search (e.g. "where are API endpoints defined?", "how does venue switching work?"). |
| **Shell** | Git operations, running migrations, deploy commands, env checks. |
| **General-purpose** | Multi-step research, drafting runbooks, cross-file refactors. |

---

## 3. Rule insertions

- **Auth:** Preserve `next` in sign-in redirects with full path encoding (e.g. `next=${encodeURIComponent("/join?venue=slug")}`).
- **NEXT_PUBLIC_SITE_URL:** When set, auth callback and logout use it as canonical redirect origin. Ensure it matches your deployed domain (e.g. `https://coteri.vercel.app`); wrong value can send users to the wrong host. Validate in production (e.g. allowlist in build or runbook check).
- **Venue:** Validate slug with `VENUE_SLUG_REGEX` and `VENUE_SLUG_MAX_LENGTH`; never trust cookie value without allow-list check.
- **Admin venue list:** For admins, launcher and dashboard switcher use `getFallbackVenues()` (all 8); set-venue allows all fallback slugs. Single source: `FALLBACK_VENUES_LIST` in constants. See SYSTEM-REVIEW §2 (Admin: all 8 fallback venues).
- **Dashboard activity tiles:** Use member-facing labels (e.g. “Visits”, “Last visit”, “Rewards used”) not system terms (“Scans”, “Redemptions”). Add optional `title` for clarity on metrics that may be ambiguous. See SYSTEM-REVIEW §4 (Your activity).
- **QR / pass signing:** If the app uses QR or wallet pass signing, set `QR_SIGNING_SECRET` in production only; do not commit the value. See PRE-PRODUCTION-CHECKLIST §5.
- **Health endpoint:** Keep `GET /api/health` minimal (e.g. `{ status: "ok" }` only). Do not expose internal state, stack traces, or env; use for uptime/LB only. See SECURITY.md.
- **AI Copilot:** Rate limit on `POST /api/ai/analytics` is 10 req/min per user (in-memory); document in PROJECT-STATE. For cross-instance scaling, add Redis/Vercel KV (same pattern as ingest). AI feature flag: omit `ANTHROPIC_API_KEY` to disable Copilot (503).
- **Financial/audit:** No destructive updates to trade/ledger tables; preserve immutable records and time-series events.
- **V2 critique:** When completing an item from `docs/V2-RECOMMENDATIONS.md`, add it to the "Implemented in this pass" section with file references so the doc stays the single source of truth for pilot readiness.

---

## 4. Task queue inserts

- [x] Add `.env.example` entry for `NEXT_PUBLIC_SITE_URL` and optional `INTERNAL_DEMO_USER_IDS`, `QR_SIGNING_SECRET` (see SYSTEM-REVIEW §9).
- [x] Consider auth callback reading redirect base from `NEXT_PUBLIC_SITE_URL` when behind proxy (optional).
- [x] Venue metrics: add venue switcher or `?venue=` when staff has multiple venues (SYSTEM-REVIEW §9).
- [ ] Set `QR_SIGNING_SECRET` in production if using QR/pass signing (see .env.example, PRE-PRODUCTION-CHECKLIST §5).
- [ ] When implementing Stripe checkout or waitlist/contact for "Get membership": update TODO 145 and add to **`docs/V2-RECOMMENDATIONS.md`** Implemented section with file refs.
- [x] Copy verification link feedback: aria-live "Copied verification link" + button "Copied!" (TODO 152). See `src/components/membership/MembershipPass.tsx`.
- [x] Tier cards visual differentiation (optional): V2 §3 — color/icon per tier (e.g. gold Founder, purple VIP) in dashboard or pass; doc in V2-RECOMMENDATIONS.
- **Shared Alert:** `src/components/ui/Alert.tsx` — success, error, info, warning variants with role/aria-live; use for toasts, empty states, form errors. Wire into MembershipPass "Copied!" or dashboard empty state when consolidating copy.

---

## 5. Automation hooks

| Hook | Description |
|------|-------------|
| **Pre-deploy check** | Run `npm run check` (build + tsc + lint:app) before push to main. See CONTRIBUTING. |
| **Migration reminder** | When adding new Supabase tables/views, update `docs/SUPABASE-SQL-RUNBOOK.md` key tables list. |
| **Stripe webhook** | Idempotency on `event_id`; replay protection; log payloads. Before production: run verification checklist in `docs/STRIPE-WEBHOOK-RUNBOOK.md` if using Stripe. |
| **Session refresh** | Root `middleware.ts` → `updateSession` (Supabase SSR) for all non-static routes. |

---

## 6. Scanners / monitors

- **Build:** CI step for `npm run build` and `npx tsc --noEmit` (see `.github/workflows/ci.yml`).
- **Lint:** `npm run lint:app` in CI so active app stays lint-clean without relying on `next lint` project-directory behavior.
- **RLS:** Periodically confirm anon cannot read `stripe_webhook_events`; users only see own data where RLS applies. Use **`docs/RLS-AUDIT.md`** for SQL checks and checklist.
- **Redirect URLs:** After renaming Vercel project or changing domain, update Supabase Auth URL config and `NEXT_PUBLIC_SITE_URL`.
- **Smoke test after auth/env change:** After changing `NEXT_PUBLIC_SITE_URL` or Supabase redirect URLs: (1) Sign in → confirm redirect to intended path, (2) Log out → confirm redirect to site home, (3) Sign in with magic link → confirm callback URL is correct. See `docs/DEPLOY.md` for env steps. **(4) Staff verify:** Sign in as venue staff → Dashboard → Verify → confirm page loads (PRE-PRODUCTION §7).
- **Pre-production:** Use `docs/PRE-PRODUCTION-CHECKLIST.md` before go-live (admins, migrations, auth, audit, Stripe/QR if used).
- **Audit phase 3:** Before production, run `docs/AUDIT-PHASE-3-IMPLEMENTATION.md` (verify flow, IS_DEMO_MODE, demo redirect). Linked in PRE-PRODUCTION-CHECKLIST §4.
- **QR / pass signing:** If used, set `QR_SIGNING_SECRET` in production; confirm in PRE-PRODUCTION §5.
- **Health:** `GET /api/health` returns `{ status: "ok" }` for load balancers and uptime checks. Use for monitoring.
- **Backup / restore:** Use `docs/BACKUP-RESTORE-RUNBOOK.md` for Supabase daily backups and PITR; document restore responsibility before production. Log test-restore date/outcome (PRE-PRODUCTION §6 or FUTURE-BACKLOG Implementation log).
- **Mock venue slug drift (optional):** When adding or changing mock venues, ensure each slug in `MOCK_VENUE_SLUGS` exists in `FALLBACK_VENUES_LIST` and has a `.venue-theme-{slug}` block in `app/globals.css`. See SYSTEM-REVIEW §2 "Adding a mock venue".
- **app-legacy:** Removed. All routes are in root `app/`. See `docs/APP-LEGACY-MIGRATION.md`.
- **Middleware (Next.js):** Next.js may deprecate the `middleware` file convention in favor of `proxy`. When the migration path is stable, migrate root `middleware.ts` to the new convention; see Next.js docs. Build currently succeeds with existing middleware.
- **AI Copilot:** Same in-memory rate limit (10 req/min) on `POST /api/ai/analytics`; add Redis/KV when scaling. See PROJECT-STATE-AND-HANDOFF § AI Analytics Layer.
- **Optional / future:** OpenAPI or generated API doc (TODO 64); error reporting e.g. Sentry (65); feature flags env/DB (67); i18n for membership/verify (68); Lighthouse or bundle size budget in CI (69). Add when needed; no requirement for current scope.
- **Design pass / external critique:** Before pilot or major UI change, run **`docs/EXTERNAL-AI-CRITIQUE-PROMPT.md`** with screenshots or live URL; use structured output (goal achievement, layout, color, UX, a11y, top 3) to prioritize. Linked in PRE-PRODUCTION §7.
- **CI performance budget:** Optional: add `npx bundlewatch` or Lighthouse CI to fail the build if bundle size or LCP regresses; see TODO 79.
- **Next block:** Backlog continues in `docs/TODO.md`. Optional items in **`docs/FUTURE-BACKLOG.md`**. When you implement an item, note it in that doc’s Implementation log. Next open block: **251–260** (V2 / procedural; 251 /join, 252 theming, 253 test restore open). See `docs/V2-RECOMMENDATIONS.md` and PRE-PRODUCTION-CHECKLIST §6–7.

---

*Last updated: Feb 2025. See also `docs/SYSTEM-REVIEW.md`, `docs/PROJECT-STATE-AND-HANDOFF.md`.*

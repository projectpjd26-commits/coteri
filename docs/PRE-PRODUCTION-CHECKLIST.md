# Pre-production checklist

Run through this before going live. Each item links to the relevant doc or code.

---

## 1. Admin access

- [ ] **PERMANENT_ADMINS** — Replace placeholder emails in `src/lib/constants.ts` with real co-founder emails/names, **or** leave placeholders and set `INTERNAL_DEMO_USER_IDS` (comma-separated UUIDs) in production env only.  
  See `docs/PROJECT-STATE-AND-HANDOFF.md` (Permanent admins).

---

## 2. Database (Supabase)

- [ ] **Migrations** — Run all required Supabase migrations for COTERI (venues, memberships, venue_staff, verification_events, etc.). CSV/positions migrations (`20250212100000_csv_imports.sql`, `20250212110000_csv_imports_row_count_and_view.sql`) are **not** used by this app; they belong to the journal-os project.
- [ ] See `docs/SUPABASE-SQL-RUNBOOK.md` for key tables and RLS.

---

## 3. Auth and redirects

- [ ] **NEXT_PUBLIC_SITE_URL** — Set to your production URL (e.g. `https://coteri.vercel.app`) in Vercel env and in Supabase **Authentication → URL Configuration** (Site URL + Redirect URLs).  
  See `docs/DEPLOY.md` (Environment variables, Supabase Auth redirect URLs).
- [ ] **Smoke test** — After deploy: sign in → confirm redirect; log out → confirm redirect to home; magic link → confirm callback URL.  
  See `docs/DEPLOY.md` (Smoke test after deploy).

---

## 4. Audit and feature flags

- [ ] **Audit phase 3** — Run `docs/AUDIT-PHASE-3-IMPLEMENTATION.md` (verify flow, IS_DEMO_MODE, demo redirect).
- [ ] **IS_DEMO_MODE** — Ensure production has `IS_DEMO_MODE` unset or `false` unless you intend demo mode in prod.
- [ ] **Internal demo** — Decide: keep `/internal/demo` for direct access (recommended: no main-flow links; keep for demos) or remove from codebase. Main flow does not link to it.  
  See `docs/PROJECT-STATE-AND-HANDOFF.md` (Internal demo).

---

## 5. Optional (if you use the feature)

- [ ] **Stripe** — If using Stripe: verify idempotency, replay protection, anon RLS per `docs/STRIPE-WEBHOOK-RUNBOOK.md`.
- [ ] **QR / pass signing** — If used: set `QR_SIGNING_SECRET` in production. Documented in `.env.example` and `docs/SYSTEMS-AUGMENTATIONS.md`.

---

## 6. Final checks

- [ ] **Branch protection** — GitHub `main` requires CI to pass. See `docs/DEPLOY.md` (Branch protection).
- [ ] **Vercel** — Production Branch = `main`; env vars set; Supabase redirect URLs include production callback.
- [ ] **Backup / test restore (optional)** — Run one test restore per `docs/BACKUP-RESTORE-RUNBOOK.md` §5 and document outcome. Recommended before production. **Log date and outcome** (e.g. in `docs/FUTURE-BACKLOG.md` Implementation log or here) for audit trail.

---

## 7. Design / V2 critique (pilot readiness)

Tick the boxes below after running the smoke test in **DEPLOY §5a** (including step 4 staff verify).

- [ ] **V2 recommendations** — Before pilot: complete or tick off key items in **`docs/V2-RECOMMENDATIONS.md`**. Minimum: staff verify screen reachable (e.g. "Verify" in dashboard sidebar for staff); pass page quick wins done (ACTIVE green, mockup label hidden, member since consistent, 404 branded); no fabricated "(demo)" numbers without honest placeholder.
- [ ] **Staff verify discoverability** — Staff (venue owner / manager / door) can reach `/verify` from the app (e.g. sidebar link when they have a staff role). Verify page does not redirect staff away.
- [ ] **External critique (optional)** — Run `docs/EXTERNAL-AI-CRITIQUE-PROMPT.md` with screenshots or live URL; use top 3 recommendations to prioritize remaining polish.

---

*See also: `docs/DEPLOY.md`, `docs/SUPABASE-SQL-RUNBOOK.md`, `docs/BACKUP-RESTORE-RUNBOOK.md`, `docs/TODO.md`, `docs/V2-RECOMMENDATIONS.md`.*

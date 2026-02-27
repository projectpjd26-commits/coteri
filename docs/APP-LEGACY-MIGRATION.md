# app-legacy migration status

**Purpose:** Record that `src/app-legacy/` was removed. All active routes live in root `app/`. See TODO 71.

---

## Status: Removed (Feb 2025)

- **Removed:** The entire `src/app-legacy/` directory was deleted. It contained legacy API routes (stripe/webhook, stripe/checkout, visits/track, analytics/venue, members/register, wallet/generate, auth/callback) and pages (dashboard, pricing, login, signup) that were not part of the active Next.js app (root `app/`).
- **Active app:** All routes are in `app/`. Stripe webhooks are handled by Supabase Edge Function; `app/api/stripe/webhook` returns 410.
- **Lint:** `npm run lint:app` now runs `eslint app src` with no legacy ignore (package.json updated).

---

*Last updated: Feb 2025.*

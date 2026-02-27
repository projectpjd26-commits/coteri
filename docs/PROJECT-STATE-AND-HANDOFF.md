# COTERI — Project state and handoff

**Purpose:** Bring another AI or developer up to speed. Use this doc as the main context for the current state of the app (as of the last major pass: role-based dashboard, venue switching, admins, and main page as home).

---

## What COTERI is

- **Product:** Membership and venue app. Venues have members (tiers: supporter, vip, founder). Members get a pass/QR; staff can verify at the door. Pilots: The Function SF, The Starry Plough.
- **Stack:** Next.js (App Router), Supabase (auth + Postgres + RLS), server components and route handlers. No separate backend.

---

## Roles (who sees what)

| Role | How determined | Experience |
|------|----------------|------------|
| **Admin** | Email in `PERMANENT_ADMINS` (hardcoded in code) **or** user id in env `INTERNAL_DEMO_USER_IDS` | Full access: all venues in switcher, Admin link, grant membership, demo reset. |
| **Venue owner** | Has at least one row in `venue_staff` (any role), and **not** admin | Sees only their venue(s). Lands on **venue splash**: venue name, link cards (Members, Venue data, Pass & QR), and a **members list** (tier + status) for that venue. No other venues. |
| **Member** | No `venue_staff` rows; has rows in `memberships` | Sees only venues where they have a membership. Standard dashboard: their memberships, tier rewards, their activity. |

- **Role at login:** Auth callback and dashboard compute `admin` | `venue_owner` | `member` and set cookie `coteri_user_role` for display. Dashboard sidebar shows “Logged in as Admin” / “Logged in as Venue owner” / “Logged in as Member”.
- **Permanent admins:** In `src/lib/constants.ts`, `PERMANENT_ADMINS` is an array of `{ email, name }`. Replace with real emails/names; matching is case-insensitive on email. No need to rely on `INTERNAL_DEMO_USER_IDS` for co-founders if you use this.

---

## Main user flows (current)

- **Home:** `/` — marketing; “Get membership” and “Sign in”. **Home is the main landing**; “Back to COTERI” from dashboard goes to `/`.
- **Sign in:** `/sign-in`. Default redirect after login is **`/launch`** (venue launcher). Use `next=` in the sign-in URL or set `AUTH_NEXT_COOKIE` to send users elsewhere (e.g. `/dashboard`). See auth callback in `app/auth/callback/route.ts`.
- **Dashboard:** `/dashboard` — behind auth. Admins see venue switcher and all venues; venue owners see their venue splash (hero + link cards + members list); members see their memberships and activity.
- **Venue switching:** Venue switcher in dashboard sidebar. Implemented via **client-side fetch** to `POST /api/set-venue` with `redirect: "manual"`, then `window.location.href = "/dashboard"` so the next request sends the new cookie. Cookie name: `current_venue_slug`. Only slugs the user is allowed to see are accepted.
- **Admin:** `/admin` — grant membership, demo reset. Gated by `isDashboardAdmin(user)` (permanent admins or `INTERNAL_DEMO_USER_IDS`).
- **Join:** `/join` — “Get a membership”; “Grant me membership” only for admins. Others see join UI but no grant button unless admin.
- **Pass & QR:** `/membership` — pass view and **wallet links** (Apple / Google). Preferred venue from `?venue=` or cookie.
- **Internal demo:** `/internal/demo` still exists (venue banners, wallet links, admin link) but is **not** in the main flow; nothing links to it from dashboard or sign-in. **Decision:** keep for direct access (recommended for demos); remove from codebase only if you need to lock down all demo entry points.

---

## Where key logic lives

| Concern | Location |
|--------|----------|
| Admin vs venue owner vs member | `src/lib/dashboard-auth.ts`: `isDashboardAdmin(user)`, `getRoleForUser(user, hasStaffRows)`, `allowedVenuesForUser(...)`, `allowedVenueSlugs(...)` |
| Permanent admin list | `src/lib/constants.ts`: `PERMANENT_ADMINS` |
| Cookies | `src/lib/constants.ts`: `CURRENT_VENUE_COOKIE`, `AUTH_NEXT_COOKIE`, `USER_ROLE_COOKIE` |
| Dashboard layout (sidebar, venue list, redirects) | `app/dashboard/layout.tsx` — uses `allowedVenuesForUser`, trims cookie, resolves current venue from `venues` or `allowedOptions` so we don’t overwrite cookie with “first” venue |
| Dashboard page (splash vs member view) | `app/dashboard/page.tsx` — if `isVenueOwner && selectedVenueName` → venue splash (hero, cards, members table); else standard dashboard |
| Dashboard “Your activity” tiles | `app/dashboard/page.tsx` — 12 tiles from memberships (tier, status, created_at), venue_scan_events (visits, total), venue_transactions (drinks), venue_redemptions (rewards). Member-facing labels; optional `title` on key tiles. See SYSTEM-REVIEW §4. |
| Set venue (allow list, cookie) | `app/api/set-venue/route.ts` — GET/POST; validates slug against `allowedVenueSlugs`; 303 redirect after POST |
| **Session refresh (middleware)** | Root `middleware.ts` delegates to `@/lib/supabase/middleware` → `updateSession(request)`; refreshes Supabase session on every request for non-static routes. |
| Venue switcher UI | `src/components/dashboard/VenueSwitcher.tsx` — client component; fetch POST then `window.location.href = "/dashboard"` |
| Role at login | `app/auth/callback/route.ts` — after `exchangeCodeForSession`, queries `venue_staff`, calls `getRoleForUser`, sets `USER_ROLE_COOKIE` |
| Admin / Join / Demo APIs | `src/lib/auth/require-auth.ts`: `requireDemoAdmin()` uses `isDashboardAdmin(user)`. Used by `/admin`, `/join`, internal demo, demo-grant, demo-reset |

---

## Protected API routes (auth / role)

| Route | Method | Auth | Notes |
|-------|--------|------|--------|
| `/api/set-venue` | GET, POST | Session required | Validates slug against `allowedVenueSlugs`; sets `current_venue_slug` cookie. **Admins:** allowed slugs include all `getFallbackVenues()` slugs (8), so launcher and dashboard switcher can set any of them. |
| `/api/wallet/apple`, `/api/wallet/google` | GET | Session required | Wallet pass URLs. |
| `/api/internal/demo-grant-membership` | POST | Admin only (`requireAdmin`) | Grant current user a membership; query `?venue=slug&next=/path`. |
| `/api/internal/demo-reset` | POST | Admin + `IS_DEMO_MODE=true` (`requireDemoAdmin`) | Reset demo data; returns 404 when demo mode off. |
| `/api/stripe/webhook` | POST | Stripe signature (no user session) | See `docs/STRIPE-WEBHOOK-RUNBOOK.md`. |
| `/api/auth/session-ready` | GET | Optional | Session check for client. |
| `/api/health` | GET | None | Health check for monitoring; returns `{ status: "ok" }`. |
| `/api/ai/analytics` | POST | Session + venue staff | Venue Copilot: streamed AI over venue data (staffing, churn). Body: `{ messages, venueId }`. Rate limit 10 req/min per user. Use **Ollama** (set `OLLAMA_BASE_URL`, e.g. `http://localhost:11434`) for free local inference, or **Anthropic** (`ANTHROPIC_API_KEY`). Returns stream or 401/400/429/503. |

**Response examples:**

- **`GET/POST /api/set-venue`** — Success: `303 Redirect` to `next` or `/dashboard`. No JSON body; cookie `current_venue_slug` set when slug allowed.
- **`POST /api/internal/demo-grant-membership`** — Success: `303 Redirect` to `next` or `/dashboard?granted=ok`. Error: `403` (Forbidden), `404` (no venue), `500` (upsert failed).

---

## Data and RLS

- **Venues:** `public.venues` (id, name, slug, is_demo, etc.).
- **Members:** `public.memberships` (user_id, venue_id, tier, status). RLS: users see own rows; **venue staff can SELECT memberships for their venue(s)** (policy `memberships_select_venue_staff` in migration `20250211120000_memberships_venue_staff_select.sql`).
- **Staff:** `public.venue_staff` (user_id, venue_id, role). Roles include owner, manager, staff. RLS: users see own rows.
- **Pilot slugs:** `PILOT_VENUE_SLUGS` in constants (`the-function-sf`, `the-starry-plough`). **Admins:** launcher and dashboard venue list use `getFallbackVenues()` (all 8); set-venue allows all 8. Non-admins: layout uses `onlyPilotVenues()` so switcher shows only venues they can access. See SYSTEM-REVIEW §2 (Admin: all 8 fallback venues).

---

## AI Analytics Layer (optional)

A parallel AI layer adds predictive and narrative insights without touching core membership data:

- **Event capture:** `analytics_events` table populated by triggers from `verification_events` and `memberships` (scan, membership_created, membership_expired, etc.). RLS: venue-scoped.
- **Feature store:** `venue_health_daily` (materialized view), `member_behavior_features` (table with churn_risk_score). Refresh via `refresh_member_behavior_features()` and `REFRESH MATERIALIZED VIEW venue_health_daily` (nightly cron or Edge Function).
- **Predictive:** `venue_forecasts` (attendance), `venue_anomalies` (drops/spikes). Filled by `refresh_venue_forecasts()` and `detect_venue_anomalies()`.
- **LLM insights:** `venue_ai_insights` (summary_text, recommendations). Batch job writes only; dashboard reads. Shown as “Proactive Insights” on Venue Intelligence (`/dashboard/venue/metrics`; `/venue/metrics` redirects there).
- **Venue Copilot:** `POST /api/ai/analytics` — streamed chat with tools (predict_staffing, detect_churn, analyze_portfolio). Use **Ollama** (`OLLAMA_BASE_URL`) for free local inference or **Anthropic** (`ANTHROPIC_API_KEY`); rate limit 10 req/min per user. See PROJECT-STATE table above.

Migrations: `20250226100000_analytics_events.sql` through `20250226100300_venue_ai_insights.sql`. All AI tables are venue-scoped RLS; AI never mutates core membership or verification data.

---

## Env and config (reminder)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required.
- `INTERNAL_DEMO_USER_IDS` — optional; comma-separated user UUIDs for admin if not using `PERMANENT_ADMINS` only.
- `SUPABASE_SERVICE_ROLE_KEY` — for demo-reset RPC and any server-only writes that bypass RLS.
- `NEXT_PUBLIC_SITE_URL` — used for redirects (e.g. after logout, set-venue).
- `ANTHROPIC_API_KEY` — optional; required for Venue Copilot when not using Ollama. No client exposure.
- **Ollama (free, local):** Set `OLLAMA_BASE_URL` (e.g. `http://localhost:11434`) and optional `OLLAMA_MODEL` (default `llama3.2`) to use local Ollama for Copilot instead of Anthropic.

---

## Fixes applied in this pass (for context)

1. **Venue switching reverting to Starry Plough:** Allowed venues in set-venue are all allowed slugs (not only pilot); don’t clear cookie when slug is rejected; trim cookie when reading; resolve current venue from `allowedOptions` when slug is allowed but not in `venues`; dashboard layout `force-dynamic`; set-venue returns 303; VenueSwitcher uses fetch + `window.location.href` so the next dashboard load sends the new cookie.
2. **Admins:** Permanent admins by email in `PERMANENT_ADMINS`; `isDashboardAdmin(user)` used everywhere (layout, set-venue, admin page, join, internal demo, requireDemoAdmin).
3. **Role at login:** Auth callback sets `coteri_user_role`; dashboard shows “Logged in as Admin / Venue owner / Member”; logout clears role cookie.
4. **Home:** Main page `/` is home; **auth callback default next is `/launch`** (sign-in page or cookie can override with `next=/dashboard` etc.); “Back to COTERI” and logo link to `/`; demo-grant fallback redirect is `/dashboard?granted=ok`.

---

## How to run

- Install deps, set env (see above), run migrations (Supabase). Dev: `npm run dev` (or your script). See `docs/DEPLOY.md` for deploy.
- **Supabase / SQL (no middleman):** See **`docs/SUPABASE-SQL-RUNBOOK.md`** — Dashboard SQL Editor, migrations, key tables, demo reset. Use that doc to run SQL yourself.

---

## Giving this to another AI

- **Option A:** Share this file: `docs/PROJECT-STATE-AND-HANDOFF.md`. It’s the single “where we’re at” doc.
- **Option B:** Also point at: `docs/SYSTEM-REVIEW.md` (detailed checklist), `docs/CEO-MEMBERSHIP-ACCESS.md` (grant/reset), `docs/demo-runbook.md` (demo flows), **`docs/SUPABASE-SQL-RUNBOOK.md`** (run SQL and migrations yourself).
- **Option C:** In the prompt to the other AI, say: “Read `docs/PROJECT-STATE-AND-HANDOFF.md` for current project state, roles, and where key logic lives, then [your task].”

No single doc is fully exhaustive; this one is meant to be the main handoff so the other AI can work on features or fixes without re-deriving the role and venue behavior.

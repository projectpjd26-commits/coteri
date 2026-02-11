# COTERI — System review (post-optimization)

**Purpose:** Full system review and debug pass. Use this as a checklist for future releases.

---

## 0. User flows (v2)

| Flow | Path | Notes |
|------|------|-------|
| **Public → Get membership** | `/` → “Get membership” → `/sign-in?next=/join` → auth → `/join` | Preselected venue preserved via `next=/join?venue=slug` (encoded). |
| **Public → Sign in** | `/` → “Sign in” → `/sign-in` → auth → `/dashboard` | Default post-login is dashboard. |
| **Dashboard (no membership)** | `/dashboard` → “Get membership” → `/join` | Empty state CTA. |
| **Join (allowed users)** | `/join` → “Grant me membership” → POST grant → `/dashboard?granted=ok` (via set-venue when next=/dashboard) | Grant API supports `?next=/dashboard` or `?next=/admin`. |
| **Admin** | Dashboard sidebar “Admin” (if in INTERNAL_DEMO_USER_IDS) → `/admin` | Grant, demo reset; demo-reset redirects to `/admin?reset=ok`. |
| **Internal demo** | `/internal/demo` — venue picker + wallet links; admins see link to `/admin` | No longer default post-login; manage-access moved to Admin. |

**Auth callback:** Default `next` = `/dashboard`. Reads `next` from URL or `AUTH_NEXT_COOKIE`; path must start with `/` and not `//`.

---

## 1. Auth flow

| Item | Status | Notes |
|------|--------|------|
| Sign-in sets `AUTH_NEXT_COOKIE` and passes `next` in callback URL | ✓ | Single source: `@/lib/constants` |
| Callback reads `next` from URL or cookie, rejects `//` and non-path | ✓ | |
| Callback clears `AUTH_NEXT_COOKIE` after reading | ✓ | |
| Callback redirect origin | ✓ | Uses `getOrigin(request)` with `x-forwarded-host` / `x-forwarded-proto` (same as set-venue) |
| Logout uses `createServerSupabase(cookieStore)` (writable) and redirects to `NEXT_PUBLIC_SITE_URL` | ✓ | |
| Sign-in page: `useSearchParams` wrapped in Suspense | ✓ | Avoids prerender bailout |

---

## 2. Venue state

| Item | Status | Notes |
|------|--------|------|
| Single cookie: `CURRENT_VENUE_COOKIE` | ✓ | Constant in `@/lib/constants` |
| set-venue: validates slug with `VENUE_SLUG_REGEX` + `VENUE_SLUG_MAX_LENGTH` | ✓ | Invalid or empty → delete cookie |
| set-venue: redirect origin uses x-forwarded-host when present | ✓ | |
| Home layout: venues from DB or `FALLBACK_VENUES` | ✓ | |
| Dashboard/membership: current venue from cookie; display names from `venueDisplayName` / `withDisplayNames` | ✓ | |
| Pilot slugs / fallback list | ✓ | `PILOT_VENUE_SLUGS`, `FALLBACK_VENUES` in constants; demo-grant and internal demo use `PILOT_VENUE_SLUGS[0]` |

---

## 3. Server Supabase and env

| Item | Status | Notes |
|------|--------|------|
| All server usage goes through `createServerSupabase(cookieStore, readOnly?)` | ✓ | `@/lib/supabase-server` |
| Layouts/pages that only read session use `readOnly: true` | ✓ | |
| Route handlers and Server Actions that set cookies use `readOnly: false` (default) | ✓ | |
| Missing env throws a clear error | ✓ | `createServerSupabase` checks `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

---

## 4. Dashboard, membership, verify

| Item | Status | Notes |
|------|--------|------|
| Dashboard layout: venues from memberships + venue_staff, filtered by is_demo unless internal | ✓ | |
| Dashboard page: “View pass & QR” links to `/membership?venue=<slug>` | ✓ | |
| Membership: prefers `?venue=` over cookie for display; venue list from DB or `FALLBACK_VENUES` | ✓ | |
| Verify: Server Action uses writable Supabase; page uses readOnly | ✓ | |
| Verify: valid result tier | ✓ | `membership.tier ?? "Member"` so null tier does not show "null" |
| Verify: staff record from `venue_staff` with `.limit(1)`; membership with `.maybeSingle()` | ✓ | No `.single()` that can throw |

---

## 5. Internal demo, Admin, Join, and API routes

| Item | Status | Notes |
|------|--------|------|
| demo-grant: auth via getSession; venue fallback order slug → PILOT_VENUE_SLUGS[0] → is_demo → first row | ✓ | Supports `?next=`; when next is `/dashboard`, redirects via set-venue to set cookie. |
| demo-reset: service role for RPC; redirect to `/admin?reset=ok` | ✓ | |
| Admin `/admin`: auth required; only INTERNAL_DEMO_USER_IDS; else redirect to `/dashboard` | ✓ | |
| Join `/join`: auth required; else redirect to `/sign-in?next=` with encoded path (e.g. `/join?venue=slug`) | ✓ | |
| Wallet routes: createServerSupabase readOnly; no cookie write needed | ✓ | |

---

## 6. Stripe and Edge

| Item | Status | Notes |
|------|--------|------|
| Next.js `/api/stripe/webhook` returns 410 | ✓ | Stripe is handled only by Supabase Edge Function |
| Edge function: idempotency on `event_id`; uses `status`, `stripe_subscription_id`, `expires_at` on memberships | ✓ | Matches migrations |

---

## 7. Fixes applied in this pass (original)

1. **Auth callback origin** — Redirect after magic link now uses `x-forwarded-host` and `x-forwarded-proto` when present, so it works behind a reverse proxy (same pattern as set-venue).
2. **Verify tier** — Valid result uses `membership.tier ?? "Member"` so a null DB tier does not render as "null".
3. **createServerSupabase** — Throws a clear error if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing instead of passing `undefined` into the client.

---

## 8. Fixes applied in full system review (Feb 2025)

1. **Join → sign-in redirect** — Preserve preselected venue when sending unauthenticated users to sign-in: use `next=${encodeURIComponent("/join?venue=...")}` so callback redirects to `/join?venue=slug` (was incorrectly building `/sign-in?next=/join?venue=...`, which drops the venue from `next`).
2. **Venue metrics** — Replaced `venue_staff` query `.single()` with `.limit(1)` and `currentUserStaff?.[0]` so users who are staff at multiple venues do not hit a Supabase “multiple rows” error; metrics page shows the first staff venue.

---

## 9. Optional / future

- **Auth callback:** Consider reading redirect base from `NEXT_PUBLIC_SITE_URL` when behind a proxy instead of `request.url` / headers, if you need a single canonical origin.
- **.env.example:** Add `SUPABASE_SERVICE_ROLE_KEY` (for demo-reset) and optional `QR_SIGNING_SECRET`, `STRIPE_*`, and Edge secrets if you want the example to document all optional features.
- **Venue metrics:** If staff at multiple venues, consider venue switcher or `?venue=` so user can pick which venue’s metrics to view.

---

## 10. Build and routes

- `npm run build` — all routes compile; no TypeScript errors.
- Routes: `/`, `/sign-in`, `/dashboard`, `/membership`, `/join`, `/admin`, `/internal/demo`, `/verify`, `/venue/metrics`, `/auth/callback`, `/auth/logout`, `/api/set-venue`, `/api/internal/demo-grant-membership`, `/api/internal/demo-reset`, `/api/wallet/apple`, `/api/wallet/google`, `/api/stripe/webhook`.

*Last updated: full system review Feb 2025.*

# Membership access: reset, get it, manage it (CEO / admin)

**Common errors:**  
- **"record \"new\" has no field \"tier_id\""** — A trigger on `memberships` references `tier_id`; we use `tier` (text). See **supabase/FIX-TIER-ID-TRIGGER.md** to find and drop/fix the trigger in Supabase.  
- **"Reset failed: memberships_user_id_fkey"** — The old reset tried to insert seed rows with fake user UUIDs that don’t exist in your Auth. Run the migration **20250210140000_reset_demo_delete_only.sql** so reset only deletes (no inserts); then use **Grant membership** to get your access back.

## How to get membership access (as CEO or yourself)

1. **Sign in** (Google, Facebook, or email magic link) so you have a Supabase Auth user.
2. **Get your user ID:** Supabase Dashboard → **Authentication** → **Users** → click your user → copy the **UID** (UUID).
3. **Either:**

   **Option A — Supabase Table Editor (no env)**  
   - **Table Editor** → **memberships** → **Insert row**.  
   - Set `user_id` = your UID, `venue_id` = the venue’s UUID (from **venues** table), `tier` = `founder` (or `vip` / `supporter`), `status` = `active`.  
   - Save. You now have membership at that venue.

   **Option B — App “grant” API (requires env)**  
   - In `.env.local` set **INTERNAL_DEMO_USER_IDS** = your user UUID (comma-separated if multiple).  
   - While signed in, POST to **Grant membership** for a venue (see “Admin” below) or call:
     - `POST /api/internal/demo-grant-membership` (default: first pilot venue)
     - `POST /api/internal/demo-grant-membership?venue=the-starry-plough` (or `the-function-sf`)
   - You get an active Founder membership at that venue.

4. **Staff / verify access (optional):** To use **Verify** or **Venue metrics**, add yourself to **venue_staff**: Table Editor → **venue_staff** → Insert row with your `user_id`, `venue_id`, `role` = `owner` (or `staff` / `manager`).

---

## How to reset membership access

**“Reset” can mean:** (1) Wipe and re-seed **demo** data only. (2) Revoke or change a specific person’s membership.

### 1. Reset demo data (memberships + verification events for demo venues only)

- **From the app (if allowed):** Sign in as a user whose UID is in **INTERNAL_DEMO_USER_IDS**. Open **Admin** from the dashboard sidebar (or go to `/admin`), then use **Run demo reset**.  
- **Or call the API:** `POST /api/internal/demo-reset` (same auth: your user must be in INTERNAL_DEMO_USER_IDS). Requires **SUPABASE_SERVICE_ROLE_KEY** in env.  
- **Or in Supabase:** SQL Editor → run `SELECT reset_demo();` (with a role that can execute it, e.g. service role).

After reset, demo-venue memberships and verification events are **deleted** (no seed data is inserted). Use **Grant membership** again to get your own access.

### 2. Revoke or change one person’s membership

- **Supabase** → **Table Editor** → **memberships**.  
- Find the row (e.g. by `user_id` or `venue_id`).  
- Edit **status** to `expired` or `revoked`, or delete the row to remove access.

---

## How to manage it as CEO (day to day)

- **Today:** Use **Supabase Dashboard** (Table Editor) to:
  - **memberships:** add/remove rows, change `tier` or `status`.
  - **venue_staff:** add/remove staff, change `role` (staff, manager, owner).
  - **venues:** view or edit venues (names, slugs, etc.).

- **App-side (Admin):** If **INTERNAL_DEMO_USER_IDS** includes your user ID, you get an **Admin** link in the dashboard sidebar. Open **Admin** (`/admin`) to:
  - **Grant membership** (The Function SF / The Starry Plough) — gives you (or any allowed user) an active Founder membership at that venue.
  - **Run demo reset** — runs the demo reset above.

You can also use **Get membership** (`/join`) to grant yourself membership (same allowed users). A fuller admin UI (list all members, venues, bulk actions) can be added later.

# Supabase & SQL — direct workflow

Use this instead of asking a middleman. Everything you need to run SQL and manage the DB is here.

---

## 1. Run SQL (one-off queries or scripts)

**Supabase Dashboard → your project → SQL Editor**

- URL: `https://supabase.com/dashboard/project/<your-project-ref>/sql/new`
- Paste any SQL and click **Run**.
- Use this for: inspecting data, one-off fixes, running a migration file by hand.

No CLI or env needed; you're already logged in.

---

## 2. Apply migrations

**Option A — CLI (all pending migrations)**

```bash
cd /path/to/coteri
supabase link    # once: project ref + DB password
supabase db push
```

Applies every migration in `supabase/migrations/` that hasn’t been applied yet. No way to push “only one” migration.

**If `db push` fails with 403 (e.g. "Your account does not have the necessary privileges")**

- Set the DB password when linking: `SUPABASE_DB_PASSWORD=your-db-password supabase link` (or add it when prompted).
- Or skip CLI and use **Option B** below to run the migration SQL by hand in the Dashboard.

**Option B — Manual (copy/paste in SQL Editor)**

1. Open **Dashboard → SQL Editor** (see above).
2. Open the migration file you need from `supabase/migrations/` (e.g. a venue or membership migration).
3. Copy contents → paste in SQL Editor → **Run**.

For a bundled “newer” set of changes, use **`supabase/run_new_migrations_manual.sql`** or **`supabase/migrations/run_new_venue_intelligence_manual.sql`** the same way.

---

## 3. Key tables and views (for writing SQL)

| Name | Purpose |
|------|--------|
| `public.venues` | Venues (id, name, slug, is_demo, branding) |
| `public.memberships` | user_id, venue_id, tier, status, expires_at |
| `public.venue_staff` | Staff per venue (user_id, venue_id) |
| `public.venue_scan_events` | Scans at door (venue_id, user_id, membership_id, scan_result) |
| `public.verification_events` | Verification audit log |
| `public.venue_tier_benefits` | Tier benefits per venue |
| `public.venue_transactions` | Purchases (e.g. drinks) |
| `public.venue_redemptions` | Reward redemptions |
| (optional) `public.csv_imports`, `csv_import_rows`, `csv_import_positions`, `ingest_providers` | **Not used by COTERI.** Belong to journal-os project; migrations may exist in repo for reference. |

**Views (read-only):** `venue_staff_verification_metrics`, `venue_scan_fraud_ratios`, etc. (see pilot data layer migrations). If CSV migrations were applied: `csv_import_positions` view has `security_invoker = on`; RLS on `csv_imports` applies. COTERI does not read these tables.

---

## 4. Demo / reset data

- **Reset demo** (memberships + verification_events for demo venues): run **`supabase/reset_demo.sql`** in SQL Editor, then **`supabase/seed_demo.sql`** if you want seed data.
- Or call the RPC (if migration applied): `SELECT reset_demo();` then run the seed script.

---

## 5. Connection details (for CLI or app)

- **Project ref**: Supabase Dashboard → Project Settings → General.
- **DB password**: Set in Dashboard (or when you first linked); used by `supabase link` and `.env`.
- **App env**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and optional `SUPABASE_SERVICE_ROLE_KEY` for backend). No need to open these just to run SQL in the Dashboard.

---

## 6. Where things live in this repo

| What | Where |
|------|--------|
| Migrations (schema changes) | `supabase/migrations/*.sql` |
| Manual “run in SQL Editor” bundle | `supabase/run_new_migrations_manual.sql`, `supabase/migrations/run_new_venue_intelligence_manual.sql` |
| Demo reset + seed | `supabase/reset_demo.sql`, `supabase/seed_demo.sql` |
| How migrations work | `supabase/MIGRATIONS.md` |
| Table semantics | `supabase/DATA-TABLES.md` |

Use the **Dashboard SQL Editor** for ad‑hoc SQL; use **migrations + push or manual run** for schema changes you want to keep in the repo.

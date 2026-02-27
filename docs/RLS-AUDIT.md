# RLS audit — quick checks

**Purpose:** Periodically confirm RLS and permissions so anon cannot read sensitive tables and users only see their own data. See SYSTEMS-AUGMENTATIONS (RLS scanner).

---

## 1. Anon cannot read webhook events

If RLS is enabled on `stripe_webhook_events`, the anon key must not return rows.

**In Supabase SQL Editor** (or with anon key from app):

```sql
-- As anon (e.g. use anon key in a client or run in Dashboard with role anon if possible):
-- Expected: 0 rows or permission denied
SELECT * FROM public.stripe_webhook_events LIMIT 1;
```

If using Dashboard SQL Editor, it runs as the project role; to simulate anon you’d use a small script or Supabase client with anon key. In practice: ensure RLS policies on `stripe_webhook_events` deny SELECT to anon; service role can still read for admin/replay.

---

## 2. Users only see own CSV imports (optional / journal-os)

**Note:** COTERI does not use CSV/positions. The tables below belong to the journal-os project. If your Supabase project was also used for journal-os, you can run these checks.

RLS on `csv_imports` (and thus `csv_import_rows` via FK) should restrict to `auth.uid() = user_id`.

**Check policies (as project owner):**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('csv_imports', 'csv_import_rows')
ORDER BY tablename;
```

**Semantic check:** As a signed-in user, the app should only return their own rows from `csv_import_positions` (view uses `security_invoker = on` and underlying `csv_imports` RLS). Manually: insert a row with another user’s `user_id` and confirm the first user cannot see it via the view.

---

## 3. View `csv_import_positions` (optional / journal-os)

Not used by COTERI. The view has `security_invoker = on`; RLS on `csv_imports` is sufficient. See migration `20250212110000_csv_imports_row_count_and_view.sql` if applicable.

---

## Checklist

- [ ] RLS on `stripe_webhook_events` denies anon SELECT (or table not used in production).
- [ ] (Optional) RLS on `csv_imports` restricts to `auth.uid() = user_id` if that project uses CSV ingest.
- [ ] (Optional) `csv_import_positions` view has `security_invoker = on` if used.

---

*See also: `docs/SUPABASE-SQL-RUNBOOK.md`, `docs/SYSTEMS-AUGMENTATIONS.md` (RLS scanner).*

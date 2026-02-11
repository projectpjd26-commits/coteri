# Supabase RLS Hardening — Audit + Migration

**Scope:** `stripe_webhook_events`, `membership_verifications`, and any membership/subscription/stripe tables.  
**Constraints:** Do not break `stripe_webhook` Edge Function (SERVICE_ROLE); no URL/secret changes; no downtime.

---

## 1) Audit report (run Step A first, then fill)

Run the **Discovery + current state** SQL below in Supabase SQL Editor. Use the results to fill this section.

| Table | In `information_schema`? | RLS enabled? | Public SELECT? | Public INSERT/UPDATE? | Existing policies |
|-------|---------------------------|--------------|----------------|------------------------|-------------------|
| `public.stripe_webhook_events` | _from discovery_ | _from check_ | _from privileges_ | _from privileges_ | _from pg_policies_ |
| `public.membership_verifications` | _from discovery_ | _from check_ | _from privileges_ | _from privileges_ | _from pg_policies_ |
| _other discovered tables_ | … | … | … | … | … |

**Summary:**

- **Tables public/exposed:** _list tables that currently grant SELECT/INSERT/UPDATE to `public` or `anon`._
- **RLS disabled:** _list tables where `relrowsecurity = false`._
- **Policies that exist:** _list policy names and roles (e.g. "Allow anon insert on stripe_webhook_events")._

---

## 2) Step A — Discovery + current state (run this first)

Run in **Supabase SQL Editor** (Project → SQL Editor). This discovers membership-related tables and current RLS/privileges.

```sql
-- ========== DISCOVERY: tables matching membership / verification / subscription / stripe ==========
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relkind = 'r' AS is_table
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND (
    c.relname ILIKE '%membership%'
    OR c.relname ILIKE '%verification%'
    OR c.relname ILIKE '%subscription%'
    OR c.relname ILIKE '%stripe%'
  )
ORDER BY 1, 2;

-- ========== CURRENT RLS STATE ==========
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stripe_webhook_events', 'membership_verifications')
  OR tablename ILIKE '%membership%'
  OR tablename ILIKE '%verification%'
  OR tablename ILIKE '%subscription%'
  OR tablename ILIKE '%stripe%'
ORDER BY tablename;

-- ========== CURRENT PRIVILEGES (public role) ==========
SELECT
  grantee,
  table_schema,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('public', 'anon', 'authenticated')
  AND (table_name IN ('stripe_webhook_events', 'membership_verifications')
       OR table_name ILIKE '%membership%'
       OR table_name ILIKE '%verification%'
       OR table_name ILIKE '%subscription%'
       OR table_name ILIKE '%stripe%')
GROUP BY grantee, table_schema, table_name
ORDER BY table_name, grantee;

-- ========== EXISTING POLICIES ==========
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL AS has_using,
  with_check IS NOT NULL AS has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (tablename IN ('stripe_webhook_events', 'membership_verifications')
       OR tablename ILIKE '%membership%'
       OR tablename ILIKE '%verification%'
       OR tablename ILIKE '%subscription%'
       OR tablename ILIKE '%stripe%')
ORDER BY tablename, policyname;
```

---

## 3) Migration SQL (one block, copy/paste)

**Prereqs:** Tables `public.stripe_webhook_events` and `public.membership_verifications` exist.  
**Assumption:** `membership_verifications` has a column linking to auth (e.g. `user_id` UUID matching `auth.uid()`). If your column is different (e.g. `member_id`, `auth_user_id`), replace `user_id` in the policy below.  

**Optional — find the user column:**  
`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'membership_verifications' AND column_name IN ('user_id', 'member_id', 'auth_user_id', 'id');`

- Enables RLS on both tables.
- Revokes public/anon/authenticated from both; service_role keeps full access (bypasses RLS).
- No policies on `stripe_webhook_events` → only service_role can read/write (Edge Function).
- One policy on `membership_verifications`: authenticated users can only SELECT their own row(s).

```sql
-- ========== RLS HARDENING MIGRATION ==========
-- Run in Supabase SQL Editor. Service role (Edge Function) is unchanged.

BEGIN;

-- 1) Enable RLS on target tables (safe; service_role bypasses RLS)
ALTER TABLE IF EXISTS public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.membership_verifications ENABLE ROW LEVEL SECURITY;

-- 2) Revoke default public privileges (stops anonymous and anon-key access)
REVOKE ALL ON public.stripe_webhook_events FROM public;
REVOKE ALL ON public.stripe_webhook_events FROM anon;
REVOKE ALL ON public.stripe_webhook_events FROM authenticated;

REVOKE ALL ON public.membership_verifications FROM public;
REVOKE ALL ON public.membership_verifications FROM anon;

-- 3) Grant only what authenticated users need: SELECT on membership_verifications (own rows only)
GRANT SELECT ON public.membership_verifications TO authenticated;

-- 4) Policy: authenticated users may only read their own membership_verifications row(s)
--    Adjust "user_id" to your column name (e.g. member_id, auth_user_id) if different.
DROP POLICY IF EXISTS "membership_verifications_select_own" ON public.membership_verifications;
CREATE POLICY "membership_verifications_select_own"
  ON public.membership_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5) No policies on stripe_webhook_events => only service_role (Edge Function) can read/write

COMMIT;
```

**If `membership_verifications` uses a different user column:** before running, replace the last policy’s `user_id` with your column, e.g.:

```sql
USING (auth.uid() = member_id);
```

---

## 4) Rollback SQL (if something breaks)

Run only if you need to revert privileges and RLS to a permissive state (e.g. public SELECT for debugging). Restores previous default-like access; re-run the migration after fixing.

```sql
-- ========== ROLLBACK (restore broad access; use only if migration causes breakage) ==========

BEGIN;

-- Disable RLS
ALTER TABLE IF EXISTS public.stripe_webhook_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.membership_verifications DISABLE ROW LEVEL SECURITY;

-- Drop the policy we added
DROP POLICY IF EXISTS "membership_verifications_select_own" ON public.membership_verifications;

-- Restore default public grants (table owner can still do everything)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stripe_webhook_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membership_verifications TO anon, authenticated;

COMMIT;
```

---

## 5) Verification steps

**5.1) Confirm RLS and policies**

Run in SQL Editor:

```sql
-- RLS enabled on both
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('stripe_webhook_events', 'membership_verifications');

-- No SELECT for anon/public on stripe_webhook_events; authenticated has SELECT only on membership_verifications
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('stripe_webhook_events', 'membership_verifications')
  AND grantee IN ('public', 'anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- Policies
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('stripe_webhook_events', 'membership_verifications');
```

**5.2) Confirm no public read on `stripe_webhook_events`**

- In app or with a small script: create a Supabase client with **anon key** and run  
  `supabase.from('stripe_webhook_events').select('*').limit(1)`.  
- Expected: empty or RLS/permission error (no rows returned as “success”).

**5.3) Webhook still works (Edge Function)**

- Stripe Dashboard → Developers → Webhooks → send test event, or use Stripe CLI:  
  `stripe trigger payment_intent.succeeded` (or the event your function handles).
- In Supabase: Table Editor → `stripe_webhook_events`: new row(s) with status progression (e.g. received → success).
- No change to webhook URL or event flow; Edge Function uses service_role and continues to insert/update.

**5.4) Authenticated “own row” (optional)**

- Log in as a user; from app or script with that user’s session, run  
  `supabase.from('membership_verifications').select('*')`.  
- Expected: only rows where `user_id = auth.uid()` (or your chosen column).

---

## Summary

| Table | RLS | Public/anon | Authenticated | Service role (Edge Function) |
|-------|-----|-------------|---------------|------------------------------|
| `stripe_webhook_events` | Enabled | No access | No access | Full (bypasses RLS) |
| `membership_verifications` | Enabled | No access | SELECT own row only | Full (bypasses RLS) |

This keeps `stripe_webhook_events` non-public, preserves Edge Function write capability, and limits authenticated access to “own” membership verification data.

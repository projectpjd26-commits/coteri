# Fix: "record \"new\" has no field \"tier_id\""

This error appears when **Grant membership** (or any insert/upsert into `memberships`) runs. A **trigger** (and its **function**) on `public.memberships` references a column **`tier_id`**. Our schema uses **`tier`** (text), not `tier_id`. You must **drop both the trigger and the function** for the error to go away.

## Quick fix (recommended)

Run this in **Supabase → SQL Editor** in one go:

```sql
-- 1) Drop the trigger first (it depends on the function)
DROP TRIGGER IF EXISTS set_memberships_updated_at ON public.memberships;

-- 2) Drop the function that references tier_id
DROP FUNCTION IF EXISTS public.set_memberships_updated_at();
```

Then try **Grant membership** again. If your trigger or function has a different name, use step 1 below to find it, then drop that trigger and its function.

---

## If the error persists: find and drop any other trigger/function

**1. List triggers on `memberships`:**

```sql
SELECT tgname AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'memberships' AND NOT t.tgisinternal;
```

**2. For each trigger name, drop trigger then its function.** Example for a trigger named `my_trigger` that uses function `my_function()`:

```sql
DROP TRIGGER IF EXISTS my_trigger ON public.memberships;
DROP FUNCTION IF EXISTS public.my_function();
```

To find which function a trigger uses:

```sql
SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'your_trigger_name';
```

**3. Or find all functions that reference `tier_id`:**

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_definition LIKE '%tier_id%';
```

Drop each such function (and its trigger on `memberships` if any).

---

## Nuclear option: drop every trigger on memberships + every function with tier_id

If the error **still** appears after the quick fix, run this **whole block** in **Supabase → SQL Editor**. It drops every non-internal trigger on `public.memberships` and every `public` function whose definition contains `tier_id`. (Uses a temp table to avoid PL/pgSQL issues with `pg_get_functiondef` in a `FOR` loop.)

```sql
DO $$
DECLARE
  r RECORD;
  func_oid oid;
BEGIN
  -- Drop all (non-internal) triggers on public.memberships
  FOR r IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'memberships' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.memberships', r.tgname);
  END LOOP;

  -- Drop every public function that references tier_id (loop over a temp table to avoid planner issues)
  DROP TABLE IF EXISTS _tier_id_funcs;
  CREATE TEMP TABLE _tier_id_funcs (oid oid);
  INSERT INTO _tier_id_funcs (oid)
  SELECT p.oid
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE '%tier_id%';

  FOR func_oid IN SELECT _tier_id_funcs.oid FROM _tier_id_funcs
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s', func_oid::regprocedure);
  END LOOP;
END $$;
```

Then try **Grant membership** again.

---

## Manual cleanup (if nuclear script still doesn’t fix it)

Run these in **Supabase → SQL Editor** and then run every line they return.

**1. Get DROP statements for every trigger on `memberships` (any schema):**

```sql
SELECT format('DROP TRIGGER IF EXISTS %I ON public.memberships;', t.tgname) AS run_this
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'memberships' AND NOT t.tgisinternal;
```

Run each `run_this` row in the same project your app uses.

**2. Get DROP statements for every function whose definition contains `tier_id`:**

```sql
SELECT format('DROP FUNCTION IF EXISTS %s;', p.oid::regprocedure) AS run_this
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND pg_get_functiondef(p.oid) LIKE '%tier_id%';
```

Run each `run_this` row.

**3. Confirm no triggers are left:**

```sql
SELECT t.tgname FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'memberships' AND NOT t.tgisinternal;
```

This should return **0 rows**. If it still returns rows, run the DROP TRIGGER from step 1 for each name. If it returns 0 rows and you still see the error, the app may be using a **different Supabase project** (check `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` matches the project where you ran the SQL).

---

## Migration

A migration that drops `set_memberships_updated_at` trigger and function is in **`supabase/migrations/20250210150000_fix_memberships_tier_id_trigger.sql`**. If you use `supabase db push` or run new migrations, that fix will be applied. Otherwise run the Quick fix SQL above manually in the SQL Editor.

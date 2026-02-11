# Running migrations

Supabase does **not** support “push only this migration.” You have two options.

## Option 1: Push all pending migrations (CLI)

From the project root, with the Supabase CLI installed and the project linked:

```bash
supabase link   # if you haven’t already (project ref + DB password)
supabase db push
```

This applies **every migration that hasn’t been applied yet** on the linked remote project. Already-applied migrations are skipped automatically. So “only the new ones” run.

There is no flag to push a single migration file; the CLI only supports “push all pending.”

## Option 2: Run the new migrations manually (SQL Editor)

If you don’t use the CLI or prefer to run SQL yourself:

1. Open **Supabase Dashboard** → your project → **SQL Editor**.
2. Open **`supabase/run_new_migrations_manual.sql`** in this repo.
3. Copy its contents, paste into the SQL Editor, and run it.

That file contains the three newer changes (scan-events RLS, `venue_transactions`, `venue_redemptions`) in one script. It’s idempotent, so safe to run more than once.

If you’ve already applied some of these via `db push`, running the manual script again is still safe (CREATE IF NOT EXISTS, DROP POLICY IF EXISTS, etc.).

# CSV ingest migrations — per-environment checklist

**Note:** CSV/positions ingest is **not used by COTERI**. This checklist and the referenced migrations belong to the **journal-os** project. Kept here only for reference if migrations were previously applied to a shared Supabase project.

---

## Required order (run in this sequence)

| Order | File | Purpose |
|-------|------|--------|
| 1 | `supabase/migrations/20250212100000_csv_imports.sql` | Creates `csv_imports`, `csv_import_rows`; RLS. |
| 2 | `supabase/migrations/20250212110000_csv_imports_row_count_and_view.sql` | Row-count trigger; `csv_import_positions` view. |
| 3 | `supabase/migrations/010_robinhood_csv_provider.sql` | Only if using Robinhood CSV provider (adds `ingest_providers` row). |
| 4 | `supabase/migrations/011_fidelity_csv_provider.sql` | Only if using Fidelity CSV provider (adds `ingest_providers` row). |

**How to run:** Supabase Dashboard → SQL Editor. Open each file, copy contents, Run. Or use `supabase link` + `supabase db push` to apply all pending migrations.

---

## Per-environment tick-off

- [ ] **Local / dev** — Applied 1, 2; 3–4 if using Robinhood/Fidelity.
- [ ] **Staging** — Applied 1, 2; 3–4 if using Robinhood/Fidelity.
- [ ] **Production** — Applied 1, 2; 3–4 if using Robinhood/Fidelity.

**Optional seed:** After migrations, to load initial positions for first user, run `supabase/seed_consolidated_positions.sql` once. See `docs/SUPABASE-SQL-RUNBOOK.md`.

---

*See also: `docs/SUPABASE-SQL-RUNBOOK.md`, `docs/PRE-PRODUCTION-CHECKLIST.md` §2.*

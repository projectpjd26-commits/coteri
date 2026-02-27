# Backup & restore — Supabase

**Purpose:** Document backup and restore options for production Supabase data. Use before go-live and when defining RTO/RPO.

---

## 1. Daily backups (Pro and above)

- **Included:** Pro plan and above get **daily** database backups.
- **Where:** Supabase Dashboard → **Project Settings → Backups** (or **Database → Backups**).
- **Retention:** Depends on plan; typically 7 days for Pro.
- **Restore:** Dashboard → Backups → choose a backup → **Restore**. Restore can create a new project or replace current (see Supabase docs for current UI).

---

## 2. Point-in-Time Recovery (PITR)

- **When:** You need recovery to a specific second (e.g. before an accidental DELETE).
- **Requirement:** Pro plan, PITR add-on enabled (Dashboard → Add-ons). Not available in all regions.
- **How:** Dashboard → **Database → Backups** (or PITR section) → choose date/time → restore to new project or (if supported) in-place.
- **Docs:** [Point-in-Time Recovery](https://supabase.com/docs/guides/platform/backups), [Manage PITR usage](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery).

---

## 3. Restore to a new project

- Restoring (daily or PITR) **to a new project** clones DB and config; **Auth and Storage may need manual reconfiguration** (e.g. redirect URLs, keys).
- After restore: update app env (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.) to the new project if you switch.

---

## 4. Checklist before production

- [ ] Confirm backup schedule and retention for your plan (Dashboard → Backups).
- [ ] If RPO < 24h is required, consider PITR add-on.
- [ ] Document who can trigger a restore and where (Dashboard access, team runbook).
- [ ] After any restore to a new project: update env, Supabase Auth URL config, and run smoke tests.

## 5. Optional: test restore (PITR or backup verification)

Run a test restore (e.g. to a new project) **once** to validate the process. Document the steps and duration in your runbook. See Supabase docs for “Restore to a new project.” After restore, verify app env and Auth URLs point to the new project and run smoke tests (sign-in, redirects).

**Checklist:** [ ] Run one test restore; document date, duration, and any issues (e.g. in this runbook or PRE-PRODUCTION-CHECKLIST).

---

*See also: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups), [Clone project](https://supabase.com/docs/guides/platform/clone-project).*

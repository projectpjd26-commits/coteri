# Troubleshooting

## `npm run dev` — fetch failed / ENOTFOUND supabase.co

**Symptom:** `TypeError: fetch failed` with `getaddrinfo ENOTFOUND <something>.supabase.co` (and often `AuthRetryableFetchError`).

**Cause:** The app cannot resolve the Supabase hostname. Usually the URL in `.env.local` is wrong, the Supabase project no longer exists, or **the project was paused** (free tier pauses after ~7 days of inactivity).

### If the project was paused (inactivity)

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Find the project (it may show as **Paused** or **Inactive**).
3. Open the project and click **Restore project** (or **Resume**). Wait until it’s fully back up.
4. Use the same **Project URL** in `.env.local` (it doesn’t change). Restart dev: `npm run dev`.

### If the URL is wrong or project was deleted

1. **Get the correct URL from Supabase**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
   - Go to **Project Settings** (gear) → **API**.
   - Copy **Project URL** (e.g. `https://abcdefghijk.supabase.co` — no trailing slash).

2. **Update `.env.local`**
   - Set `NEXT_PUBLIC_SUPABASE_URL` to that exact URL.
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the **anon public** key from the same API page.
   - Restart the dev server: stop `npm run dev` (Ctrl+C) and run `npm run dev` again.

3. **If you created a new project**
   - The project reference (the subdomain before `.supabase.co`) changes. Old URLs from a deleted or replaced project will return ENOTFOUND. Use the URL from the current project’s API settings.

4. **Check network**
   - From a terminal: `curl -sI https://YOUR-PROJECT-REF.supabase.co` (replace with your real ref). If this fails, you have a network or DNS issue (VPN, firewall, or offline).

---

## Missing env / "Missing NEXT_PUBLIC_SUPABASE_URL"

- Copy `.env.example` to `.env.local` and fill in at least `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Restart the dev server after changing env (Next.js reads env at startup).

---

*See also: `docs/DEPLOY.md`, `docs/SUPABASE-SQL-RUNBOOK.md`, `CONTRIBUTING.md` (Env).*

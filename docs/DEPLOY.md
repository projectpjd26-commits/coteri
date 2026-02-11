# Deploy to Vercel

## TL;DR (push & redeploy)

1. **From project root** (e.g. `cd /Users/pboek/coteri` or open integrated terminal in Cursor).
2. **Stage & commit:**  
   `git add package.json package-lock.json` (or `git add .`)  
   `git commit -m "Deploy: add type module, update deps"`
3. **Push the branch Vercel builds from** (usually `main`):  
   `git push origin main`  
   (If you’re on another branch: `git checkout main`, `git merge <branch>`, then push.)
4. **Vercel** auto-redeploys. Check **Vercel → Deployments** for Building → Ready.
5. **Test:**  
   `https://<your-vercel-app>.vercel.app`  
   e.g. `https://<your-vercel-app>.vercel.app/membership?venue=the-function-sf`

**If push fails:**  
- `fatal: not a git repo` → run from project root.  
- `permission denied` → re-auth GitHub (Vercel/Git).  
- `no upstream branch` → `git push -u origin main`.  
- Merge conflicts → resolve, commit, then push.

---

## 1. Push your code

Make sure the project is in Git and pushed to GitHub (or GitLab/Bitbucket). Vercel will import from there.

## 2. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. **Add New Project** → import your **coteri** repo.
3. Leave **Framework Preset** as Next.js and **Root Directory** as `.` → **Deploy** (it may fail until env vars are set; that’s OK).

## 3. Environment variables

In the project on Vercel: **Settings → Environment Variables**. Add:

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Same as in `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Same as in `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Use the **actual** Vercel URL after first deploy (e.g. `https://coteri-xxx.vercel.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Needed for demo reset / admin |
| `INTERNAL_DEMO_USER_IDS` | (optional) Comma-separated user IDs | For admin / grant membership |

After adding **NEXT_PUBLIC_SITE_URL**, redeploy: **Deployments** → ⋮ on latest → **Redeploy**.

## 4. Supabase Auth redirect URLs

In **Supabase Dashboard** → **Authentication** → **URL Configuration**:

- **Site URL:** set to your Vercel URL, e.g. `https://coteri-xxx.vercel.app`
- **Redirect URLs:** add:
  - `https://coteri-xxx.vercel.app/auth/callback`
  - Keep `http://localhost:3000/auth/callback` for local dev

Use your real Vercel URL (with or without custom domain).

## 5. Share the link

Your membership page in production:

`https://your-app.vercel.app/membership?venue=the-function-sf`

Home: `https://your-app.vercel.app`  
Sign-in: `https://your-app.vercel.app/sign-in`

---

**Optional:** Custom domain in Vercel (Settings → Domains). Then set that as **Site URL** and add `https://yourdomain.com/auth/callback` in Supabase Redirect URLs.

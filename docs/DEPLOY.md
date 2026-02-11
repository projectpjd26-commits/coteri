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

## If you renamed the Vercel project (e.g. to “coteri”)

After renaming, the production URL changes (e.g. to `https://coteri.vercel.app`). Update these so auth and redirects keep working:

1. **Vercel → Project → Settings → Environment Variables**  
   - Set **`NEXT_PUBLIC_SITE_URL`** to the new URL, e.g. `https://coteri.vercel.app`.

2. **Supabase Dashboard → Authentication → URL Configuration**  
   - **Site URL:** change to the new URL (e.g. `https://coteri.vercel.app`).  
   - **Redirect URLs:** add `https://coteri.vercel.app/auth/callback` and remove the old project URL if it’s no longer used.

3. **Redeploy**  
   Vercel → Deployments → ⋮ on latest → **Redeploy** so the new env and Supabase config are used.

---

## Force alias assignment (recommended)

To make **coteri.vercel.app** point at a specific deployment (e.g. the latest production build):

1. **From repo root**, with [Vercel CLI](https://vercel.com/docs/cli) installed (`npm i -g vercel`):
   ```bash
   vercel alias set <deployment-url> coteri.vercel.app
   ```
2. **Get `<deployment-url>`** from Vercel → **Deployments** → copy the deployment URL (e.g. `coteri-kc5yt9qeb-phil-boekelheides-projects.vercel.app`).
3. **Example:**
   ```bash
   vercel alias set coteri-kc5yt9qeb-phil-boekelheides-projects.vercel.app coteri.vercel.app
   ```

Run this after each production deploy if you want the custom alias to always point at the latest deployment, or use Vercel’s default “Production” assignment from the main branch.

**If coteri.vercel.app shows “404: NOT FOUND”:**

1. **Vercel Dashboard → your project (e.g. coteri) → Settings → Domains**  
   - Confirm `coteri.vercel.app` is listed. If not, add it (Vercel usually adds it when the project name matches).
   - Ensure it’s assigned to **this** project and not another.

2. **Deployments**  
   - Open **Deployments** and check that the **latest production** deployment is **Ready** (green), not failed or cancelled.  
   - If the last prod build failed (e.g. build error), fix the build, push again, and wait for a new successful deployment.

3. **Assign production to the latest deployment**  
   - In **Deployments**, find the successful deployment you want to serve.  
   - Click the **⋮** menu → **Assign to Production** (or **Promote to Production**).  
   - That makes the project’s production domain(s), including `coteri.vercel.app`, point at that deployment.

4. **Optional: force alias via CLI**  
   - After a successful deploy, copy that deployment’s URL (e.g. `coteri-xxxxx-phil-boekelheides-projects.vercel.app`).  
   - Run: `vercel alias set <that-url> coteri.vercel.app`

**If 404 persists (Code: NOT_FOUND, ID: sfo1::...):**

- **Test the deployment URL:** Open the deployment URL (e.g. `https://coteri-e9qpkw07j-phil-boekelheides-projects.vercel.app/`) in a new tab. If that works but `coteri.vercel.app` does not, the domain is not bound to that deployment; re-assign (step 3) or remove and re-add the domain in **Settings → Domains**. If the deployment URL also 404s, check **Runtime Logs** for that deployment.
- **Production branch:** **Settings → Git** → set **Production Branch** to `main`. Otherwise deployments from `main` are Previews and the production domain serves an older or empty deployment.
- **Root Directory:** **Settings → General** → **Root Directory** must be empty or `.`.
- **Redeploy with cache cleared:** **Deployments** → **⋮** → **Redeploy** → enable **Clear build cache**, then assign the new deployment to Production.

---

## Resolved production issues (reference)

These were fixed in earlier deployments; the codebase is already updated.

| Issue | Cause | Fix in repo |
|-------|--------|-------------|
| **Supabase SSR** | `@supabase/auth-helpers-nextjs` exports missing/changed | All auth uses `@supabase/ssr` and `@/lib/supabase-server` / `@/lib/supabaseClient`; legacy package removed. |
| **Stripe webhooks** | Signature/body handling and header types on Vercel | Webhook uses `await req.text()` for raw body and `(await headers()).get('Stripe-Signature')`; Stripe API version and types aligned. |
| **Tailwind / middleware** | Custom middleware broke build; Tailwind v4 vs PostCSS mismatch | Root `middleware.ts` removed; `postcss.config.mjs` uses `@tailwindcss/postcss` only. |

---

**Optional:** Custom domain in Vercel (Settings → Domains). Then set that as **Site URL** and add `https://yourdomain.com/auth/callback` in Supabase Redirect URLs.

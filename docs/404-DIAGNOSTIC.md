# 404 on / and /favicon.ico — Diagnostic

## 1. Checklist results (repo)

| Check | Status | Location |
|-------|--------|----------|
| Root route | ✅ | `app/page.tsx` exists, exports default, calls `redirect("/sign-in")` |
| Root layout | ✅ | `app/layout.tsx` exists, renders `{children}` via DemoModeWrapper |
| vercel.json | ✅ None | No rewrites/proxy; no catch-all |
| Next.js middleware | ✅ None | No root `middleware.ts` or `src/middleware.ts` (only `src/lib/auth/middleware.ts` — helper, not framework middleware) |
| output: export | ✅ | Not set in next.config.ts/js |
| favicon | ⚠️ | `app/favicon.ico` exists (App Router serves it). No `public/favicon.ico` — add if favicon 404 persists |

## 2. Duplicate `app` directory (likely cause)

There are **two** App Router roots:

- **`/app/`** (root) — active: `page.tsx` → redirect to `/sign-in`, dashboard, sign-in, verify, etc.
- **`/src/app/`** — legacy: different `page.tsx` (Venue Membership Platform, links to `/login`, `/signup`), plus `login/`, `signup/`, `pricing/`, and duplicate API routes under `src/app/api/`.

Next.js is intended to use **one** app directory (either `app/` or `src/app/`, not both). Having both can confuse the build or runtime and lead to 404s if the wrong tree is used.

**Recommendation:** Remove or rename the duplicate so only one app root is used.

- **Option A (recommended):** Rename `src/app` to `src/app-legacy` (or delete if unused) so the build only sees root `app/`.
- **Option B:** If you intentionally want to use `src/app`, move root `app/` into `src/` and remove the current root `app/` (then you have a single `src/app/`).

## 3. Answers to your questions

- **App Router or Pages Router?** App Router only. All routes live under `app/` (and duplicate under `src/app/`).
- **Proxy rewrites?** No. There is no `vercel.json`; no proxy or rewrites. Only `/api/*` routes are under `app/api/`.

## 4. What to do next

1. **Resolve duplicate app (recommended):** Rename or remove `src/app` so only root `app/` is used, then redeploy.
2. **Vercel project settings:** **Settings → General** → **Root Directory** must be empty or `.` (not `src`).
3. **Local check:** From repo root run `npm run build && npm start`, then open `http://localhost:3000/`. If `/` works locally but 404 on Vercel, the duplicate app or Root Directory is the likely cause.
4. **Favicon:** If favicon still 404s after fixing routing, add `public/favicon.ico` (or ensure `app/favicon.ico` is present and valid).

## 5. No root middleware

There is no file at `middleware.ts` or `src/middleware.ts`. The only file named middleware is `src/lib/auth/middleware.ts`, which is a helper for API routes, not the Next.js edge middleware. So middleware is not blocking the root route.

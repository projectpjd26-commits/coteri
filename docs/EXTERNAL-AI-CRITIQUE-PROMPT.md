# External AI Critique Prompt — COTERI Layout, Design & Success

**Purpose:** Give this prompt (and referenced context) to an external AI or design reviewer to receive a structured critique of COTERI’s layout, design, color scheme, and whether the product achieves its stated goals.

---

## Instructions for the reviewer

You are a design and product critic. Your task is to evaluate the **COTERI** web application across layout, visual design, color scheme, accessibility, and **goal achievement** (does the product succeed at what it claims to do?). Assume you can inspect the live or built app (screenshots, dev server, or deployed URL) and the codebase (file paths below).

Provide your critique in these sections:

1. **Goal achievement** — Does the product achieve its stated goals? (See “Stated goals” below.) For each goal: met / partially met / not met, with brief evidence.
2. **Layout & information architecture** — Navigation clarity, hierarchy, consistency across pages (home, dashboard, verify, membership, join, admin). Mobile vs desktop. Any confusing or redundant flows.
3. **Visual design & color scheme** — Cohesion of palette (landing vs venue-themed dashboard vs verify). Contrast, readability, appropriateness for “membership infrastructure” and venue/staff use. Venue theming: do The Function SF vs The Starry Plough themes feel distinct and on-brand?
4. **UX & task success** — Can a member quickly find their pass/QR? Can staff verify at a glance (VALID/EXPIRED/INVALID)? Can an admin or venue owner complete core tasks without friction?
5. **Accessibility & inclusivity** — Color contrast (WCAG), focus states, screen-reader friendliness, high-brightness verify mode. Any obvious gaps.
6. **Consistency & polish** — Component reuse, spacing, typography, loading/error states. Anything that feels unfinished or inconsistent.
7. **Summary & top 3 recommendations** — One paragraph summary; then three prioritized, actionable improvements.

---

## Stated goals (evaluate against these)

- **Product:** “Membership and venue app. Venues have members (tiers: supporter, vip, founder). Members get a pass/QR; staff can verify at the door.” (Pilots: The Function SF, The Starry Plough.)
- **Tagline (home):** “The Operating System for Real-World Communities” — “Own your community. Verify access. Capture revenue.” “Unified membership infrastructure for physical venues — combining payments, identity, access control, and analytics.”
- **README:** “Venue Membership MVP” — Next.js membership platform with Supabase auth, Stripe payments, tier-based access; features: auth, Stripe, tiered membership, responsive design, RLS, “Modern UI with Tailwind CSS.”
- **Verify (staff):** Single-purpose scan; giant state banner (GREEN VALID / RED INVALID / ORANGE EXPIRED); secondary metadata small (Tier, Last scan, Venue); high-brightness mode for bright environments.

Treat these as the success criteria: does the UI and experience support these claims and use cases?

---

## Context to load (codebase)

If the reviewer has file access, these paths provide the relevant context. Reading them is optional but improves accuracy.

| Area | Paths |
|------|--------|
| **Project & goals** | `README.md`, `docs/PROJECT-STATE-AND-HANDOFF.md`, `docs/SYSTEM-REVIEW.md` |
| **Global styles & theming** | `app/globals.css` (root + `.venue-theme`, `.venue-theme-starry-plough`, verify/demo/banner keyframes) |
| **Root layout** | `app/layout.tsx` (metadata, body) |
| **Home / landing** | `app/page.tsx` (hero, CTAs, “How it works”, venue launcher) |
| **Dashboard** | `app/dashboard/layout.tsx` (sidebar, venue switcher, nav), `app/dashboard/page.tsx` (splash vs member view) |
| **Membership & pass** | `app/membership/page.tsx`, `src/components/membership/MembershipPass.tsx` |
| **Staff verify** | `app/verify/layout.tsx`, `app/verify/page.tsx`, `app/verify/verify-form.tsx` (or equivalent) |
| **Join / Admin** | `app/join/`, `app/admin/` (if present) |
| **Tailwind** | `tailwind.config.ts` (content paths, theme extensions) |

If the reviewer cannot read code, provide screenshots or a short written description of: (1) home page, (2) dashboard (venue owner and member views), (3) membership pass + QR, (4) verify screen (valid / invalid / expired), (5) one venue-themed dashboard (e.g. The Function SF vs The Starry Plough).

---

## Design system snapshot (for reference)

- **Landing:** Light/dark via `prefers-color-scheme`; `:root` `--background` / `--foreground`; hero uses slate, indigo/sky/emerald CTAs, gradient headline sweep, grain overlay.
- **Venue dashboard (default — The Function SF):** Dark theme; CSS vars: `--venue-bg`, `--venue-bg-elevated`, `--venue-sidebar-bg`, `--venue-text`, `--venue-text-muted`, `--venue-accent` (gold #d4a853), `--venue-secondary`, `--venue-success`; blurred stage background image.
- **The Starry Plough:** Green accent (`#5a8c69`), warm neutrals, blurred pub background (Unsplash).
- **Verify:** Full-screen form; result banner (valid=green, invalid=red, expired=orange); optional `.verify-high-brightness` for bright environments (white bg, dark text).
- **Fonts:** `--font-sans` (system UI), `--font-mono` (monospace). Tailwind default content paths include `app/`, `src/`.

---

## How to use this prompt

1. **Copy this entire document** (from “Instructions for the reviewer” through “Design system snapshot”).
2. **Append** either:  
   - “Here are screenshots: [attach],” or  
   - “The app is running at [URL]. Please assess using the criteria above,” or  
   - “Here are the contents of [file paths from the table].”
3. **Send** to an external AI (e.g. ChatGPT, Claude) or a human design reviewer.
4. **Use the structured output** (goal achievement, layout, color, UX, a11y, consistency, top 3 recommendations) to drive design and product improvements.

---

*Last updated: 2025-02-25. Align with `docs/PROJECT-STATE-AND-HANDOFF.md` and `docs/SYSTEM-REVIEW.md` for product and system context.*

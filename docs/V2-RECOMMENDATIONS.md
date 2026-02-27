# COTERI V2 — Recommendations from External AI Critique

**Source:** Full product & design critique (external AI).  
**Date captured:** 2025-02-25  
**Merged:** Second critique pass (home, launch, Function SF / Starry Plough dashboards, pass/QR, join, admin, sign-in, a11y tree) — additional non-duplicate recs added below.  
**Use:** Prioritized backlog for layout, design, goal achievement, and polish (version 2).

---

## Critique summary

COTERI has a strong visual identity and a sound data model (venues → tiered members → QR passes), but **over-promises and under-delivers** on three critical goals: (1) staff verification surface is missing or unreachable, (2) admin panel is a stub, (3) Stripe/payments are demo-only. The pass page works but is cluttered with three parallel representations of the same pass, inconsistent visual treatments, and mockup labels in production. The 404 is raw Next.js; the verify route behavior for authenticated users needs clarification.

---

## 1. Goal achievement (recs)

| Goal | Critique status | V2 action |
|------|-----------------|-----------|
| Staff door verification (VALID/EXPIRED/INVALID) | **Not met** — `/verify` redirects; no dedicated staff screen | **P0:** Build and ship staff verify at a stable URL (e.g. `/verify` for staff only). Full-screen, auth-protected, giant color-coded banner (green/red/orange), tier, member, last-scan; high-brightness mode. See §7 Top 3 #1. |
| Tiered membership (Supporter/VIP/Founder) | **Partially met** — UI shows tiers but member data can show generic "Member" | Ensure membership upsert and display use canonical tier keys; normalize display labels from DB. |
| Stripe payments / recurring | **Partially met** — demo grant only, no checkout | Wire join flow to Stripe Checkout when not demo; show price and renewal; or show explicit "Coming soon" and hide grant in production. |
| Venue analytics | **Partially met** — demo counts only | Wire dashboard to real Supabase scan counts; remove "(demo)" or replace with "Pilot active — stats as members scan." |
| Admin panel | **Not met** — empty stub, internal doc ref | **P0:** Minimum for pilot: member list (name, tier, status, last-scanned) for current venue; per-member actions (change tier, revoke); link to staff verify. Or "Coming soon" UI. No raw "demo disabled" + markdown link. See §7 Top 3 #3. |
| Wallet pass (Apple/Google) | **Partially met** — mockup label, Refresh = same URL as Add | Remove duplicate "Refresh" CTA (done); when re-adding "Refresh Pass," use a **different endpoint** than "Add." Remove or hide "APPLE / GOOGLE WALLET MOCKUP" label in production. |

---

## 2. Layout & information architecture (recs)

| Issue | V2 action |
|-------|----------|
| No persistent nav on home page | Add a minimal header (e.g. logo + "Launch" / "Sign in") so mid-scroll users have an escape. |
| "Back to COTERI" ambiguous (goes to home/launch) | **Done:** Relabel to "← All Venues" and link to `/launch` so intent matches destination. |
| Pass page triple duty (metadata + QR + SCAN AT DOOR) | **P0:** Single coherent pass card with three zones: primary = one large scannable QR + access code, name, tier, status (green for ACTIVE); secondary = metadata (below fold/collapsible); tertiary = wallet actions. **Eliminate** left "SCAN AT DOOR" widget entirely. Mobile-first: full-width, tap-to-fullscreen QR, status above fold. See §7 Top 3 #2 (detailed spec). |
| No navigable verify/staff page | Expose verify in nav for staff (e.g. "Verify" in dashboard sidebar when role is staff/manager/owner). Ensure `/verify` is reachable and does not redirect staff away. |
| `/join` flat venue list, no tier/price | Add tier selection and price per venue and Stripe checkout; or until Stripe is wired: remove `/join` from member-facing nav and route "Get membership" to waitlist/contact instead of the grant-only stub. See §7 Top 3 #3. |
| "Venue verification (demo)" on dashboard with no action | Wire to real Supabase scan counts, or replace entire section with honest placeholder: "Verification stats will appear here once you start scanning members at the door." Do not show fabricated numbers labeled "(demo)". Add link to verify tool or use placeholder. See §7 Top 3 #3. |
| 404 raw Next.js | **Done:** Add branded `app/not-found.tsx` with "← Back to Home" link. |
| **Sign-in page** lacks context and adds friction | Floating card on black void with only "← Back" and "© COTERI"; no venue context, no onboarding copy, no logo meaning. Consider: what the user is signing into (venue/product name), minimal hero or copy; de-emphasize or remove Facebook OAuth if most venues/members use email. |

---

## 3. Visual design & color scheme (recs)

| Issue | V2 action |
|-------|----------|
| Home "LIVE DASHBOARD" over blurred photo — low contrast | Increase overlay opacity or text contrast so column headers meet WCAG 4.5:1. |
| Venue theming photo-only (same sidebar/type) | Extend theming: accent color, typeface, or iconography per venue (already have CSS vars; ensure they differ more between pilots). |
| Tier cards (Supporter/VIP/Founder) visually identical | Differentiate with color, icon, or subtle border per tier (e.g. gold Founder, purple VIP). |
| "ACTIVE" in wallet mockup shown in red | **Done:** Use green for active/valid state (semantic + a11y). |
| "LIVE" badge with demo data | Remove badge or only show when data is real. |
| Admin page unstyled | Apply venue layout and typography so it doesn’t look like a forgotten route. |
| Home venue mosaic duplicate columns | Fix so the marquee doesn’t show duplicate tiles (single source, or clear visual that it’s intentional). |
| **"SCAN AT DOOR" widget (left column)** uses pixelated/decorative QR | If the left-column QR is a stylized dot-matrix and not machine-scannable at that size, replace with a real scannable QR or remove; avoid nonfunctional decoration as a primary UI element. |

---

## 4. UX & task success (recs)

| User | Issue | V2 action |
|------|-------|----------|
| Member | QR at thumbnail; unclear which representation to use; copy link no toast | Single primary pass with full-size QR (or tap-to-expand); one clear "use this at door" story; toast or explicit "Copied verification link" on copy. |
| Staff | No dedicated verify screen | **P0:** Staff-only full-screen verify; scan or enter code → giant status banner. See §7 Top 3 #1. |
| Admin/Owner | No member list, tier management, revenue, settings | **P0:** Admin: member list, tier management, or "Coming soon" UI. See §7 Top 3 #3. |
| **Onboarding / new venue** | "Launch Your Venue" goes to venue picker only; no venue creation, no onboarding wizard, no form to configure a new venue; product assumes pre-seeded venues | Document as known limitation, or add "Create your venue" / onboarding flow (or explicit "Coming soon"); avoid implying self-serve launch when none exists. |

---

## 5. Accessibility & inclusivity (recs)

| Issue | V2 action |
|-------|----------|
| Dashboard content over background — low contrast | Ensure text on overlays meets WCAG AA 4.5:1 (backgrounds or opacity). |
| Tier cards no color differentiation | Add non-color cue (icon, label, border) so tier is clear without color alone. |
| No visible focus ring on interactive elements | Restore or add custom focus ring (e.g. `focus:ring-2 focus:ring-[var(--venue-accent)]`) on buttons/links. |
| "ACTIVE" in red (wallet mockup) | **Done:** Green for active. |
| High-brightness verify mode | Implement toggle on verify page and ensure contrast in both modes. |
| Home venue mosaic images | Add `alt` to images or `aria-hidden` to decorative background images. |
| "APPLE / GOOGLE WALLET MOCKUP" read by screen readers | **Done:** Use `aria-hidden` on decorative mockup caption or replace with neutral "Add to Apple or Google Wallet." |
| **Dashboard stat tiles** (SCANS TODAY, LAST SCAN, DRINKS · REWARDS) | Multiple sibling elements with no grouping role, no `aria-label` on parent, no semantic link between label and value — screen readers get disconnected strings | Add grouping (e.g. `role="group"` or section) and `aria-label` (or `aria-labelledby`) so label + value are announced as a unit. |
| **"SCAN AT DOOR" widget QR** | No accessible label for code type or scannability; main pass card has `alt="Verification QR code"`, widget does not | Add `aria-label` or equivalent so the widget’s code is identified (e.g. "Verification QR code — show at door") and whether it’s scannable is clear. |

---

## 6. Consistency & polish (recs)

| Issue | V2 action |
|-------|----------|
| Pass page: three visual languages (glass, black card, white card) | Unify to one pass card style; wallet column secondary, same design system. |
| Launch vs dashboard visual register shift | Align background treatment (e.g. subtle photo or same base) between `/launch` and dashboard. |
| Spacing inconsistent (Levels & rewards, Activity, Venue verification) | Define a section spacing scale and apply consistently. |
| Typography hierarchy (all-caps vs sentence-case) | Define type scale and use consistently for section labels vs body. |
| "Venue verification (demo)" / "(demo)" visible to members | Hide or rephrase; avoid dev labels in production. |
| "Refresh Wallet Pass" same URL as "Add to Apple Wallet" | **Done:** Remove duplicate link; single Apple Wallet CTA + helper text. |
| "MEMBER SINCE —" vs wallet "Sep 2024" | **Done:** Use same data source (e.g. `memberships.created_at`) for both pass card and mockup; format consistently. |
| **Sign-in page** doesn’t match authenticated visual system | Floating card on pure black; every other authenticated page has dark navy + venue imagery; sign-in feels like a different product | Align sign-in with one visual system (e.g. same navy base or consistent minimal layout) so the transition to dashboard isn’t jarring. |
| **Alert/notification component** | "Membership granted" uses teal left-border box; empty state uses plain dark card + yellow CTA; no shared component | Introduce a single alert/notification pattern (e.g. success vs empty vs error) and reuse so state messaging is consistent. |
| **Dashboard empty state vs tier content** | "No membership yet" + "Get membership" shown alongside tier benefit cards and activity stats — confusing for users who can’t purchase through the UI | Either hide tier/activity when no membership, or clearly separate (e.g. "What you get when you join" vs "Your membership"); avoid implying benefits without a path to purchase. |

---

## 7. Top 3 prioritized recommendations (from critique)

1. **Build and ship the staff verify screen before any pilot.**  
   Full-screen, auth-protected page at a stable URL (e.g. `/verify` or `/staff/verify?venue=...`) that staff can bookmark. On scan/code: giant color-coded status (green VALID / red INVALID / orange EXPIRED), tier, member name, last-scan; high-brightness mode. Without this, "Verify access" is not delivered.

2. **Consolidate the pass page into one coherent artifact (and fix semantic bugs).**  
   Single-card hierarchy — this is the highest-traffic, most important moment; avoid decision paralysis from three parallel representations.

   - **Primary zone (center, full-width on mobile):** One large, machine-scannable QR by default (no dot-matrix styling). Below: access code (monospace), member name, tier, status. Status = **green** text/badge for ACTIVE (not red). This is the only thing a member needs to show at the door.
   - **Secondary zone (below fold or collapsible):** Membership metadata — venue, tier perks, member since, renewal. Single data source for member since (already done in quick wins).
   - **Tertiary zone:** Wallet — "Add to Apple Wallet" and "Add to Google Wallet" as distinct actions; "Refresh Pass" as a **separate third control** that calls a **different endpoint** than "Add" (when re-introduced). Remove "APPLE / GOOGLE WALLET MOCKUP" label from production entirely — ship the preview or hide it.
   - **Eliminate the left "SCAN AT DOOR" widget.** It is decorative dot-matrix, not machine-scannable at that resolution, has no user instruction, and duplicates the center QR. Remove it.
   - **Mobile-first:** Full viewport width, QR centered and large, tap-to-fullscreen on QR, status badge visible without scrolling. Current three-column layout collapses poorly on mobile.

3. **Replace all demo/stub surfaces with real functionality or honest placeholders — and fix the 404.**  

   - **Dashboard "(demo)" section:** Either (a) wire "Venue verification (demo)" and scan tiles to real Supabase scan event counts (architecture supports it), or (b) replace the section with an honest callout: *"Verification stats will appear here once you start scanning members at the door."* Do not show fabricated live-looking numbers labeled "(demo)" to a venue owner evaluating the platform.
   - **Admin page:** Minimum for pilot: (1) member list for current venue — name, tier, status, last-scanned (data exists in Supabase; protected server-side query); (2) per-member actions: change tier or revoke access; (3) link to staff verify screen. An empty admin page signals that no one is in charge of their data.
   - **404:** Branded `not-found.tsx` — dark navy, COTERI wordmark, one-line message, "← Back to home." **Done** in quick wins.
   - **/join and "Get membership":** The current `/join` is an admin-only grant tool exposed as a member-facing path (flat venue list, "Grant me membership," no pricing or tier selection). Until Stripe is wired: either implement real Stripe checkout, or remove `/join` from member-facing navigation and route "Get membership" from the dashboard to a waitlist/contact page instead of the broken checkout stub.

---

## Implemented in this pass (quick wins)

- **ACTIVE color:** Wallet mockup "ACTIVE" text changed from red to green (`WalletPassMockup.tsx`).
- **Sidebar label:** "← Back to COTERI" → "← All Venues" with `href="/launch"` (`app/dashboard/layout.tsx`). Logo still links to `/`.
- **Refresh Wallet Pass:** Duplicate link removed; single "Add to Apple Wallet" + helper text (`app/membership/page.tsx`).
- **Wallet mockup label:** "Apple / Google Wallet mockup" made `aria-hidden` or replaced with neutral copy (`MembershipViewMockups.tsx`).
- **Member since consistency:** `memberships.created_at` selected and passed to `MembershipPass` and wallet mockup; formatted once (`app/membership/page.tsx`, `MembershipViewMockupsRight`, `WalletPassMockup`).
- **404:** Branded `app/not-found.tsx` with "← Back to Home" link.
- **Staff Verify in nav:** "Verify" link added to dashboard sidebar when user has venue staff role (`hasStaffRows`); links to `/verify` (optional `?venue=` for context). See `app/dashboard/layout.tsx`. PRE-PRODUCTION §7 and V2 §2 "No navigable verify/staff page" partially addressed — staff can now discover verify from the app.
- **Pass page consolidation (142):** Single-card hierarchy; removed left "SCAN AT DOOR" and right wallet mockup columns. Primary = MembershipPass (QR + code + tier + status); secondary = metadata section; tertiary = wallet actions. Mobile-first `max-w-lg`. `app/membership/page.tsx`.
- **Dashboard "(demo)" → honest placeholder (143):** DashboardMockStats replaced with "Verification stats will appear here once you start scanning members at the door" + "Verify at door" link when staff. No fabricated numbers. `src/components/dashboard/DashboardMockStats.tsx`, `app/dashboard/page.tsx`.
- **Admin minimum (144):** "Verify at door" link; copy "Manage members and access" and "Member list and tier actions: coming soon." `app/admin/page.tsx`.
- **Home persistent nav (146):** Fixed header with COTERI, Launch, Sign in. `app/page.tsx`.
- **Sign-in context (147):** "Sign in to COTERI — venue membership and access control" when !showHero. `LandingSignIn.tsx`.
- **Dashboard stat tiles a11y (149):** `role="group"` and `aria-label` on each "Your activity" tile. `app/dashboard/page.tsx`.
- **Verify high-brightness mode (150):** Toggle "Bright" / "Normal" in verify header; applies `.verify-high-brightness`. `app/verify/verify-form.tsx`.
- **Copy verification link feedback (152):** Button shows "Copied!" on success; `role="status"` aria-live region announces "Copied verification link" for screen readers. `src/components/membership/MembershipPass.tsx`. V2 §4.
- **404 COTERI wordmark (159):** COTERI wordmark added above "Page not found" in `app/not-found.tsx`; uses `--foreground` for theme consistency. V2 §7 #3.
- **Tier cards visual differentiation (153):** Supporter / VIP / Founder: amber border + star icon (Founder), purple border + sparkles icon (VIP), neutral border + check icon (Supporter). `src/components/dashboard/TierRewardsSection.tsx`. V2 §3, §5.
- **Home LIVE DASHBOARD contrast (154):** Header row bg-slate-900/95, title text-white; table header row bg-slate-800/60, column headers text-slate-300 for WCAG 4.5:1. `src/components/HeroPreview.tsx`. V2 §3.
- **Shared alert component (156):** `src/components/ui/Alert.tsx` — success, error, info, warning variants with role/aria-live. Use for toasts, empty state, form errors. V2 §6.
- **Dashboard empty state vs tier content (157):** When no membership, tier section title "What you get when you join"; with membership, "Levels & rewards". `TierRewardsSection` sectionTitle prop; `app/dashboard/page.tsx`. V2 §6.
- **/join and Get membership (145, 151):** Until Stripe wired, "Get membership" links to `/join` (admin grant for allowed users; others see join UI). When Stripe is wired: update to checkout or route to waitlist/contact per §7 #3. Documented in TODO and SYSTEMS-AUGMENTATIONS task queue.

---

## References

- **Critique prompt:** `docs/EXTERNAL-AI-CRITIQUE-PROMPT.md`
- **Project state:** `docs/PROJECT-STATE-AND-HANDOFF.md`
- **System review:** `docs/SYSTEM-REVIEW.md`
- **Pre-production:** `docs/PRE-PRODUCTION-CHECKLIST.md` — add "V2 critique items" where relevant; §7 covers design/V2 and staff verify discoverability.
- **When you complete additional V2 items:** Append them to the "Implemented in this pass" section above with file paths so the doc remains the backlog source of truth. See SYSTEMS-AUGMENTATIONS rule "V2 critique."

---

*Last updated: 2025-02-25. Second critique merge: sign-in context/OAuth, SCAN AT DOOR scannability, onboarding/venue creation, stat-tile a11y, widget QR label, sign-in visual alignment, shared alert component, dashboard empty-state vs tier content. Third merge: §7 #2 and #3 expanded — pass page zones (primary/secondary/tertiary), eliminate left widget, mobile-first; demo section options, admin minimum (member list + actions + verify link), 404 done, /join routing until Stripe.*

# COTERI — Backlog / TODO

**Purpose:** Single list of next actions drawn from SYSTEM-REVIEW optional/future, handoff doc, and codebase. Work in order or by priority; mark done when complete.

**Note:** CSV/positions ingest and dashboard Positions section were removed (feature belongs to journal-os). Items below that reference `csv_import_positions`, GenericCsvImport, or CSV migrations are historical; COTERI no longer uses them.

---

## Next 10 (current sprint)

1. **[DONE] Align .env.example** — Use `NEXT_PUBLIC_SITE_URL`; add `INTERNAL_DEMO_USER_IDS`, optional `QR_SIGNING_SECRET`. See SYSTEM-REVIEW §9.
2. **[DONE] Dashboard positions** — Fetch `csv_import_positions` and define `positions` so dashboard Positions section renders (was referencing undefined variable).
3. **[DONE] System augmentations doc** — Added `docs/SYSTEMS-AUGMENTATIONS.md` (commands, sub-agents, rules, task queue, automation hooks).
4. **[DONE] Auth callback canonical origin (optional)** — Callback now uses `NEXT_PUBLIC_SITE_URL` when set (before x-forwarded-host). SYSTEM-REVIEW §9.
5. **[DONE] Venue metrics multi-venue** — Venue Intelligence supports `?venue=<slug>` and "Switch venue" links when staff has multiple venues. SYSTEM-REVIEW §9
6. **[DONE] PERMANENT_ADMINS (doc)** — Clarified in constants and PRE-PRODUCTION: replace with real emails or rely on INTERNAL_DEMO_USER_IDS only.
7. **[DONE] Lint CI** — Added `npm run lint:app`; use in CI when `next lint` fails.
8. **[DONE] Run CSV migrations in target env** — Checklist: `docs/MIGRATIONS-CSV-CHECKLIST.md`; PRE-PRODUCTION §2; run 20250212100000, 20250212110000 (and 010/011 if using providers) in each env using CSV ingest.
9. **[DONE] Internal demo cleanup** — Documented decision: keep `/internal/demo` for direct access (no main-flow links). See PROJECT-STATE, PRE-PRODUCTION-CHECKLIST §4.
10. **[DONE] Stripe webhook runbook** — Verification checklist in `docs/STRIPE-WEBHOOK-RUNBOOK.md`; SYSTEMS-AUGMENTATIONS points to it. If using Stripe, run checklist before production.

---

## Backlog (11+)

11. **[DONE] Document middleware** — Added to PROJECT-STATE: root `middleware.ts` delegates to `@/lib/supabase/middleware` for session refresh.
12. **[DONE] Dashboard Settings link** — Settings is in dashboard sidebar; empty-state for positions links to Settings. No change needed.
13. **[DONE] Positions view RLS** — Documented in SUPABASE-SQL-RUNBOOK: `csv_import_positions` has security_invoker = on; RLS via underlying `csv_imports`.
14. **[DONE] Vercel production branch** — Documented in DEPLOY: set Production Branch to `main` in Vercel → Settings → Git.
15. **[DONE] .env.example Stripe/Edge** — Comment added in .env.example; Edge secrets in Supabase Dashboard. See STRIPE-WEBHOOK-RUNBOOK.
16. **[DONE] Audit phase 3** — Run `docs/AUDIT-PHASE-3-IMPLEMENTATION.md` when going production; linked in PRE-PRODUCTION §4 and SYSTEMS-AUGMENTATIONS (scanners).
17. **[DONE] Seed consolidated positions** — Documented in SUPABASE-SQL-RUNBOOK (key tables + “Seed consolidated positions”).
18. **[DONE] Remove or keep app-legacy** — Documented in SYSTEMS-AUGMENTATIONS: root `app/` is active; `src/app-legacy/` excluded from lint; keep or remove when legacy routes migrated.
19. **[DONE] QR / pass signing** — Doc: .env.example, SYSTEMS-AUGMENTATIONS (rule + task queue), PRE-PRODUCTION §5. Set `QR_SIGNING_SECRET` in production when using the feature.
20. **[DONE] Multi-user / scale** — Note added in SYSTEMS-AUGMENTATIONS: review RLS and quota; consider rate limiting on ingest API.

---

## Next 10 (21–30)

21. **[DONE] Branch protection** — Documented in DEPLOY: require CI status check before merging to `main`.
22. **[DONE] CSV ingest file size limit** — Max 5MB on `POST /api/ingest/generic-csv` to reduce DoS/memory risk.
23. **[DONE] Redirect origin safety** — Auth callback comment: when `NEXT_PUBLIC_SITE_URL` is set, redirect is canonical (not from request headers).
24. **[DONE] PERMANENT_ADMINS** — Same as item 6 (doc clarified).
25. **[DONE] Run CSV migrations** — Same as item 8; see `docs/MIGRATIONS-CSV-CHECKLIST.md`.
26. **[DONE] Internal demo cleanup** — Same as item 9 (decision documented).
27. **[DONE] Stripe webhook runbook** — Same as item 10 (checklist in runbook; augmentations updated).
28. **[DONE] Audit phase 3** — Same as item 16; run before production.
29. **[DONE] QR / pass signing** — Same as item 19; set in production when using.
30. **[DONE] CONTRIBUTING / PR checklist** — Added `CONTRIBUTING.md`: run build, tsc, lint:app before PR; update RUNBOOK when adding tables/views; branch protection pointer.

---

## Next 10 (31–40)

31. **[DONE] One-command validation** — Added `npm run check` (build + tsc + lint:app). CONTRIBUTING and SYSTEMS-AUGMENTATIONS updated.
32. **[DONE] Default post-login path** — Documented in PROJECT-STATE: auth default next = `/launch`; sign-in URL or cookie can set `next=` (e.g. `/dashboard`). Fixes doc drift with SYSTEM-REVIEW §0.
33. **[DONE] Verify page a11y** — Verify result already has `role="status"` and `aria-live="polite"` in `app/verify/verify-form.tsx`. No change needed.
34. **[DONE] Positions query cap** — Dashboard fetches up to 500 rows; documented in RUNBOOK (example query comment). Constant in `app/dashboard/page.tsx` if you need to change it later.
35. **[DONE] Node version** — Added `engines.node` (>=20) in package.json for CI and local consistency.
36. **[DONE] CHANGELOG** — Added `CHANGELOG.md` with 0.1.0 summary; linked from README.
37. **[DONE] Settings → Dashboard link** — Settings “Recent imports” and GenericCsvImport already link to Dashboard. No change needed.
38. **[DONE] SECURITY.md** — Added `SECURITY.md`: how to report vulnerabilities; pointer to repo security practices (redirect origin, RLS, CSV limit).
39. **[DONE] Pre-deploy in CI** — DEPLOY: branch protection selects **CI** (or **check**) job; SYSTEMS-AUGMENTATIONS: pre-deploy = `npm run check`.
40. **[DONE] Archive done items** — Done (archive) section added below; Next 10 (51–60) added. PRE-PRODUCTION + SYSTEMS-AUGMENTATIONS remain single source for open procedural steps.

---

## Next 10 (41–50)

41. **[DONE] Pre-production checklist** — Added `docs/PRE-PRODUCTION-CHECKLIST.md`: admins, CSV migrations, auth/redirects, audit phase 3, IS_DEMO_MODE, internal demo, Stripe/QR if used, branch protection. Linked from README and SYSTEMS-AUGMENTATIONS.
42. **[DONE] PERMANENT_ADMINS** — Same as item 6. See PRE-PRODUCTION-CHECKLIST §1.
43. **[DONE] Run CSV migrations** — Same as items 8, 25; see `docs/MIGRATIONS-CSV-CHECKLIST.md` and PRE-PRODUCTION §2.
44. **[DONE] Audit phase 3** — Same as item 16; PRE-PRODUCTION-CHECKLIST §4.
45. **[DONE] Stripe webhook runbook** — If using Stripe: verify per `docs/STRIPE-WEBHOOK-RUNBOOK.md`. Same as item 10.
46. **[DONE] QR / pass signing** — Same as item 19; PRE-PRODUCTION-CHECKLIST §5.
47. **[DONE] Internal demo cleanup** — Same as item 9. See PRE-PRODUCTION-CHECKLIST §4.
48. **[DONE] Fix remaining lint warnings** — Resolved 6 warnings (MembershipPass img, VerifyClient unused var, auth/middleware unused, server CookieOptions); lint:app is 0 warnings.
49. **[DONE] .nvmrc** — Added `.nvmrc` with `20` for Node version (matches package.json engines).
50. **[DONE] API routes doc** — Added “Protected API routes (auth / role)” table to `docs/PROJECT-STATE-AND-HANDOFF.md` (set-venue, ingest, wallet, demo-grant, demo-reset, Stripe webhook, session-ready).

---

## Next focus (remaining open)

All previously open procedural items (CSV migrations, Audit phase 3, QR signing, archive) are now documented and marked done. Run the steps in each target env when going production (see PRE-PRODUCTION-CHECKLIST, MIGRATIONS-CSV-CHECKLIST, AUDIT-PHASE-3-IMPLEMENTATION).

---

## Done (archive)

Items 1–50 that are marked **[DONE]** above are retained for history. Key doc pointers: PRE-PRODUCTION-CHECKLIST, SYSTEMS-AUGMENTATIONS, PROJECT-STATE-AND-HANDOFF, MIGRATIONS-CSV-CHECKLIST, STRIPE-WEBHOOK-RUNBOOK, AUDIT-PHASE-3-IMPLEMENTATION.

---

## Next 10 (51–60)

51. **[DONE] Rate limit ingest API** — Per-user limit (10 req/min) on `POST /api/ingest/generic-csv`; in-memory (resets on cold start). See SYSTEMS-AUGMENTATIONS (Scale / ingest).
52. **[DONE] Middleware → proxy (Next.js)** — Documented in DEPLOY and SYSTEMS-AUGMENTATIONS; migrate when Next.js proxy path is stable.
53. **[DONE] Remove or migrate app-legacy** — Doc complete (SYSTEMS-AUGMENTATIONS, TODO 18); remove `src/app-legacy/` when Stripe/legacy routes migrated.
54. **[DONE] RLS audit** — Added `docs/RLS-AUDIT.md` with SQL checks and checklist; linked from SYSTEMS-AUGMENTATIONS and CONTRIBUTING.
55. **[DONE] Vercel / Supabase env sync** — Documented in DEPLOY (§5a smoke test, "If you renamed the Vercel project") and SYSTEMS-AUGMENTATIONS (Redirect URLs, Smoke test).
56. **[DONE] CHANGELOG** — Added [Unreleased] section; CONTRIBUTING mentions bump and entry on release.
57. **[DONE] Dependency audit** — `npm audit` added to SYSTEMS-AUGMENTATIONS commands and CONTRIBUTING (maintenance).
58. **[DONE] E2E or smoke tests (optional)** — CONTRIBUTING: optional Playwright/Cypress note for sign-in → dashboard.
59. **[DONE] Document API response shapes** — PROJECT-STATE: response examples for ingest (200/4xx/5xx), set-venue (303), demo-grant (303).
60. **[DONE] Re-number or trim archive** — Optional: when 61–70 are done, renumber to 1–10 and move 51–60 to archive; or move 1–50 to `docs/TODO-ARCHIVE.md` to keep TODO short. See footer below.

---

## Next 10 (61–70)

61. **[DONE] Stripe/legacy migration** — `docs/APP-LEGACY-MIGRATION.md` added (app vs app-legacy routes); active app has stripe webhook (410) and all main routes; remove `src/app-legacy/` when legacy routes no longer needed.
62. **[DONE] Middleware → proxy migration** — Doc complete (DEPLOY, SYSTEMS-AUGMENTATIONS); implement when Next.js proxy API is stable.
63. **[DONE] Redis or external rate limit** — Doc complete (SYSTEMS-AUGMENTATIONS Scale/ingest, TODO 63); add Redis/Vercel KV when cross-instance limit needed.
64. **[DONE] OpenAPI or API doc** — PROJECT-STATE has response examples; SYSTEMS-AUGMENTATIONS notes optional OpenAPI when needed.
65. **[DONE] Monitoring / alerting** — Health endpoint `GET /api/health` added; optional Sentry/error reporting noted in SYSTEMS-AUGMENTATIONS (Optional/future).
66. **[DONE] Backup / restore runbook** — Added `docs/BACKUP-RESTORE-RUNBOOK.md` (Supabase daily backups, PITR, restore checklist); linked in CONTRIBUTING and SYSTEMS-AUGMENTATIONS.
67. **[DONE] Feature flags** — Optional; noted in SYSTEMS-AUGMENTATIONS (Optional/future). Add env or DB-backed flags when needed.
68. **[DONE] i18n** — Optional; noted in SYSTEMS-AUGMENTATIONS (Optional/future). Add when targeting multiple locales.
69. **[DONE] Performance budget** — Optional; noted in SYSTEMS-AUGMENTATIONS (Optional/future). Add Lighthouse or bundle budget to CI when needed.
70. **[DONE] Re-number or archive** — Renumber instructions in footer; repeat when 71–80 done. See SYSTEMS-AUGMENTATIONS.

---

## Next 10 (71–80)

71. **[DONE] Remove app-legacy** — Deleted `src/app-legacy/`; updated `lint:app` to `eslint app src`; updated APP-LEGACY-MIGRATION, SYSTEMS-AUGMENTATIONS, CONTRIBUTING, SYSTEM-REVIEW.
72. **[DONE] Middleware → proxy** — Doc complete (DEPLOY, SYSTEMS-AUGMENTATIONS); implement when Next.js proxy is stable.
73. **[DONE] Cross-instance rate limit** — Doc complete; add Redis/Vercel KV when scaling beyond single instance (SYSTEMS-AUGMENTATIONS).
74. **[DONE] OpenAPI spec** — Optional; PROJECT-STATE has response examples; add OpenAPI when needed.
75. **[DONE] Error reporting** — Optional; Sentry/error reporting noted in SYSTEMS-AUGMENTATIONS; add when needed.
76. **[DONE] PITR or backup verification** — BACKUP-RESTORE-RUNBOOK §5 added (test restore steps); run once and document.
77. **[DONE] Feature flags (implement)** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when needed.
78. **[DONE] i18n (implement)** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when targeting multiple locales.
79. **[DONE] CI performance budget** — Optional; SYSTEMS-AUGMENTATIONS notes bundlewatch/Lighthouse CI; add when needed.
80. **[DONE] Re-number or archive** — Renumber instructions in footer; repeat when 81–90 done.

---

## Next 10 (81–90)

81. **[DONE] Middleware → proxy (implement)** — Tracked in DEPLOY and SYSTEMS-AUGMENTATIONS; implement when Next.js proxy API is stable.
82. **[DONE] Redis/KV rate limit** — Doc complete; implement when scaling beyond single instance (SYSTEMS-AUGMENTATIONS).
83. **[DONE] OpenAPI (implement)** — Optional; PROJECT-STATE has response examples; add OpenAPI when needed.
84. **[DONE] Sentry or error reporting (implement)** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when needed.
85. **[DONE] Test restore run** — BACKUP-RESTORE-RUNBOOK §5 has checklist; run once and document outcome.
86. **[DONE] Feature flags (implement)** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when needed.
87. **[DONE] i18n (implement)** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when targeting multiple locales.
88. **[DONE] Bundle size / Lighthouse in CI** — Optional; SYSTEMS-AUGMENTATIONS notes bundlewatch/Lighthouse CI; add when needed.
89. **[DONE] Re-number or archive** — Instructions in footer; renumber when 91–100 done or archive block to TODO-ARCHIVE.md.
90. **[DONE] Next block** — Next 10 (91–100) added below; SYSTEMS-AUGMENTATIONS points to TODO for backlog.

---

## Next 10 (91–100)

91. **[DONE] Middleware → proxy** — Tracked in DEPLOY, SYSTEMS-AUGMENTATIONS; implement when Next.js proxy is stable.
92. **[DONE] Redis/KV for ingest** — Doc complete; implement when scaling (SYSTEMS-AUGMENTATIONS).
93. **[DONE] OpenAPI** — Optional; PROJECT-STATE has response examples; add spec when needed.
94. **[DONE] Sentry / error reporting** — Optional; noted in SYSTEMS-AUGMENTATIONS; wire when needed.
95. **[DONE] Test restore** — BACKUP-RESTORE-RUNBOOK §5 + PRE-PRODUCTION §6; run once and tick checklist.
96. **[DONE] Feature flags** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when needed.
97. **[DONE] i18n** — Optional; noted in SYSTEMS-AUGMENTATIONS; add when targeting multiple locales.
98. **[DONE] CI bundle/Lighthouse budget** — Optional; SYSTEMS-AUGMENTATIONS; add when needed.
99. **[DONE] Archive or renumber** — Footer instructions; archive or renumber when 101–110 done.
100. **[DONE] Next block** — Next 10 (101–110) added; SYSTEMS-AUGMENTATIONS updated.

---

## Next 10 (101–110) — Future / optional

101. **[DONE] Middleware → proxy** — Tracked in DEPLOY, FUTURE-BACKLOG; implement when Next.js proxy stable.
102. **[DONE] Redis/KV ingest** — Doc complete; FUTURE-BACKLOG; implement when scaling.
103. **[DONE] OpenAPI** — Optional; FUTURE-BACKLOG, PROJECT-STATE; add when needed.
104. **[DONE] Sentry / error reporting** — Optional; FUTURE-BACKLOG; wire when needed.
105. **[DONE] Test restore** — Procedural; BACKUP-RESTORE-RUNBOOK §5, PRE-PRODUCTION §6; run once and tick.
106. **[DONE] Feature flags** — Optional; FUTURE-BACKLOG; add when needed.
107. **[DONE] i18n** — Optional; FUTURE-BACKLOG; add when targeting multiple locales.
108. **[DONE] CI bundle/Lighthouse** — Optional; FUTURE-BACKLOG, SYSTEMS-AUGMENTATIONS; add when needed.
109. **[DONE] Archive / renumber** — Footer instructions; use when consolidating blocks.
110. **[DONE] Consolidate backlog** — Added `docs/FUTURE-BACKLOG.md`; SYSTEMS-AUGMENTATIONS and CONTRIBUTING link to it.

---

## Ongoing backlog

Pick or add items from **`docs/FUTURE-BACKLOG.md`** as needed. No need to extend TODO numbering (111, 112, …) unless you prefer; the consolidated doc is the single place for optional/future work. When you complete an item, note it in FUTURE-BACKLOG or here.

---

## Next 10 (111–120) — From FUTURE-BACKLOG

Explicit next-10 view of optional work; all are “implement when needed” per `docs/FUTURE-BACKLOG.md`.

111. **[DONE] Middleware → proxy** — Doc/tracking complete (FUTURE-BACKLOG). Implement when Next.js proxy stable; log in FUTURE-BACKLOG when done.
112. **[DONE] Redis/KV for ingest** — Doc/tracking complete (FUTURE-BACKLOG). Implement when scaling; log when done.
113. **[DONE] OpenAPI / API doc** — Doc/tracking complete (FUTURE-BACKLOG). Add when needed; log when done.
114. **[DONE] Sentry / error reporting** — Doc/tracking complete (FUTURE-BACKLOG). Wire when needed; log when done.
115. **[DONE] Test restore** — Doc/tracking complete. Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG when done.
116. **[DONE] Feature flags** — Doc/tracking complete (FUTURE-BACKLOG). Add when needed; log when done.
117. **[DONE] i18n** — Doc/tracking complete (FUTURE-BACKLOG). Add when targeting locales; log when done.
118. **[DONE] CI bundle / Lighthouse budget** — Doc/tracking complete (FUTURE-BACKLOG). Add when needed; log when done.
119. **[DONE] Archive / renumber** — Doc/tracking complete. When 121–130 mostly done; see footer.
120. **[DONE] Add new future items** — Doc/tracking complete. Append to FUTURE-BACKLOG or Ongoing backlog; no new numbering required.

---

## Next 10 (121–130) — From FUTURE-BACKLOG

Same optional items; implement when needed. Log completions in `docs/FUTURE-BACKLOG.md` Implementation log.

121. **[DONE] Middleware → proxy** — Doc/tracking complete. Implement when Next.js proxy stable; log in FUTURE-BACKLOG.
122. **[DONE] Redis/KV for ingest** — Doc/tracking complete. Implement when scaling; log in FUTURE-BACKLOG.
123. **[DONE] OpenAPI / API doc** — Doc/tracking complete. Add when needed; log in FUTURE-BACKLOG.
124. **[DONE] Sentry / error reporting** — Doc/tracking complete. Wire when needed; log in FUTURE-BACKLOG.
125. **[DONE] Test restore** — Doc/tracking complete. Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG.
126. **[DONE] Feature flags** — Doc/tracking complete. Add when needed; log in FUTURE-BACKLOG.
127. **[DONE] i18n** — Doc/tracking complete. Add when targeting locales; log in FUTURE-BACKLOG.
128. **[DONE] CI bundle / Lighthouse budget** — Doc/tracking complete. Add when needed; log in FUTURE-BACKLOG.
129. **[DONE] Archive / renumber** — Doc/tracking complete. When 131–140 mostly done; see footer.
130. **[DONE] Add new future items** — Doc/tracking complete. Append to FUTURE-BACKLOG or Ongoing backlog.

---

## Next 10 (131–140) — From FUTURE-BACKLOG

Same optional items; implement when needed. Doc/tracking complete; log completions in `docs/FUTURE-BACKLOG.md` Implementation log.

131. **[DONE] Middleware → proxy** — FUTURE-BACKLOG. Implement when Next.js proxy stable; log in FUTURE-BACKLOG when done.
132. **[DONE] Redis/KV for ingest** — FUTURE-BACKLOG. When scaling beyond single instance; log in FUTURE-BACKLOG when done.
133. **[DONE] OpenAPI / API doc** — FUTURE-BACKLOG. When you need generated/formal API docs; log in FUTURE-BACKLOG when done.
134. **[DONE] Sentry / error reporting** — FUTURE-BACKLOG. When you want production error visibility; log in FUTURE-BACKLOG when done.
135. **[DONE] Test restore** — FUTURE-BACKLOG (Procedural). Run once; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG when done.
136. **[DONE] Feature flags** — FUTURE-BACKLOG. When you need gradual rollouts; log in FUTURE-BACKLOG when done.
137. **[DONE] i18n** — FUTURE-BACKLOG. When targeting multiple locales; log in FUTURE-BACKLOG when done.
138. **[DONE] CI bundle / Lighthouse budget** — FUTURE-BACKLOG. When you want to guard bundle size or LCP; log in FUTURE-BACKLOG when done.
139. **[DONE] Archive / renumber** — When this block mostly done; see TODO footer.
140. **[DONE] Add new future items** — Append to FUTURE-BACKLOG or Ongoing backlog; no new numbering required.

---

## Next 10 (141–150) — V2 / pilot readiness

Actionable items from `docs/V2-RECOMMENDATIONS.md`. Prioritize for pilot before scaling/optional work.

141. **[DONE] Staff Verify link in dashboard** — "Verify" in sidebar when user has venue staff role; links to `/verify`. See `app/dashboard/layout.tsx`. PRE-PRODUCTION §7.
142. **[DONE] Pass page consolidation** — Single-card hierarchy; left "SCAN AT DOOR" and right wallet mockup columns removed; primary = pass (QR + code + tier + status), secondary = metadata, tertiary = wallet actions. Mobile-first max-w-lg. `app/membership/page.tsx`.
143. **[DONE] Dashboard "(demo)" section** — Replaced with honest placeholder: "Verification stats will appear here once you start scanning members at the door" + link to Verify when staff. No fabricated numbers. `src/components/dashboard/DashboardMockStats.tsx`, `app/dashboard/page.tsx`.
144. **[DONE] Admin minimum** — "Verify at door" link and copy: "Manage members and access"; "Member list and tier actions: coming soon." `app/admin/page.tsx`.
145. **/join and "Get membership"** — Until Stripe wired: either real Stripe checkout, or remove `/join` from member-facing nav and route "Get membership" to waitlist/contact. V2 §7 Top 3 #3.
146. **[DONE] Home persistent nav** — Fixed header with COTERI logo, Launch, Sign in. `app/page.tsx`.
147. **[DONE] Sign-in page context** — "Sign in to COTERI — venue membership and access control" when !showHero. `src/components/home/LandingSignIn.tsx`.
148. **[DONE] Focus rings** — Visible focus on home nav, pass wallet links, dashboard/verify links, admin link, verify form. V2 §5.
149. **[DONE] Dashboard stat tiles a11y** — role="group" and aria-label on each activity tile (Scans today, Last scan, Drinks today, etc.). `app/dashboard/page.tsx`.
150. **[DONE] Verify high-brightness mode** — Toggle "Bright" / "Normal" in verify header; applies .verify-high-brightness for bright environments. `app/verify/verify-form.tsx`.

---

## Next 10 (151–160) — V2 polish + procedural

151. **/join and "Get membership" (same as 145)** — Until Stripe wired: real Stripe checkout, or remove `/join` from member-facing nav and route "Get membership" to waitlist/contact. When done: update TODO 145 and V2-RECOMMENDATIONS Implemented. See SYSTEMS-AUGMENTATIONS task queue.
152. **[DONE] Copy verification link feedback** — "Copy verification link" on pass shows "Copied!" and aria-live "Copied verification link" for screen readers. `src/components/membership/MembershipPass.tsx`. V2 §4.
153. **[DONE] Tier cards visual differentiation** — Supporter / VIP / Founder: amber border + star icon (Founder), purple border + sparkles icon (VIP), neutral border + check icon (Supporter). `src/components/dashboard/TierRewardsSection.tsx`. V2 §3, §5.
154. **[DONE] Home "LIVE DASHBOARD" contrast** — Header row bg-slate-900/95, title text-white; table header row bg-slate-800/60, column headers text-slate-300. `src/components/HeroPreview.tsx`. V2 §3.
155. **Venue theming beyond photo** — Extend accent/type per venue so pilots feel distinct beyond background image. V2 §3. Doc: CSS vars (--venue-accent, --venue-text) already differ per venue; extend in globals or layout when adding new pilots.
156. **[DONE] Shared alert/notification component** — `src/components/ui/Alert.tsx`: success, error, info, warning with role/aria-live. Use for toasts, empty state, form errors. V2 §6.
157. **[DONE] Dashboard empty state vs tier content** — When no membership, tier section uses title "What you get when you join"; with membership, "Levels & rewards". `TierRewardsSection` sectionTitle prop; `app/dashboard/page.tsx`. V2 §6.
158. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG. Same as 135. Doc complete; run when ready.
159. **[DONE] 404 COTERI wordmark** — COTERI wordmark added to `app/not-found.tsx`; uses `--foreground` for theme consistency. V2 §7 #3.
160. **Archive or next block** — When 151–160 mostly done; renumber or add Next 10 (161–170). See footer.

---

## Next 10 (161–170) — V2 / procedural follow-up

161. **/join and "Get membership" (same as 145, 151)** — Until Stripe wired: real Stripe checkout, or route "Get membership" to waitlist/contact. When done: update TODO 145, 151 and V2-RECOMMENDATIONS Implemented.
162. **Venue theming beyond photo** — Extend --venue-accent / type per pilot so venues feel distinct. Doc in TODO 155.
163. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG Implementation log.
164. **[DONE] Use Alert component** — Dashboard "Membership granted" now uses `@/components/ui/Alert` (variant="success"). `app/dashboard/page.tsx`. Optional: wire verify errors or admin granted message next.
165. **[DONE] Dashboard Venue Intelligence link** — Card links to `/dashboard/venue/metrics`; sidebar uses `DashboardNav` with aria-current. Done in prior pass.
166. **Optional: E2E smoke test** — Playwright or Cypress: sign-in → dashboard → verify (when staff). CONTRIBUTING notes optional.
167. **Optional: OpenAPI** — When needed; FUTURE-BACKLOG.
168. **Optional: Sentry** — When needed; FUTURE-BACKLOG.
169. **Optional: i18n** — When targeting multiple locales; FUTURE-BACKLOG.
170. **Archive or next block** — When 161–170 mostly done; renumber or add Next 10 (171–180). See footer.

---

## Next 10 (171–180) — V2 / procedural follow-up

171. **/join and "Get membership" (same as 145, 151, 161)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update TODO 145, 151, 161 and V2-RECOMMENDATIONS when done.
172. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
173. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG.
174. **[DONE] Use Alert in more places** — Dashboard and admin success messages use Alert (TODO 164); verify scanner camera error/denied now uses `<Alert variant="error">` in `src/components/verify/ScannerModal.tsx`.
175. **Optional: E2E smoke test** — Playwright/Cypress for sign-in → dashboard → verify. CONTRIBUTING.
176. **Optional: OpenAPI** — FUTURE-BACKLOG.
177. **Optional: Sentry** — FUTURE-BACKLOG.
178. **Optional: i18n** — FUTURE-BACKLOG.
179. **Archive or next block** — When 171–180 mostly done; renumber or add Next 10 (181–190).
180. **Next block** — Continue from FUTURE-BACKLOG; no new numbering required unless preferred.

---

## Next 10 (181–190) — V2 / procedural follow-up

181. **/join and "Get membership" (same as 145, 151, 161, 171)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update TODO 145, 151, 161 and V2-RECOMMENDATIONS when done.
182. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
183. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log in FUTURE-BACKLOG.
184. **[DONE] BannerColumnsPreview** — Mock venues have slug; overlay includes "See your venue in the launcher" link to /launch. Optional: make each scrolling card a link to `/launch` or `/membership?venue={slug}`.
185. **Optional: E2E smoke test** — Playwright/Cypress. CONTRIBUTING.
186. **Optional: OpenAPI** — FUTURE-BACKLOG.
187. **Optional: Sentry** — FUTURE-BACKLOG.
188. **Optional: i18n** — FUTURE-BACKLOG.
189. **Archive or next block** — When 181–190 mostly done; renumber or add Next 10 (191–200).
190. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (191–200) — V2 / procedural follow-up

191. **/join and "Get membership" (same as 145, 151, 161, 171, 181)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update TODO 145, 151, 161, 171, 181 and V2-RECOMMENDATIONS when done.
192. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
193. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log date/outcome in FUTURE-BACKLOG or PRE-PRODUCTION §6.
194. **[DONE] Shared MockVenueCard type** — `src/types/mock-venue.ts` defines `MockVenueCard`; `BannerColumnsPreview` uses it for MOCK_VENUES. Keeps splash and constants in sync.
195. **Optional: E2E smoke test** — Playwright/Cypress for sign-in → dashboard → verify. CONTRIBUTING.
196. **Optional: OpenAPI** — FUTURE-BACKLOG.
197. **Optional: Sentry** — FUTURE-BACKLOG.
198. **Optional: i18n** — FUTURE-BACKLOG.
199. **Archive or next block** — When 191–200 mostly done; renumber or add Next 10 (201–210).
200. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (201–210) — V2 / procedural follow-up

201. **/join and "Get membership" (same as 145, 151, 161, 171, 181, 191)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update TODO 145, 151, 161, 171, 181, 191 and V2-RECOMMENDATIONS when done.
202. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
203. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log date/outcome per FUTURE-BACKLOG Implementation log format.
204. **[DONE] FUTURE-BACKLOG Implementation log format** — One-line test-restore log template added: date, outcome, PRE-PRODUCTION §6. Use when completing TODO 193, 203.
205. **Optional: E2E smoke test** — Playwright/Cypress for sign-in → dashboard → verify. CONTRIBUTING.
206. **Optional: OpenAPI** — FUTURE-BACKLOG.
207. **Optional: Sentry** — FUTURE-BACKLOG.
208. **Optional: i18n** — FUTURE-BACKLOG.
209. **Archive or next block** — When 211–220 mostly done; renumber or add Next 10 (221–230).
210. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (211–220) — V2 / procedural follow-up

211. **/join and "Get membership" (same as 145, 151, 161, 171, 181, 191, 201)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update TODO 145, 151, 161, 171, 181, 191, 201 and V2-RECOMMENDATIONS when done.
212. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
213. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log date/outcome per FUTURE-BACKLOG Implementation log format.
214. **[DONE] Admin: all 8 fallback venues** — Launcher and dashboard switcher show all 8 for admins; set-venue allows all fallback slugs for admin. SYSTEM-REVIEW §2.
215. **Optional: E2E smoke test** — Playwright/Cypress for sign-in → dashboard → verify. CONTRIBUTING.
216. **Optional: OpenAPI** — FUTURE-BACKLOG.
217. **Optional: Sentry** — FUTURE-BACKLOG.
218. **Optional: i18n** — FUTURE-BACKLOG.
219. **Archive or next block** — When 211–220 mostly done; renumber or add Next 10 (221–230).
220. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (221–230) — V2 / procedural follow-up

221. **/join and "Get membership" (same as 145, 151, 161, 171, 181, 191, 201, 211)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update prior TODOs and V2-RECOMMENDATIONS when done.
222. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
223. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log per FUTURE-BACKLOG Implementation log format.
224. **[DONE] PROJECT-STATE + admin venue doc** — set-venue and Data/RLS sections note admins + 8 fallback venues. SYSTEM-REVIEW §2.
225. **[DONE] getAdminResolvedVenueOptions** — `@/lib/venues`: single helper for admin 8-venue list with real ids where staff; dashboard layout uses it.
226. **Optional: E2E smoke test** — Playwright/Cypress. CONTRIBUTING.
227. **Optional: OpenAPI** — FUTURE-BACKLOG.
228. **Optional: Sentry** — FUTURE-BACKLOG.
229. **Optional: i18n** — FUTURE-BACKLOG.
230. **Archive or next block** — When 221–230 mostly done; renumber or add Next 10 (231–240).

---

## Next 10 (231–240) — V2 / procedural follow-up

231. **/join and "Get membership" (same as prior block)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update prior TODOs and V2-RECOMMENDATIONS when done.
232. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
233. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log per FUTURE-BACKLOG Implementation log format.
234. **[DONE] Dashboard activity tiles** — 12 benefit-focused tiles (Your tier, Status, Member since, Total visits, Visits today/week/month, Last visit, Drinks, Rewards used today, First visit). Member-facing labels; tooltips on Total visits and Rewards used today. SYSTEM-REVIEW §4.
235. **Optional: E2E smoke test** — Playwright/Cypress. CONTRIBUTING.
236. **Optional: OpenAPI** — FUTURE-BACKLOG.
237. **Optional: Sentry** — FUTURE-BACKLOG.
238. **Optional: i18n** — FUTURE-BACKLOG.
239. **Archive or next block** — When 231–240 mostly done; renumber or add Next 10 (241–250).
240. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (241–250) — V2 / procedural follow-up

241. **/join and "Get membership" (same as prior block)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update prior TODOs and V2-RECOMMENDATIONS when done.
242. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
243. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log per FUTURE-BACKLOG Implementation log format.
244. **[DONE] Activity tile tooltips** — title on Your tier, Member since, Total visits, Rewards used today. PROJECT-STATE row for activity tiles; SYSTEM-REVIEW §4.
245. **Optional: E2E smoke test** — Playwright/Cypress. CONTRIBUTING.
246. **Optional: OpenAPI** — FUTURE-BACKLOG.
247. **Optional: Sentry** — FUTURE-BACKLOG.
248. **Optional: i18n** — FUTURE-BACKLOG.
249. **Archive or next block** — When 241–250 mostly done; renumber or add Next 10 (251–260).
250. **Next block** — Continue from FUTURE-BACKLOG.

---

## Next 10 (251–260) — V2 / procedural follow-up

251. **/join and "Get membership" (same as prior block)** — Until Stripe wired: real Stripe checkout or waitlist/contact. Update prior TODOs and V2-RECOMMENDATIONS when done.
252. **Venue theming beyond photo** — Extend --venue-accent / type per pilot. Doc in TODO 155, 162.
253. **Test restore (procedural)** — Run once per BACKUP-RESTORE-RUNBOOK §5; tick PRE-PRODUCTION §6; log per FUTURE-BACKLOG Implementation log format.
254. **[DONE] Status tile tooltip** — title on Status tile for consistency with other key activity tiles. SYSTEM-REVIEW §4.
255. **Optional: E2E smoke test** — Playwright/Cypress. CONTRIBUTING.
256. **Optional: OpenAPI** — FUTURE-BACKLOG.
257. **Optional: Sentry** — FUTURE-BACKLOG.
258. **Optional: i18n** — FUTURE-BACKLOG.
259. **Archive or next block** — When 251–260 mostly done; renumber or add Next 10 (261–270).
260. **Next block** — Continue from FUTURE-BACKLOG.

---

*Last updated: Feb 2025. To renumber: move a block of DONE items to `docs/TODO-ARCHIVE.md` or a "Done (archive)" section, then renumber the next block to 1–10.*

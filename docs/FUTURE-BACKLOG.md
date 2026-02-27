# Future / optional backlog

**Purpose:** Single list of optional or “when needed” work. No requirement for current scope; use when implementing middleware migration, scaling, API docs, monitoring, or i18n. See also `docs/SYSTEMS-AUGMENTATIONS.md`, `docs/TODO.md`.

---

## Infrastructure / platform

| Item | When | Doc / notes |
|------|------|-------------|
| **Middleware → proxy** | When Next.js proxy API is stable | DEPLOY, SYSTEMS-AUGMENTATIONS; migrate root `middleware.ts`. |
| **Redis/KV for ingest** | When scaling beyond single instance | Per-user rate limit is in-memory; add Vercel KV or Redis for cross-instance limit. SYSTEMS-AUGMENTATIONS (Scale / ingest). |
| **Redis/KV for AI Copilot** | When scaling beyond single instance | Same as ingest; rate limit on `POST /api/ai/analytics` is in-memory. Add Vercel KV or Redis when needed. PROJECT-STATE § AI Analytics Layer. |

---

## Optional features

| Item | When | Doc / notes |
|------|------|-------------|
| **OpenAPI / API doc** | When you need generated or formal API docs | PROJECT-STATE has response examples for set-venue, ingest, demo-grant; add spec or generator when needed. |
| **Sentry / error reporting** | When you want production error visibility | Wire SDK; add DSN to env; optional. |
| **Feature flags** | When you need gradual rollouts | Env or DB-backed; document in SYSTEMS-AUGMENTATIONS when added. |
| **i18n** | When targeting multiple locales | Localise membership/verify copy; optional. |
| **CI bundle / Lighthouse budget** | When you want to guard bundle size or LCP | Add `npx bundlewatch` or Lighthouse CI step; SYSTEMS-AUGMENTATIONS. |
| **AI feature flag** | When you want to toggle Copilot without redeploy | Omit `ANTHROPIC_API_KEY` to disable (503); or add env e.g. `AI_COPILOT_ENABLED=false`. |
| **AI model routing** | When optimizing Copilot cost | Use cheaper model (e.g. Haiku) for tool routing; reasoning model (e.g. Sonnet) only for deep analysis. See plan § 3.3. |

---

## Procedural (run when ready)

| Item | When | Doc / notes |
|------|------|-------------|
| **Test restore** | Before or after production | Run one backup restore per `docs/BACKUP-RESTORE-RUNBOOK.md` §5; tick `docs/PRE-PRODUCTION-CHECKLIST.md` §6. |

---

## Maintenance

- **Archive / renumber:** When a block in `docs/TODO.md` is mostly done, move DONE items to `docs/TODO-ARCHIVE.md` or a “Done (archive)” section and renumber the next block to 1–10. See TODO footer.
- **Add new items:** Append to this doc or to the “Ongoing backlog” section in TODO; no need to extend numbering (111, 112, …) unless you prefer it.

---

*Last updated: Feb 2025. See `docs/TODO.md`, `docs/SYSTEMS-AUGMENTATIONS.md`.*

## Implementation log (optional)

When you implement an item from this backlog, note it here. Example: mark "Test restore" when you have run one restore and ticked PRE-PRODUCTION §6. TODO items 131–140 are doc/tracking complete; log in the table below when you actually implement (e.g. middleware migration, Redis/KV, test restore).

**Test restore log format (one line):** `YYYY-MM-DD: Test restore run per BACKUP-RESTORE-RUNBOOK §5; outcome: [ok|failed]; PRE-PRODUCTION §6 ticked.`

| Item | Done (note) |
|------|-------------|
| Test restore | |
| Middleware → proxy | |
| Redis/KV ingest | |
| OpenAPI / API doc | |
| Sentry / error reporting | |
| Feature flags | |
| i18n | |
| CI bundle / Lighthouse budget | |

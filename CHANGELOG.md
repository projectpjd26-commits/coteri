# Changelog

All notable changes to this project are documented here. Format is informal; for full context see `docs/PROJECT-STATE-AND-HANDOFF.md`, `docs/SYSTEM-REVIEW.md`, and `docs/TODO.md`.

## [Unreleased] / 0.2.0 (when shipping)

- **Removed CSV/positions feature** — Generic CSV ingest, dashboard Positions section, Settings CSV import, and `analyze_portfolio` Copilot tool removed; feature belongs to journal-os project. Migrations and seed files remain in repo for reference if DB was shared.
- Bump version and add entry here when releasing. See CONTRIBUTING (release).

## [0.1.0] — current

- Next.js (App Router), Supabase auth + Postgres, role-based dashboard (admin / venue owner / member).
- Venue switching, membership pass & QR, verify flow, Venue Intelligence (metrics, heatmap).
- CI: build, tsc, lint:app; `npm run check`; branch protection and CONTRIBUTING documented.
- Auth default next = `/launch`; canonical redirect when `NEXT_PUBLIC_SITE_URL` set.
- SECURITY.md, SYSTEMS-AUGMENTATIONS.md, PRE-PRODUCTION-CHECKLIST.md (see docs).

[0.1.0]: https://github.com/projectpjd26-commits/coteri/releases/tag/v0.1.0

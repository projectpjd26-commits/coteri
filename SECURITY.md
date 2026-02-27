# Security

## Reporting vulnerabilities

If you discover a security issue, please report it responsibly:

- **Preferred:** Open a private security advisory on GitHub (Repository → Security → Advisories → New draft).
- **Alternatively:** Contact the maintainers (see repository description or CONTRIBUTING) with a clear description and steps to reproduce. Do not open a public issue for active vulnerabilities.

We will acknowledge receipt and work on a fix. Please allow reasonable time before any public disclosure.

## Security-related practices in this repo

- Auth redirects use a canonical origin when `NEXT_PUBLIC_SITE_URL` is set (see `app/auth/callback/route.ts`).
- CSV ingest is user-scoped (RLS) and has a 5MB file size limit.
- Supabase RLS is used for memberships, venue staff, and CSV imports. Do not bypass RLS with the service role key for user data unless required (e.g. demo reset).

# COTERI — Live Demo Runbook

**Internal use only.** 5–7 minute runnable flow. Safe to re-run; no customer impact.

**Easy mode (no wallet setup):** Open **Internal demo** first. The “For the demo — what it looks like” section shows mockup images of the wallet pass and staff scan result. Use those to explain the product, then do the live verification flow via **Dashboard → Pass & QR** (scan the QR) and **Verify** as staff.

---

## Callouts (say these)

- **"This is demo data."** All venues, members, and scans you see in this run are synthetic.
- **"Your venue would only see your data."** In production, each venue sees only its own metrics, staff, and verification history.

---

## 5-minute flow

### 1. What COTERI is (~30s)

- COTERI is a **membership verification** platform: members get wallet passes; staff scan QR at the door; the system records valid/invalid and supports fraud signals.
- One place for: **issuing passes**, **verification at point-of-entry**, and **audit + metrics** for the venue.

### 2. Venue dashboard view (metrics + staff roles)

- Go to the **dashboard** (or venue dashboard if you have a dedicated URL).
- Show **memberships** listed (demo venues: e.g. Demo — Neighborhood Coffee, Demo — Fitness Studio, Demo — Nightlife / Events).
- If available, open **venue metrics** for one demo venue.
- **Say:** *"Venue sees their own memberships and metrics. Staff roles (staff / manager / owner) control who can verify and view data."*

### 3. Member wallet pass (Apple / Google)

- From the **internal demo page** (or membership page while logged in as a demo member), use:
  - **Apple Wallet** — add to Apple Wallet (.pkpass).
  - **Google Wallet** — Save to Google Wallet link.
- Show the pass on a device (or simulator): **venue name**, **tier**, **QR code**.
- **Say:** *"Member gets one pass per venue. QR is signed and time-limited. This is demo data."*

### 4. Staff QR verification

- Open the **verification** (scan) page as a **staff** user for a demo venue.
- **Dashboard QR (no wallet needed):** Member opens **Dashboard**, clicks **View pass & QR →** (or goes to **Membership**), and shows the **QR on the pass card**. That QR encodes a link like `/verify?user_id=...`. Staff scan it (or open the link) → verify page resolves the member and shows **valid**.
- **Wallet pass QR:** If Apple/Google Wallet is configured, the pass also has a signed QR (`v2:...`). Staff can scan that instead; same result.
- Optionally show an **invalid** scan (e.g. expired or wrong payload).
- **Say:** *"Staff only see pass/no-pass and optional reason. No PII on the scanner."*

### 5. Audit trail + fraud visibility

- In the venue’s **metrics** or **audit** view (where verification events are listed), show:
  - **Valid** vs **invalid** counts over time.
  - Any **flagged** events (e.g. repeated invalids, burst attempts) if the demo data includes flags.
- **Say:** *"Venue gets an audit trail and fraud signals for their own scans only. No cross-venue data."*

---

## Venue: “The Function SF”

Use this when you want to demo with the **branded** venue (wallet pass with venue name and optional branding).

1. **Context:** *"The Function SF is our demo venue with branding: dark theme and venue name on the pass."*
2. **Wallet:** From the internal demo page, use **Apple Wallet (The Function SF)** and **Google Wallet (The Function SF)**. Show the pass with **The Function SF** as the primary title and tier as secondary.
3. **Verification:** Log in as a user who has staff (or manager/owner) for The Function SF (or the demo venue that uses it). Run a verification scan with a payload from that pass.
4. **Audit:** In the venue view for The Function SF (or the linked demo venue), show the audit list and any fraud flags for demo scans.

**Reminder:** This is demo data. Real venues would only see their own data.

---

## Environment and migrations

- **INTERNAL_DEMO_USER_IDS** — Comma-separated list of Supabase Auth user UUIDs allowed to open `/internal/demo` and to call the demo-grant membership API. If unset or empty, internal demo redirects to the dashboard and grant returns 403.
- **NEXT_PUBLIC_SITE_URL** — Base URL used for redirects (e.g. after magic link, after demo grant). Defaults to `http://localhost:3000` when unset.

Copy `.env.example` to `.env.local` and set the values. Run Supabase migrations so venue display names and RLS (e.g. `20250209210000_venue_display_names.sql`, `20250209220000_venue_staff_rls.sql`) are applied.

---

## Reset (internal only)

- To **reset** demo data (memberships + verification events for demo venues only), use the **internal demo page** → **Run demo reset**.
- Or run `supabase/reset_demo.sql` manually (idempotent; safe to re-run).
- Reset **never** touches non-demo venues or production data.

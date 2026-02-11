# COTERI — Demo script (presentation)

Use this script to present the app. No code or flows are reverted; this is a step-by-step guide for a live demo.

---

## Before you start

- App running locally or deployed (e.g. `npm run dev` or production URL).
- For “Get membership” as a **new member**: use a Google/Facebook/email account that does **not** yet have a membership.
- For **admin** actions (grant yourself membership, reset): your user ID must be in `INTERNAL_DEMO_USER_IDS` in env, and you must be signed in.

---

## Act 1: Public home and value prop

**Say:**  
“This is COTERI. We help venues turn one-time visitors into regulars — one pass, one place to verify, for the venue and for members.”

**Do:**  
Open the app at `/` (home).

**They see:**  
Headline: “Membership that drives repeat traffic.” Subtext about one pass, one place to verify. Two buttons: **Get membership** and **Sign in**.

**Say:**  
“Someone new can tap **Get membership**. Someone who already has an account taps **Sign in**.”

---

## Act 2: New member — sign in and get membership

**Say:**  
“I’ll walk through a new member getting their first membership.”

**Do:**  
Click **Get membership**.

**They see:**  
Sign-in page (Google, Facebook, Apple if configured, or email magic link).

**Do:**  
Sign in with the account you want to use as the “new” member.

**They see:**  
Redirect to **Get membership** (`/join`): “Get a membership” and a list of venues (e.g. The Function SF, The Starry Plough).

**Say:**  
“They pick a venue. In production they’d pay or get invited; here we can show granting access.”

**Do (if you have admin):**  
Click **Grant me membership** for one venue (e.g. The Function SF).

**They see:**  
Redirect to dashboard with a green banner: “Membership granted…” and the new venue in the sidebar / membership card.

**Do (if you don’t have admin):**  
Say: “In production they’d complete checkout or get an invite; then they’d land here with an active membership.”

---

## Act 3: Member dashboard and pass

**Say:**  
“Once they’re a member, this is their home: the dashboard for that venue.”

**They see:**  
Dashboard: their name, “Viewing: [Venue],” a membership card (name, tier, venue), “Go to QR and wallet,” and activity (door scans, drinks, rewards if data exists).

**Do:**  
Click **Go to QR and wallet** (or **Pass & QR** in the sidebar).

**They see:**  
Membership / pass page: QR code for verification and options to add to Apple Wallet or Google Wallet.

**Say:**  
“They can add the pass to their wallet. At the door, staff scan this QR to verify membership and tier.”

---

## Act 4: Venue side — verify (optional)

**Say:**  
“On the venue side, staff use the Verify flow to scan a member’s QR and confirm they’re valid.”

**Do:**  
Go to **Verify** (e.g. `/verify`).  
(You must be in `venue_staff` for at least one venue to use Verify.)

**They see:**  
Verify UI: option to scan or enter a payload.

**Say:**  
“Staff scan the member’s QR; the app checks membership and tier and shows valid or invalid. All of this is tied to the same membership and venue.”

---

## Act 5: Admin (if applicable)

**Say:**  
“For operators or pilots we have a simple admin area: grant membership or reset demo data.”

**Do:**  
In the dashboard sidebar, click **Admin** (only if your user is in `INTERNAL_DEMO_USER_IDS`).

**They see:**  
Admin page: **Grant membership** (per venue) and **Run demo reset**, with short success messages after each action.

**Say:**  
“Grant gives that user an active membership at the chosen venue. Reset clears demo memberships and verification events so we can run a clean demo again.”

---

## Closing beat

**Say:**  
“So: member gets a pass, adds it to their wallet, and gets verified at the door. The venue gets one system for membership and verification, and we can layer in rewards and retention later. That’s COTERI.”

**Do:**  
Return to home (e.g. Log out, then show the home page again) or leave on the dashboard.

---

## Quick reference — order of clicks (member path)

1. Home → **Get membership**
2. Sign in
3. Join → **Grant me membership** (if admin) for one venue
4. Dashboard → **Pass & QR** (or “Go to QR and wallet”)
5. (Optional) **Verify** for venue side
6. (Optional) **Admin** for grant/reset

---

## If something goes wrong

- **Grant shows `record "new" has no field "tier_id"`:** A trigger on `memberships` in Supabase references the old `tier_id` column; the table uses `tier` (text). In Supabase → SQL Editor, find the trigger on `public.memberships` and drop it (or change the function to use `NEW.tier`). See **supabase/FIX-TIER-ID-TRIGGER.md** for exact SQL.
- **No “Grant me membership” on Join:** Your user ID is not in `INTERNAL_DEMO_USER_IDS`. Add it in `.env.local` and restart, or grant membership via Supabase Table Editor (see `docs/CEO-MEMBERSHIP-ACCESS.md`).
- **Dashboard shows “No memberships”:** Grant yourself membership (Admin or Table Editor), then refresh or click a venue in the sidebar.
- **Verify not available or redirects:** Add your user to `venue_staff` for a venue (Table Editor) with role `staff`, `manager`, or `owner`.

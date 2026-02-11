# Stripe Webhook — Observability & Disaster Recovery Runbook

## 1. Verify health (errors in last 24h)

```sql
SELECT event_id, event_type, status, received_at, processed_at, error
FROM public.stripe_webhook_events
WHERE status = 'error'
  AND received_at > now() - interval '24 hours'
ORDER BY received_at DESC;
```

For counts by status:

```sql
SELECT status, count(*)
FROM public.stripe_webhook_events
WHERE received_at > now() - interval '24 hours'
GROUP BY status;
```

## 2. Detect retries / duplicates

- **By event_id**: Each `event_id` must appear at most once (unique constraint). Duplicate deliveries are recorded as one row and short-circuited; no second row is created.
- **By status**: Duplicates are not re-processed; they are logged as `status = 'ignored'` (or the row already exists with `received`/`success`/`error`). To see events that were received but not processed (e.g. duplicate):

  - Rows with `status = 'received'` that never got `processed_at` can indicate a crash before completion; re-run replay for that `event_id` if needed.
  - For “same event delivered multiple times”: only one row per `event_id`; check logs for `"status":"ignored"` and `duration_ms` to confirm duplicate handling.

## 3. Replay a single event (admin-only)

Replay is **only** enabled when the request includes header `x-replay-token` whose value matches the `REPLAY_TOKEN` environment variable set for the Edge Function. No new public endpoint: same webhook URL, guarded by this header.

**Placeholders:** replace `YOUR_SUPABASE_FUNCTION_URL`, `YOUR_REPLAY_TOKEN`, and `evt_xxxxxxxxxxxxx` with your values.

```bash
curl -X POST "YOUR_SUPABASE_FUNCTION_URL/functions/v1/stripe_webhook" \
  -H "Content-Type: application/json" \
  -H "x-replay-token: YOUR_REPLAY_TOKEN" \
  -d '{"event_id":"evt_xxxxxxxxxxxxx"}'
```

- Success: response `200` with body `{"ok":true,"replay":true}`.
- Stripe fetch failure (e.g. invalid event_id): `200` with `{"ok":true,"replay":true,"error":"..."}`. Audit row is updated to `status = 'error'`.

## 4. What NOT to do

- **Do not return 5xx** after signature verification. All responses after verifying the Stripe signature must be `200` so Stripe does not retry and cause duplicate processing.
- **Do not disable or drop the unique constraint** on `event_id` (or `stripe_event_id` if that is your column). Idempotency and duplicate detection depend on it.
- Do not log secrets (e.g. `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`) or full raw payloads.
- Do not change the webhook URL or signature verification logic when adding observability or replay.

## 5. Rollback guidance

- **RLS (membership / webhook tables):** Rollback migration `20250208120001_rls_harden_stripe_membership_rollback.sql` drops RLS policies and disables RLS on `stripe_webhook_events`, `memberships`, and `membership_verifications`. Run it only if you need to revert RLS; re-enabling RLS later requires re-running the primary RLS migration.
- **Observability (indexes/columns):** Migration `20250208120100_stripe_webhook_events_observability.sql` adds columns (if missing) and indexes with `IF NOT EXISTS`. To revert indexes only: `DROP INDEX IF EXISTS idx_stripe_webhook_events_event_id;` (and the other three indexes). Do not drop the unique index if it is the only unique constraint on `event_id`.

---

## Verification checklist

- [ ] **Generate test event in Stripe** (e.g. Dashboard → Developers → Webhooks → send test event, or use a test mode event). Confirm a row appears in `stripe_webhook_events` and transitions to `status = 'success'` (and `processed_at` set).
- [ ] **Confirm duplicates do not create new rows:** Send the same event twice (e.g. replay same `event_id` or retry from Stripe). There must remain a single row per `event_id`; second request returns `200` and is logged as `status = 'ignored'` or short-circuited.
- [ ] **Confirm anon cannot read webhook table:** If RLS is enabled, as `anon` key: `SELECT * FROM stripe_webhook_events` must return 0 rows (or permission denied).
- [ ] **Replay mode with correct token:** Call the webhook URL with `x-replay-token: <REPLAY_TOKEN>` and body `{"event_id":"evt_..."}`. Response must be `200` with `{"ok":true,"replay":true}` and the event processed (or error in body if Stripe fetch failed).
- [ ] **Replay mode without token / wrong token:** Omit `x-replay-token` or use a wrong value. Request must be treated as a normal Stripe webhook (signature required); no replay processing. Replay must fail closed without the correct token.

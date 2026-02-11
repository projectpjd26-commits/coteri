-- Scan event log: append-only, analytics-ready.
-- INSERT only; never update or delete in normal operation.
-- benefits is a snapshot of benefit_label at scan time (informational only).

CREATE TABLE IF NOT EXISTS public.venue_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  membership_id uuid,
  tier_key text,
  scan_result text NOT NULL CHECK (scan_result IN ('valid', 'invalid')),
  benefits jsonb,
  scanned_at timestamptz DEFAULT now(),
  source text
);

-- Nullable membership_id/tier_key for invalid scans (no active membership).
COMMENT ON COLUMN public.venue_scan_events.membership_id IS 'Null when scan_result is invalid';
COMMENT ON COLUMN public.venue_scan_events.tier_key IS 'Null when scan_result is invalid';

CREATE INDEX IF NOT EXISTS idx_venue_scan_events_venue_scanned_at
  ON public.venue_scan_events (venue_id, scanned_at);
CREATE INDEX IF NOT EXISTS idx_venue_scan_events_membership_id
  ON public.venue_scan_events (membership_id);
CREATE INDEX IF NOT EXISTS idx_venue_scan_events_scan_result
  ON public.venue_scan_events (scan_result);

-- RLS: no anon/authenticated access; verification uses service_role (bypasses RLS).
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.venue_scan_events'::regclass) THEN
    ALTER TABLE public.venue_scan_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

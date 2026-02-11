-- Lightweight venue intelligence: benefit-level signals (read-only analytics helper).
-- Inserted best-effort with scan logging; no foreign enforcement beyond scan_id.

CREATE TABLE IF NOT EXISTS public.venue_benefit_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  benefit_key text NOT NULL,
  tier_key text,
  scan_id uuid NOT NULL REFERENCES public.venue_scan_events(id) ON DELETE CASCADE,
  scanned_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_benefit_signals_venue_id
  ON public.venue_benefit_signals (venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_benefit_signals_benefit_key
  ON public.venue_benefit_signals (benefit_key);
CREATE INDEX IF NOT EXISTS idx_venue_benefit_signals_tier_key
  ON public.venue_benefit_signals (tier_key);
CREATE INDEX IF NOT EXISTS idx_venue_benefit_signals_scanned_at
  ON public.venue_benefit_signals (scanned_at);

COMMENT ON TABLE public.venue_benefit_signals IS
  'Denormalized benefit-level view of scan events. Supports: Which benefits drive scans? Which tiers engage most? No enforcement.';

-- Part 2 & 3: Venue value narrative + member engagement (derived, not stored)
COMMENT ON TABLE public.venue_scan_events IS
  'Primary event log for membership verification. Supports analytics on access frequency, benefit exposure, and venue engagement. Derived metrics (no stored counters): scans_per_member (rolling 7/30d), repeat_member_rate, first_seen_at vs last_seen_at. No enforcement or redemption semantics.';

COMMENT ON COLUMN public.venue_scan_events.benefit_exposure IS
  'True when benefits were surfaced to staff. Does not imply fulfillment, redemption, or reward delivery.';

-- Example analytics (derived, no stored counters):
-- scans_per_member (rolling): SELECT user_id, COUNT(*) FROM venue_scan_events WHERE venue_id = $1 AND scanned_at >= now() - interval '7 day' GROUP BY user_id;
-- repeat_member_rate: ratio of users with COUNT(*) > 1 over total users in period.
-- first_seen_at / last_seen_at: SELECT user_id, min(scanned_at), max(scanned_at) FROM venue_scan_events WHERE venue_id = $1 GROUP BY user_id;

-- Harden scan event semantics + analytics clarity (additive, backward compatible).
-- Part 1: Semantic clarity
ALTER TABLE public.venue_scan_events
  ADD COLUMN IF NOT EXISTS membership_valid boolean,
  ADD COLUMN IF NOT EXISTS venue_context_resolved boolean DEFAULT true;

-- Part 2: Benefit intent clarity (exposure = shown/surfaced, not redemption)
ALTER TABLE public.venue_scan_events
  ADD COLUMN IF NOT EXISTS benefit_exposure boolean DEFAULT true;

-- Part 3: Source normalization safety
ALTER TABLE public.venue_scan_events
  DROP CONSTRAINT IF EXISTS scan_source_check;
ALTER TABLE public.venue_scan_events
  ADD CONSTRAINT scan_source_check CHECK (source IS NULL OR source IN ('qr', 'paste', 'code'));

-- Backfill existing rows (safe defaults)
UPDATE public.venue_scan_events
SET
  membership_valid = (scan_result = 'valid'),
  venue_context_resolved = COALESCE(venue_context_resolved, true),
  benefit_exposure = COALESCE(benefit_exposure, (scan_result = 'valid' AND benefits IS NOT NULL AND jsonb_array_length(benefits) > 0))
WHERE membership_valid IS NULL
   OR venue_context_resolved IS NULL
   OR benefit_exposure IS NULL;

COMMENT ON COLUMN public.venue_scan_events.membership_valid IS 'Entitlement truth: membership was valid at scan time';
COMMENT ON COLUMN public.venue_scan_events.venue_context_resolved IS 'System context health: venue_id was resolved';
COMMENT ON COLUMN public.venue_scan_events.benefit_exposure IS 'Benefits were shown/surfaced to staff; NOT redemption or fulfillment';

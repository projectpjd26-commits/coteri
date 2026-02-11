-- Venue redemptions: when a member uses a reward/benefit at the venue.
-- Append-only; recorded when staff marks a benefit as used. No change to existing tables.

CREATE TABLE IF NOT EXISTS public.venue_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  benefit_key text NOT NULL,
  tier_key text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.venue_redemptions IS 'Record when a member uses a tier benefit (e.g. free pint, skip the line).';
COMMENT ON COLUMN public.venue_redemptions.benefit_key IS 'Stable key matching venue_tier_benefits.benefit_key if needed for reporting.';

CREATE INDEX IF NOT EXISTS idx_venue_redemptions_venue_redeemed
  ON public.venue_redemptions (venue_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_redemptions_user_venue
  ON public.venue_redemptions (user_id, venue_id, redeemed_at DESC);

ALTER TABLE public.venue_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_redemptions_select_own" ON public.venue_redemptions;
CREATE POLICY "venue_redemptions_select_own"
  ON public.venue_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: no policy for authenticated => only service_role (e.g. staff UI) can write.

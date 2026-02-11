-- Venue Tiered Benefits v1: data model only.
-- tier_key must match membership tier values (e.g. supporter, vip, founder).
-- benefit_key is internal/stable; never shown to staff.

-- Optional: venues table so verification can resolve venue_id by name (single-venue app).
CREATE TABLE IF NOT EXISTS public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_venues_name ON public.venues (name);

-- venue_tier_benefits: which benefits each tier gets at a venue
CREATE TABLE IF NOT EXISTS public.venue_tier_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  tier_key text NOT NULL,
  benefit_key text NOT NULL,
  benefit_label text NOT NULL,
  description text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (venue_id, tier_key, benefit_key)
);

CREATE INDEX IF NOT EXISTS idx_venue_tier_benefits_venue_tier_active
  ON public.venue_tier_benefits (venue_id, tier_key, active);
CREATE INDEX IF NOT EXISTS idx_venue_tier_benefits_venue_active
  ON public.venue_tier_benefits (venue_id, active);

-- Optional: allow memberships to carry tier (and optionally venue_id) for benefit resolution.
-- Webhook is unchanged; these are nullable and not set by Stripe.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'tier') THEN
    ALTER TABLE public.memberships ADD COLUMN tier text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'venue_id') THEN
    ALTER TABLE public.memberships ADD COLUMN venue_id uuid REFERENCES public.venues(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS: venue_tier_benefits and venues are read-only for verification (service_role used there).
-- No anon/authenticated policies => only service_role can read; or add SELECT for authenticated if needed.
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.venues'::regclass) THEN
    ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.venue_tier_benefits'::regclass) THEN
    ALTER TABLE public.venue_tier_benefits ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Allow service_role and optionally authenticated to read (verification uses service_role)
DROP POLICY IF EXISTS "venues_select_all" ON public.venues;
CREATE POLICY "venues_select_all" ON public.venues FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "venue_tier_benefits_select_all" ON public.venue_tier_benefits;
CREATE POLICY "venue_tier_benefits_select_all" ON public.venue_tier_benefits FOR SELECT TO authenticated USING (true);

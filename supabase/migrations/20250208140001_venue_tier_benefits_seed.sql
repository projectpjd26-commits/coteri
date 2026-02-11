-- Seed: demo venue "The Function SF" and tier benefits.
-- VIP: BOGO Pint, Priority Seating.
-- Founder: All VIP benefits + Free Merch.
-- Idempotent: venue by name/slug; benefits by (venue_id, tier_key, benefit_key).
-- Handles venues with or without slug column.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'slug') THEN
    INSERT INTO public.venues (name, slug)
    VALUES ('The Function SF', 'the-function-sf')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
  ELSE
    INSERT INTO public.venues (name)
    VALUES ('The Function SF')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- tier_key lowercase to match membership tier values
INSERT INTO public.venue_tier_benefits (venue_id, tier_key, benefit_key, benefit_label, description, sort_order, active)
SELECT v.id, t.tier_key, t.benefit_key, t.benefit_label, t.description, t.sort_order, true
FROM public.venues v
CROSS JOIN (VALUES
  ('vip', 'bogo_pint', 'BOGO Pint', NULL::text, 10),
  ('vip', 'priority_seating', 'Priority Seating', NULL::text, 20),
  ('founder', 'bogo_pint', 'BOGO Pint', NULL::text, 10),
  ('founder', 'priority_seating', 'Priority Seating', NULL::text, 20),
  ('founder', 'free_merch', 'Free Merch', NULL::text, 30)
) AS t(tier_key, benefit_key, benefit_label, description, sort_order)
WHERE v.name = 'The Function SF'
ON CONFLICT (venue_id, tier_key, benefit_key) DO NOTHING;

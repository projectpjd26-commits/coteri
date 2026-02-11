-- Pilot #2: The Starry Plough (https://thestarryplough.com/)
-- Berkeley pub & nightclub — Irish music, poetry slam, open mic. Idempotent.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'slug'
  ) THEN
    INSERT INTO public.venues (name, slug, is_demo)
    VALUES ('The Starry Plough', 'the-starry-plough', true)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_demo = EXCLUDED.is_demo;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'name'
  ) THEN
    INSERT INTO public.venues (name, is_demo)
    VALUES ('The Starry Plough', true)
    ON CONFLICT (name) DO UPDATE SET is_demo = true;
  END IF;
END $$;

-- Branding: match venue theme (sage green, pub vibe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'brand_primary_color') THEN
    UPDATE public.venues
    SET brand_primary_color = '#5a8c69'
    WHERE name = 'The Starry Plough' AND (brand_primary_color IS NULL OR brand_primary_color = '');
  END IF;
END $$;

-- Tier benefits: pub-appropriate (Supporter / VIP / Founder)
INSERT INTO public.venue_tier_benefits (venue_id, tier_key, benefit_key, benefit_label, description, sort_order, active)
SELECT v.id, t.tier_key, t.benefit_key, t.benefit_label, t.description, t.sort_order, true
FROM public.venues v
CROSS JOIN (VALUES
  ('supporter', 'member_access', 'Member access', 'Scan at door for entry', 0),
  ('vip', 'free_house_pint', 'Free house pint', 'One complimentary house pint per visit', 10),
  ('vip', 'priority_sessions', 'Priority at sessions', 'Get seated first at Irish sessions & open mic', 20),
  ('founder', 'free_house_pint', 'Free house pint', 'One complimentary house pint per visit', 10),
  ('founder', 'priority_sessions', 'Priority at sessions', 'Get seated first at Irish sessions & open mic', 20),
  ('founder', 'skip_the_line', 'Skip the line', 'Priority entry on show nights', 30)
) AS t(tier_key, benefit_key, benefit_label, description, sort_order)
WHERE v.name = 'The Starry Plough'
ON CONFLICT (venue_id, tier_key, benefit_key) DO NOTHING;

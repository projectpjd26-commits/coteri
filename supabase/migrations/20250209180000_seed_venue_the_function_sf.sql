-- Ensure "The Function SF" venue exists (idempotent).
-- Handles venues table with or without slug column.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'slug'
  ) THEN
    INSERT INTO public.venues (name, slug)
    VALUES ('The Function SF', 'the-function-sf')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'name'
  ) THEN
    INSERT INTO public.venues (name)
    VALUES ('The Function SF')
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

-- Apply demo branding if columns exist (matches 20250209160000_venues_branding).
UPDATE public.venues
SET brand_primary_color = '#2d2d2d'
WHERE name = 'The Function SF'
  AND (brand_primary_color IS NULL OR brand_primary_color = '')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'venues' AND column_name = 'brand_primary_color');

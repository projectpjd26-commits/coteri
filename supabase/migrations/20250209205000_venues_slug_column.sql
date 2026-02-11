-- Ensure venues has slug column (app and display_names migration expect it).
-- Idempotent: ADD COLUMN IF NOT EXISTS; backfill from name when slug is null.

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS slug text NULL;

UPDATE public.venues
SET slug = lower(regexp_replace(trim(name), '\s+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL AND trim(name) <> '';

UPDATE public.venues
SET slug = 'venue-' || id::text
WHERE slug IS NULL OR trim(slug) = '';

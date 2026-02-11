-- Optional venue branding for wallet passes (best-effort, never required).
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS brand_primary_color text NULL,
  ADD COLUMN IF NOT EXISTS brand_logo_url text NULL;

COMMENT ON COLUMN public.venues.brand_primary_color IS 'Hex color for wallet pass background/foreground; e.g. #2d2d2d';
COMMENT ON COLUMN public.venues.brand_logo_url IS 'Public URL for venue logo used on Apple/Google wallet passes';

-- Demo: "The Function SF" branding (data-driven, no hard-coding in app logic).
UPDATE public.venues
SET
  brand_primary_color = '#2d2d2d',
  brand_logo_url = NULL
WHERE name = 'The Function SF'
  AND (brand_primary_color IS NULL AND brand_logo_url IS NULL);

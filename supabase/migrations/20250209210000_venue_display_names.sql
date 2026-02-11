-- Normalize pilot venue display names so the UI shows "The Function SF" and "The Starry Plough".
-- Idempotent: safe to re-run.

UPDATE public.venues SET name = 'The Function SF' WHERE slug = 'the-function-sf';
UPDATE public.venues SET name = 'The Starry Plough' WHERE slug = 'the-starry-plough';

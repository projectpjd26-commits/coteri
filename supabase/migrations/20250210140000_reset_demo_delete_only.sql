-- Replace reset_demo() with a delete-only version so it works when auth.users
-- doesn't have the seed UUIDs (11111111-..., etc.). No INSERTs = no FK violation,
-- no trigger on insert. After reset, use "Grant membership" to get your own access.

CREATE OR REPLACE FUNCTION public.reset_demo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_events
  WHERE venue_id IN (SELECT id FROM public.venues WHERE is_demo = true);

  DELETE FROM public.memberships
  WHERE venue_id IN (SELECT id FROM public.venues WHERE is_demo = true);
END;
$$;

COMMENT ON FUNCTION public.reset_demo() IS 'Clears memberships and verification_events for demo venues only. No seed data inserted. Use Grant membership to get access again.';

-- RLS for venue_staff: authenticated users can only read their own staff rows.
-- Inserts/updates (e.g. demo seed, admin) use service_role and bypass RLS.

DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.venue_staff'::regclass) THEN
    ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "venue_staff_select_own" ON public.venue_staff;
CREATE POLICY "venue_staff_select_own"
  ON public.venue_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

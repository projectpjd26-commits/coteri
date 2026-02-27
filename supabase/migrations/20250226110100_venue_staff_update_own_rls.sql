-- Allow authenticated users to update their own venue_staff row (e.g. set their position/role).
-- Inserts and deletes remain service_role only (admin adds/removes staff).

DROP POLICY IF EXISTS "venue_staff_update_own" ON public.venue_staff;
CREATE POLICY "venue_staff_update_own"
  ON public.venue_staff FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "venue_staff_update_own" ON public.venue_staff IS 'Staff can update their own row to change their position (e.g. owner vs waiter).';

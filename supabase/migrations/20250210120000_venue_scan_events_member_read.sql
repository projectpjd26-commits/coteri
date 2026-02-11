-- Allow members to read their own scan events (for dashboard "Your visits" / "Last scan").
-- Verification and inserts remain service_role only; no INSERT/UPDATE/DELETE for authenticated.

DROP POLICY IF EXISTS "Members can read own scan events" ON public.venue_scan_events;
CREATE POLICY "Members can read own scan events"
  ON public.venue_scan_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

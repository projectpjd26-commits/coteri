-- RLS Hardening: Stripe, membership, and verification tables
-- Assumptions:
--   - Edge Functions use SUPABASE_SERVICE_ROLE_KEY; service_role bypasses RLS (Supabase default).
--   - public.memberships has column user_id (uuid) = auth.uid() for the owning user. If your column
--     is different (e.g. owner_id), change the policy expressions below.
--   - Tables stripe_webhook_events, memberships, membership_verifications already exist.
-- Idempotent: safe to run multiple times (drops policies before create, enables RLS only when needed).

-- ---------------------------------------------------------------------------
-- 1) stripe_webhook_events: service_role only (no anon/authenticated access)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stripe_webhook_events'::regclass) THEN
    ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- No policies for anon or authenticated => they see no rows. service_role bypasses RLS => full access for Edge Functions.

-- ---------------------------------------------------------------------------
-- 2) memberships: auth.uid()-scoped access for authenticated users
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.memberships'::regclass) THEN
    ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
CREATE POLICY "memberships_select_own"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_insert_own" ON public.memberships;
CREATE POLICY "memberships_insert_own"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_update_own" ON public.memberships;
CREATE POLICY "memberships_update_own"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "memberships_delete_own" ON public.memberships;
CREATE POLICY "memberships_delete_own"
  ON public.memberships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3) membership_verifications: access only where membership belongs to user
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.membership_verifications'::regclass) THEN
    ALTER TABLE public.membership_verifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DROP POLICY IF EXISTS "membership_verifications_select_own" ON public.membership_verifications;
CREATE POLICY "membership_verifications_select_own"
  ON public.membership_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_verifications.membership_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "membership_verifications_insert_own" ON public.membership_verifications;
CREATE POLICY "membership_verifications_insert_own"
  ON public.membership_verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_verifications.membership_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "membership_verifications_update_own" ON public.membership_verifications;
CREATE POLICY "membership_verifications_update_own"
  ON public.membership_verifications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_verifications.membership_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_verifications.membership_id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "membership_verifications_delete_own" ON public.membership_verifications;
CREATE POLICY "membership_verifications_delete_own"
  ON public.membership_verifications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.id = membership_verifications.membership_id AND m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- VERIFICATION CHECKLIST (run after applying migration)
-- ---------------------------------------------------------------------------
-- • anon SELECT: SELECT * FROM stripe_webhook_events/memberships/membership_verifications => 0 rows (no anon policies).
-- • authenticated: only own rows (memberships.user_id = auth.uid(); verifications via own memberships).
-- • Stripe replay: webhook idempotent on event_id; handler uses update/upsert only => no duplicate data.
-- • Webhook: always returns 200 after signature verification (no 5xx).
-- RLS state: SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('stripe_webhook_events','memberships','membership_verifications'); => all true.
-- Smoke: trigger webhook with service_role; stripe_webhook_events row created/updated.

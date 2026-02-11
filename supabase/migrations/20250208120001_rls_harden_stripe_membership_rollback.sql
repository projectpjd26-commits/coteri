-- Rollback: RLS hardening for stripe_webhook_events, memberships, membership_verifications
-- Run this to remove RLS policies and disable RLS on these tables (restores pre-migration access).
-- Idempotent: DROP POLICY IF EXISTS is safe if policies were already removed.

-- membership_verifications: drop policies then disable RLS
DROP POLICY IF EXISTS "membership_verifications_select_own" ON public.membership_verifications;
DROP POLICY IF EXISTS "membership_verifications_insert_own" ON public.membership_verifications;
DROP POLICY IF EXISTS "membership_verifications_update_own" ON public.membership_verifications;
DROP POLICY IF EXISTS "membership_verifications_delete_own" ON public.membership_verifications;
ALTER TABLE public.membership_verifications DISABLE ROW LEVEL SECURITY;

-- memberships: drop policies then disable RLS
DROP POLICY IF EXISTS "memberships_select_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_insert_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_update_own" ON public.memberships;
DROP POLICY IF EXISTS "memberships_delete_own" ON public.memberships;
ALTER TABLE public.memberships DISABLE ROW LEVEL SECURITY;

-- stripe_webhook_events: no policies to drop; disable RLS
ALTER TABLE public.stripe_webhook_events DISABLE ROW LEVEL SECURITY;

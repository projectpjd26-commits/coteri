-- Run this in Supabase Dashboard → SQL Editor if you prefer not to use `supabase db push`.
-- Applies: scan events member read policy, venue_transactions, venue_redemptions.
-- Idempotent: safe to run more than once.

-- 1) Members can read own scan events
DROP POLICY IF EXISTS "Members can read own scan events" ON public.venue_scan_events;
CREATE POLICY "Members can read own scan events"
  ON public.venue_scan_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2) venue_transactions
CREATE TABLE IF NOT EXISTS public.venue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  amount_cents int,
  notes text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.venue_transactions IS 'Purchases at the venue (e.g. drinks). Use kind: drink, food, etc.';
COMMENT ON COLUMN public.venue_transactions.kind IS 'Transaction type: drink, food, merchandise, etc.';
COMMENT ON COLUMN public.venue_transactions.amount_cents IS 'Optional price in cents; null if not tracked';
CREATE INDEX IF NOT EXISTS idx_venue_transactions_venue_occurred ON public.venue_transactions (venue_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_transactions_user_venue ON public.venue_transactions (user_id, venue_id, occurred_at DESC);
ALTER TABLE public.venue_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_transactions_select_own" ON public.venue_transactions;
CREATE POLICY "venue_transactions_select_own"
  ON public.venue_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3) venue_redemptions
CREATE TABLE IF NOT EXISTS public.venue_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES public.memberships(id) ON DELETE SET NULL,
  benefit_key text NOT NULL,
  tier_key text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.venue_redemptions IS 'Record when a member uses a tier benefit (e.g. free pint, skip the line).';
COMMENT ON COLUMN public.venue_redemptions.benefit_key IS 'Stable key matching venue_tier_benefits.benefit_key if needed for reporting.';
CREATE INDEX IF NOT EXISTS idx_venue_redemptions_venue_redeemed ON public.venue_redemptions (venue_id, redeemed_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_redemptions_user_venue ON public.venue_redemptions (user_id, venue_id, redeemed_at DESC);
ALTER TABLE public.venue_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "venue_redemptions_select_own" ON public.venue_redemptions;
CREATE POLICY "venue_redemptions_select_own"
  ON public.venue_redemptions FOR SELECT TO authenticated USING (user_id = auth.uid());

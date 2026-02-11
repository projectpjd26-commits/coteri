-- Venue transactions: purchases at the venue (e.g. drinks per visit).
-- Append-only; recorded by staff/POS or service. No change to existing tables.

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

CREATE INDEX IF NOT EXISTS idx_venue_transactions_venue_occurred
  ON public.venue_transactions (venue_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_transactions_user_venue
  ON public.venue_transactions (user_id, venue_id, occurred_at DESC);

ALTER TABLE public.venue_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venue_transactions_select_own" ON public.venue_transactions;
CREATE POLICY "venue_transactions_select_own"
  ON public.venue_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE: no policy for authenticated => only service_role (e.g. staff API, POS) can write.

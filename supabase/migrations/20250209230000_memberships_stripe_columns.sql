-- Align memberships with Stripe webhook and app: add expires_at and stripe_subscription_id if missing.
-- Idempotent: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NULL;

ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id
  ON public.memberships (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

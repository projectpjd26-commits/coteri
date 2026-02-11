-- Append-only audit table for membership verification attempts.
-- No triggers, RLS, or indexes unless required.

CREATE TABLE public.verification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  staff_user_id uuid NOT NULL REFERENCES auth.users(id),
  venue_id uuid NOT NULL REFERENCES public.venues(id),
  membership_id uuid REFERENCES public.memberships(id),
  result text NOT NULL CHECK (result IN ('valid', 'invalid')),
  raw_payload text NOT NULL
);

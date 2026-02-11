-- Add advisory soft-fraud flag columns to verification_events.
-- Backward-compatible: both columns nullable.

ALTER TABLE public.verification_events
  ADD COLUMN IF NOT EXISTS flag_reason text NULL;

ALTER TABLE public.verification_events
  ADD COLUMN IF NOT EXISTS flag_score integer NULL;

ALTER TABLE public.verification_events
  DROP CONSTRAINT IF EXISTS verification_events_flag_score_range;

ALTER TABLE public.verification_events
  ADD CONSTRAINT verification_events_flag_score_range
  CHECK (flag_score IS NULL OR (flag_score >= 0 AND flag_score <= 100));

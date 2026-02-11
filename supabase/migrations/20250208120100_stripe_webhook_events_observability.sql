-- Observability + indexes for stripe_webhook_events (idempotent).
-- Uses existing column name: event_id. Status values: received | success | ignored | error.
-- Does not create table; assumes table exists. Adds columns only if missing, indexes IF NOT EXISTS.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'event_type') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN event_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'received_at') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN received_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'processed_at') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN processed_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'status') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN status text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'error') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN error text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stripe_webhook_events' AND column_name = 'event_id') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN event_id text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON public.stripe_webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type
  ON public.stripe_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
  ON public.stripe_webhook_events (status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received_at
  ON public.stripe_webhook_events (received_at);

-- AI Analytics Layer: canonical event table for all signals (scans, membership lifecycle).
-- Append-only. Triggers populate from verification_events and memberships.
-- RLS: venue-scoped read (venue_staff); trigger writes run as invoker (authenticated or service_role).

CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'scan',
    'membership_created',
    'membership_expired',
    'membership_updated',
    'tier_changed'
  )),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analytics_events IS 'Canonical event stream for AI analytics; populated by triggers from verification_events and memberships.';

CREATE INDEX idx_analytics_events_venue_id ON public.analytics_events (venue_id);
CREATE INDEX idx_analytics_events_venue_created ON public.analytics_events (venue_id, created_at);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events (event_type) WHERE event_type = 'scan';

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- SELECT: venue staff can read events for their venue(s)
CREATE POLICY "analytics_events_select_venue_staff"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = analytics_events.venue_id AND vs.user_id = auth.uid()
    )
  );

-- INSERT: only via trigger (venue staff when they cause a scan; service_role for webhooks)
-- Allow authenticated if they are staff for this venue (trigger runs as invoker)
CREATE POLICY "analytics_events_insert_venue_staff"
  ON public.analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = analytics_events.venue_id AND vs.user_id = auth.uid()
    )
  );

-- No UPDATE/DELETE; append-only.

-- Trigger: on verification_events INSERT → emit one analytics_events row (scan)
CREATE OR REPLACE FUNCTION public.sync_analytics_events_on_scan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.membership_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id FROM public.memberships WHERE id = NEW.membership_id;
  END IF;
  INSERT INTO public.analytics_events (venue_id, user_id, event_type, metadata, created_at)
  VALUES (
    NEW.venue_id,
    v_user_id,
    'scan',
    jsonb_build_object('result', NEW.result, 'membership_id', NEW.membership_id, 'occurred_at', NEW.occurred_at),
    COALESCE(NEW.occurred_at, now())
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_analytics_events_on_scan() IS 'Emits one analytics_events row per verification_events insert for AI event stream.';

DROP TRIGGER IF EXISTS analytics_events_on_verification_events ON public.verification_events;
CREATE TRIGGER analytics_events_on_verification_events
  AFTER INSERT ON public.verification_events
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_analytics_events_on_scan();

-- Trigger: on memberships INSERT → membership_created
CREATE OR REPLACE FUNCTION public.sync_analytics_events_on_membership_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analytics_events (venue_id, user_id, event_type, metadata, created_at)
  VALUES (NEW.venue_id, NEW.user_id, 'membership_created', jsonb_build_object('tier', NEW.tier, 'status', NEW.status), now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS analytics_events_on_memberships_insert ON public.memberships;
CREATE TRIGGER analytics_events_on_memberships_insert
  AFTER INSERT ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_analytics_events_on_membership_insert();

-- Trigger: on memberships UPDATE → membership_expired / membership_updated / tier_changed
CREATE OR REPLACE FUNCTION public.sync_analytics_events_on_membership_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  evt text;
  meta jsonb;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'expired' THEN
    evt := 'membership_expired';
    meta := jsonb_build_object('previous_status', OLD.status, 'tier', NEW.tier);
  ELSIF OLD.tier IS DISTINCT FROM NEW.tier THEN
    evt := 'tier_changed';
    meta := jsonb_build_object('previous_tier', OLD.tier, 'new_tier', NEW.tier, 'status', NEW.status);
  ELSE
    evt := 'membership_updated';
    meta := jsonb_build_object('status', NEW.status, 'tier', NEW.tier);
  END IF;
  INSERT INTO public.analytics_events (venue_id, user_id, event_type, metadata, created_at)
  VALUES (NEW.venue_id, NEW.user_id, evt, meta, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS analytics_events_on_memberships_update ON public.memberships;
CREATE TRIGGER analytics_events_on_memberships_update
  AFTER UPDATE ON public.memberships
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status
    OR OLD.tier IS DISTINCT FROM NEW.tier
  )
  EXECUTE FUNCTION public.sync_analytics_events_on_membership_update();

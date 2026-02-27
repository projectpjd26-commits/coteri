-- AI Analytics Layer: feature store — venue health MV and member behavior features.
-- Refresh nightly via pg_cron or Supabase scheduled Edge Function.
-- Churn score is rule-based (no LLM).

-- 1. Venue health snapshot (per venue, per day) from analytics_events
CREATE MATERIALIZED VIEW public.venue_health_daily AS
SELECT
  venue_id,
  (created_at AT TIME ZONE 'UTC')::date AS as_of,
  count(*) FILTER (WHERE event_type = 'scan')::int AS scans_today,
  count(DISTINCT user_id) FILTER (WHERE event_type = 'scan' AND user_id IS NOT NULL)::int AS unique_members_today,
  round(
    (count(*) FILTER (WHERE event_type = 'scan')::numeric / nullif(count(DISTINCT user_id) FILTER (WHERE event_type = 'scan' AND user_id IS NOT NULL), 0)),
    2
  ) AS avg_visits_per_member
FROM public.analytics_events
GROUP BY venue_id, (created_at AT TIME ZONE 'UTC')::date;

CREATE UNIQUE INDEX idx_venue_health_daily_venue_as_of ON public.venue_health_daily (venue_id, as_of);

COMMENT ON MATERIALIZED VIEW public.venue_health_daily IS 'Per-venue, per-day health metrics for AI feature store. Refresh nightly.';

-- 2. Member behavior features table (populated by refresh; churn score computed in SQL)
CREATE TABLE public.member_behavior_features (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  visits_30d int NOT NULL DEFAULT 0,
  visits_90d int NOT NULL DEFAULT 0,
  last_visit_at timestamptz,
  days_since_last_visit int,
  churn_risk_score float NOT NULL DEFAULT 0 CHECK (churn_risk_score >= 0 AND churn_risk_score <= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, venue_id)
);

COMMENT ON TABLE public.member_behavior_features IS 'Per-member, per-venue behavior features for churn and AI. Refresh nightly; churn_risk_score is rule-based.';

CREATE INDEX idx_member_behavior_features_venue_churn ON public.member_behavior_features (venue_id, churn_risk_score DESC);

-- RLS: venue staff can read features for their venue(s)
ALTER TABLE public.member_behavior_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_behavior_features_select_venue_staff"
  ON public.member_behavior_features FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = member_behavior_features.venue_id AND vs.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE for authenticated; only refresh function (run as service_role or migration owner) writes.

-- 3. Refresh function: compute features from verification_events (+ memberships for user/venue) and upsert with churn score
-- Uses verification_events so historical data is included without backfilling analytics_events.
CREATE OR REPLACE FUNCTION public.refresh_member_behavior_features()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH agg AS (
    SELECT
      m.user_id,
      m.venue_id,
      count(*) FILTER (WHERE e.occurred_at >= now() - interval '30 days')::int AS visits_30d,
      count(*) FILTER (WHERE e.occurred_at >= now() - interval '90 days')::int AS visits_90d,
      max(e.occurred_at) AS last_visit_at
    FROM public.verification_events e
    JOIN public.memberships m ON m.id = e.membership_id
    WHERE e.result = 'valid'
    GROUP BY m.user_id, m.venue_id
  ),
  with_days AS (
    SELECT
      user_id,
      venue_id,
      visits_30d,
      visits_90d,
      last_visit_at,
      extract(day from (now() - last_visit_at))::int AS days_since_last_visit
    FROM agg
  ),
  with_score AS (
    SELECT
      user_id,
      venue_id,
      visits_30d,
      visits_90d,
      last_visit_at,
      days_since_last_visit,
      CASE
        WHEN days_since_last_visit > 30 AND visits_30d = 0 THEN 1.0
        WHEN days_since_last_visit > 14 AND visits_30d < 2 THEN 0.6
        WHEN days_since_last_visit > 7 AND visits_30d = 0 THEN 0.4
        ELSE 0.0
      END::float AS churn_risk_score
    FROM with_days
  )
  INSERT INTO public.member_behavior_features (
    user_id, venue_id, visits_30d, visits_90d, last_visit_at, days_since_last_visit, churn_risk_score, updated_at
  )
  SELECT user_id, venue_id, visits_30d, visits_90d, last_visit_at, days_since_last_visit, churn_risk_score, now()
  FROM with_score
  ON CONFLICT (user_id, venue_id) DO UPDATE SET
    visits_30d = EXCLUDED.visits_30d,
    visits_90d = EXCLUDED.visits_90d,
    last_visit_at = EXCLUDED.last_visit_at,
    days_since_last_visit = EXCLUDED.days_since_last_visit,
    churn_risk_score = EXCLUDED.churn_risk_score,
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.refresh_member_behavior_features() IS 'Upserts member_behavior_features from verification_events; run nightly.';

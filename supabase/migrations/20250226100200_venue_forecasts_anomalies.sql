-- AI Analytics Layer: predictive outputs — forecasts and anomalies.
-- Populated by scheduled job (cron or Edge Function). RLS: venue-scoped.

-- 1. Attendance forecasts (next 7 days per venue)
CREATE TABLE public.venue_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  forecast_date date NOT NULL,
  predicted_scans int NOT NULL,
  confidence_low int,
  confidence_high int,
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venue_id, forecast_date)
);

COMMENT ON TABLE public.venue_forecasts IS 'Per-venue, per-day attendance predictions; filled by nightly/scheduled job.';

CREATE INDEX idx_venue_forecasts_venue_generated ON public.venue_forecasts (venue_id, generated_at DESC);

ALTER TABLE public.venue_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_forecasts_select_venue_staff"
  ON public.venue_forecasts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = venue_forecasts.venue_id AND vs.user_id = auth.uid()
    )
  );

-- 2. Anomaly log (drops, spikes, etc.)
CREATE TABLE public.venue_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  detected_at timestamptz NOT NULL DEFAULT now(),
  anomaly_type text NOT NULL CHECK (anomaly_type IN ('attendance_drop', 'attendance_spike', 'velocity_drop', 'velocity_spike')),
  severity_score float NOT NULL CHECK (severity_score >= 0 AND severity_score <= 1),
  metadata jsonb DEFAULT '{}'
);

COMMENT ON TABLE public.venue_anomalies IS 'Detected anomalies per venue for dashboard and LLM insight generator.';

CREATE INDEX idx_venue_anomalies_venue_detected ON public.venue_anomalies (venue_id, detected_at DESC);

ALTER TABLE public.venue_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_anomalies_select_venue_staff"
  ON public.venue_anomalies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = venue_anomalies.venue_id AND vs.user_id = auth.uid()
    )
  );

-- 3. Optional: function to run simple forecast (e.g. 7-day moving average) and anomaly (z-score) — call from cron/Edge
CREATE OR REPLACE FUNCTION public.refresh_venue_forecasts(p_venue_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venue_id uuid;
  v_avg float;
  v_low int;
  v_high int;
  d date;
BEGIN
  FOR v_venue_id IN
    SELECT DISTINCT venue_id FROM public.venue_daily_scans
    WHERE (p_venue_id IS NULL OR venue_id = p_venue_id)
  LOOP
    SELECT avg(approved_scans)::float INTO v_avg
    FROM public.venue_daily_scans
    WHERE venue_id = v_venue_id AND day >= now() - interval '28 days';
    v_avg := COALESCE(v_avg, 0);
    v_low := greatest(0, floor(v_avg * 0.7)::int);
    v_high := ceil(v_avg * 1.3)::int;
    FOR d IN SELECT generate_series((current_date + 1)::date, (current_date + 7)::date, '1 day'::interval)::date
    LOOP
      INSERT INTO public.venue_forecasts (venue_id, forecast_date, predicted_scans, confidence_low, confidence_high, generated_at)
      VALUES (v_venue_id, d, round(v_avg)::int, v_low, v_high, now())
      ON CONFLICT (venue_id, forecast_date) DO UPDATE SET
        predicted_scans = EXCLUDED.predicted_scans,
        confidence_low = EXCLUDED.confidence_low,
        confidence_high = EXCLUDED.confidence_high,
        generated_at = now();
    END LOOP;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.refresh_venue_forecasts(uuid) IS 'Fills venue_forecasts with simple 28d-avg forecast for next 7 days; run nightly.';

CREATE OR REPLACE FUNCTION public.detect_venue_anomalies(p_venue_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_mean float;
  v_std float;
  v_today int;
  v_severity float;
BEGIN
  FOR r IN
    SELECT vds.venue_id, vds.day, vds.approved_scans
    FROM public.venue_daily_scans vds
    WHERE vds.day = (current_date AT TIME ZONE 'UTC')
      AND (p_venue_id IS NULL OR vds.venue_id = p_venue_id)
  LOOP
    SELECT avg(approved_scans)::float, stddev(approved_scans)::float
    INTO v_mean, v_std
    FROM public.venue_daily_scans
    WHERE venue_id = r.venue_id AND day >= (current_date AT TIME ZONE 'UTC') - interval '14 days' AND day < r.day;
    v_std := COALESCE(NULLIF(v_std, 0), 1);
    v_today := r.approved_scans;
    IF v_mean IS NOT NULL AND v_today < (v_mean - 2.5 * v_std) THEN
      v_severity := least(1.0, (v_mean - v_today) / (2.5 * v_std));
      INSERT INTO public.venue_anomalies (venue_id, anomaly_type, severity_score, metadata)
      VALUES (r.venue_id, 'attendance_drop', v_severity, jsonb_build_object('today', v_today, 'mean_14d', v_mean, 'std_14d', v_std));
    ELSIF v_mean IS NOT NULL AND v_today > (v_mean + 2.5 * v_std) THEN
      v_severity := least(1.0, (v_today - v_mean) / (2.5 * v_std));
      INSERT INTO public.venue_anomalies (venue_id, anomaly_type, severity_score, metadata)
      VALUES (r.venue_id, 'attendance_spike', v_severity, jsonb_build_object('today', v_today, 'mean_14d', v_mean, 'std_14d', v_std));
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.detect_venue_anomalies(uuid) IS 'Inserts venue_anomalies when today''s scans are >2.5 std dev from 14d mean; run daily.';

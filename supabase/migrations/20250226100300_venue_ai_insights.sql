-- AI Analytics Layer: LLM-generated insights (batch write-only; app reads).
-- Populated by nightly batch job; never mutated by app. RLS: venue-scoped.

CREATE TABLE public.venue_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  summary_text text NOT NULL,
  recommendations jsonb DEFAULT '[]'
);

COMMENT ON TABLE public.venue_ai_insights IS 'Batch-generated AI insights per venue; write-only from AI job, read by dashboard.';

CREATE INDEX idx_venue_ai_insights_venue_generated ON public.venue_ai_insights (venue_id, generated_at DESC);

ALTER TABLE public.venue_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venue_ai_insights_select_venue_staff"
  ON public.venue_ai_insights FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_staff vs
      WHERE vs.venue_id = venue_ai_insights.venue_id AND vs.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE for authenticated; only batch job (service_role) writes.

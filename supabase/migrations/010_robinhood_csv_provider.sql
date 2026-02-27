-- Provider registry for CSV ingest (robinhood_csv). Run in the same Supabase project as the app that shows "Provider robinhood_csv not found".

CREATE TABLE IF NOT EXISTS ingest_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO ingest_providers (key, name)
VALUES ('robinhood_csv', 'Robinhood (CSV)')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE ingest_providers IS 'Registry of data/ingest providers (e.g. robinhood_csv, fidelity_csv) so Settings can look them up by key.';

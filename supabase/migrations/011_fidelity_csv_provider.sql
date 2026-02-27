-- Provider registry: fidelity_csv. Run in the same Supabase project as the app that shows "Provider fidelity_csv not found".

INSERT INTO ingest_providers (key, name)
VALUES ('fidelity_csv', 'Fidelity (CSV)')
ON CONFLICT (key) DO NOTHING;

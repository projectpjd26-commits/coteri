-- Initialize migration history table (run once in SQL Editor if you apply migrations by hand).
-- Use this so Supabase has the schema; table name is schema_migrations (not "schera_migrations").
-- PostgreSQL does not support "IF SELECT ... returns no rows" — use CREATE IF NOT EXISTS / INSERT ... WHERE NOT EXISTS.

CREATE SCHEMA IF NOT EXISTS supabase_migrations;

CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version TEXT PRIMARY KEY
);

-- Optional: record the CSV import migration so the CLI knows it was applied (if you ran 20250212100000_csv_imports.sql by hand):
-- INSERT INTO supabase_migrations.schema_migrations (version)
-- SELECT '20250212100000'
-- WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20250212100000');

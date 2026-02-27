-- Generic CSV imports: store any aggregate/CSV upload per user.
-- RLS: users can only read/write their own imports.

CREATE TABLE csv_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  filename TEXT NOT NULL,
  row_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE csv_import_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id UUID NOT NULL REFERENCES csv_imports(id) ON DELETE CASCADE,
  line_index INT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_csv_imports_user_id ON csv_imports(user_id);
CREATE INDEX idx_csv_import_rows_import_id ON csv_import_rows(import_id);

ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_import_rows ENABLE ROW LEVEL SECURITY;

CREATE POLICY csv_imports_user ON csv_imports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY csv_import_rows_via_import ON csv_import_rows
  FOR ALL USING (
    EXISTS (SELECT 1 FROM csv_imports i WHERE i.id = import_id AND i.user_id = auth.uid())
  );

COMMENT ON TABLE csv_imports IS 'Generic/aggregate CSV uploads; one row per file.';
COMMENT ON TABLE csv_import_rows IS 'Parsed rows from a CSV import; data is flexible JSON per row.';

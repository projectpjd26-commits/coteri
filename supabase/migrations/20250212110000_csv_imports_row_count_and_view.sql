-- 1. Trigger: keep csv_imports.row_count in sync when csv_import_rows change.

CREATE OR REPLACE FUNCTION csv_imports_refresh_row_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE csv_imports
    SET row_count = (
      SELECT count(*)::int FROM csv_import_rows WHERE import_id = OLD.import_id
    )
    WHERE id = OLD.import_id;
    RETURN OLD;
  ELSE
    UPDATE csv_imports
    SET row_count = (
      SELECT count(*)::int FROM csv_import_rows WHERE import_id = NEW.import_id
    )
    WHERE id = NEW.import_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER csv_import_rows_count_trigger
  AFTER INSERT OR DELETE ON csv_import_rows
  FOR EACH ROW
  EXECUTE FUNCTION csv_imports_refresh_row_count();

COMMENT ON FUNCTION csv_imports_refresh_row_count() IS 'Updates csv_imports.row_count when rows are inserted or deleted in csv_import_rows.';

-- 2. View: flatten JSONB for positions (Platform, Symbol, Name, Quantity, Price, Equity_Value_USD).

CREATE OR REPLACE VIEW csv_import_positions AS
SELECT
  i.id AS import_id,
  i.user_id,
  i.name AS import_name,
  i.filename,
  r.id AS row_id,
  r.line_index,
  (r.data->>'Platform')   AS platform,
  (r.data->>'Symbol')    AS symbol,
  (r.data->>'Name')      AS name,
  (r.data->>'Quantity')  AS quantity_str,
  (r.data->>'Price')     AS price_str,
  (r.data->>'Equity_Value_USD') AS equity_value_usd_str,
  -- parsed numbers for filtering/sorting (NULL if not numeric)
  (r.data->>'Quantity')::numeric   AS quantity_num,
  (r.data->>'Price')::numeric     AS price_num,
  (r.data->>'Equity_Value_USD')::numeric AS equity_value_usd_num
FROM csv_imports i
JOIN csv_import_rows r ON r.import_id = i.id;

COMMENT ON VIEW csv_import_positions IS 'Flattened view of csv_import_rows.data for positions (Platform, Symbol, Name, Quantity, Price, Equity_Value_USD). Use quantity_num / equity_value_usd_num for numeric filters.';

-- RLS: view uses underlying tables, so same RLS applies (user sees only own imports).
ALTER VIEW csv_import_positions SET (security_invoker = on);

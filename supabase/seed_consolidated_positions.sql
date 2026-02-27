-- Seed initial position data from consolidated_positions.csv.
-- Uses the first auth user; run once in SQL Editor (or replace the user subquery with your user id).

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
),
new_import AS (
  INSERT INTO csv_imports (user_id, name, filename, row_count)
  SELECT id, 'Consolidated positions', 'consolidated_positions.csv', 24
  FROM first_user
  RETURNING id
)
INSERT INTO csv_import_rows (import_id, line_index, data)
SELECT ni.id, g.line_index, g.data
FROM new_import ni
CROSS JOIN (
  VALUES
    (0, '{"Platform":"Robinhood","Symbol":"MSTR","Name":"Strategy Inc.","Quantity":"50","Price":"","Equity_Value_USD":"6189.0"}'::jsonb),
    (1, '{"Platform":"Robinhood","Symbol":"ONDS","Name":"Ondas Inc.","Quantity":"500","Price":"","Equity_Value_USD":"4450.0"}'::jsonb),
    (2, '{"Platform":"Robinhood","Symbol":"IBIT","Name":"iShares Bitcoin Trust ETF","Quantity":"68.466","Price":"","Equity_Value_USD":"2576.38"}'::jsonb),
    (3, '{"Platform":"Robinhood","Symbol":"NBIS","Name":"Nebius Group","Quantity":"25.317","Price":"","Equity_Value_USD":"2240.55"}'::jsonb),
    (4, '{"Platform":"Robinhood","Symbol":"IREN","Name":"IREN Limited","Quantity":"50","Price":"","Equity_Value_USD":"2025.5"}'::jsonb),
    (5, '{"Platform":"Robinhood","Symbol":"SOFI","Name":"SoFi Technologies","Quantity":"100","Price":"","Equity_Value_USD":"1927.0"}'::jsonb),
    (6, '{"Platform":"Robinhood","Symbol":"ETHA","Name":"iShares Ethereum Trust ETF","Quantity":"120.034","Price":"","Equity_Value_USD":"1764.5"}'::jsonb),
    (7, '{"Platform":"Robinhood","Symbol":"VELO","Name":"Velo3D","Quantity":"150","Price":"","Equity_Value_USD":"1668.0"}'::jsonb),
    (8, '{"Platform":"Robinhood","Symbol":"SBET","Name":"Sharplink","Quantity":"200","Price":"","Equity_Value_USD":"1320.0"}'::jsonb),
    (9, '{"Platform":"Robinhood","Symbol":"PGY","Name":"Pagaya Technologies","Quantity":"100","Price":"","Equity_Value_USD":"1242.0"}'::jsonb),
    (10, '{"Platform":"Robinhood","Symbol":"BTC","Name":"Bitcoin","Quantity":"0.00789429","Price":"","Equity_Value_USD":"523.99"}'::jsonb),
    (11, '{"Platform":"Robinhood","Symbol":"WLFI","Name":"World Liberty Financial","Quantity":"506.0","Price":"","Equity_Value_USD":"51.84"}'::jsonb),
    (12, '{"Platform":"Robinhood","Symbol":"HBAR","Name":"Hedera","Quantity":"21.97","Price":"","Equity_Value_USD":"2.03"}'::jsonb),
    (13, '{"Platform":"Binance.US","Symbol":"BTC","Name":"Bitcoin","Quantity":"0.05906929","Price":"","Equity_Value_USD":"3921.81"}'::jsonb),
    (14, '{"Platform":"Binance.US","Symbol":"ETH","Name":"Ethereum","Quantity":"0.62255072","Price":"","Equity_Value_USD":"1212.42"}'::jsonb),
    (15, '{"Platform":"Binance.US","Symbol":"SOL","Name":"Solana","Quantity":"15.86849399","Price":"","Equity_Value_USD":"1248.37"}'::jsonb),
    (16, '{"Platform":"Binance.US","Symbol":"PAXG","Name":"PAX Gold","Quantity":"1.07088658","Price":"","Equity_Value_USD":"5311.86"}'::jsonb),
    (17, '{"Platform":"Binance.US","Symbol":"ZEC","Name":"Zcash","Quantity":"2.481558","Price":"","Equity_Value_USD":"572.47"}'::jsonb),
    (18, '{"Platform":"Binance.US","Symbol":"AVAX","Name":"Avalanche","Quantity":"31.44066405","Price":"","Equity_Value_USD":"278.87"}'::jsonb),
    (19, '{"Platform":"Binance.US","Symbol":"SUI","Name":"Sui","Quantity":"66.56734028","Price":"","Equity_Value_USD":"60.46"}'::jsonb),
    (20, '{"Platform":"Fidelity","Symbol":"NVO","Name":"Novo Nordisk ADR","Quantity":"75","Price":"","Equity_Value_USD":"3669.75"}'::jsonb),
    (21, '{"Platform":"Fidelity","Symbol":"SMR","Name":"NuScale Power Corp","Quantity":"125","Price":"","Equity_Value_USD":"236.25"}'::jsonb),
    (22, '{"Platform":"Fidelity","Symbol":"ABAT","Name":"American Battery Technology","Quantity":"20000","Price":"","Equity_Value_USD":"4000.0"}'::jsonb),
    (23, '{"Platform":"Fidelity","Symbol":"UAMY","Name":"United States Antimony","Quantity":"1000","Price":"","Equity_Value_USD":"588.8"}'::jsonb)
) AS g(line_index, data);

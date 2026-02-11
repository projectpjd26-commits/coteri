-- =============================================================================
-- INTERNAL-ONLY DEMO SEED
-- Run once after creating 3 test users in Supabase Auth. Replace the three
-- UUIDs below with those users' IDs (from auth.users or Auth dashboard).
-- =============================================================================
-- REPLACE with your internal test user IDs:
--   Staff:  11111111-1111-4111-8111-111111111111
--   Manager: 22222222-2222-4222-8222-222222222222
--   Owner:  33333333-3333-4333-8333-333333333333
-- =============================================================================

-- Demo venue UUIDs (fixed for idempotent references)
-- Coffee, Fitness, Nightlife
INSERT INTO public.venues (id, name, slug, is_demo)
VALUES
  ('d1000001-0000-4000-8000-000000000001', 'Demo — Neighborhood Coffee', 'demo-neighborhood-coffee', true),
  ('d1000002-0000-4000-8000-000000000002', 'Demo — Fitness Studio', 'demo-fitness-studio', true),
  ('d1000003-0000-4000-8000-000000000003', 'Demo — Nightlife / Events', 'demo-nightlife-events', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_demo = true;

-- venue_staff: 1 staff, 1 manager, 1 owner per venue (replace user UUIDs)
INSERT INTO public.venue_staff (user_id, venue_id, role)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'd1000001-0000-4000-8000-000000000001', 'staff'),
  ('22222222-2222-4222-8222-222222222222', 'd1000001-0000-4000-8000-000000000001', 'manager'),
  ('33333333-3333-4333-8333-333333333333', 'd1000001-0000-4000-8000-000000000001', 'owner'),
  ('11111111-1111-4111-8111-111111111111', 'd1000002-0000-4000-8000-000000000002', 'staff'),
  ('22222222-2222-4222-8222-222222222222', 'd1000002-0000-4000-8000-000000000002', 'manager'),
  ('33333333-3333-4333-8333-333333333333', 'd1000002-0000-4000-8000-000000000002', 'owner'),
  ('11111111-1111-4111-8111-111111111111', 'd1000003-0000-4000-8000-000000000003', 'staff'),
  ('22222222-2222-4222-8222-222222222222', 'd1000003-0000-4000-8000-000000000003', 'manager'),
  ('33333333-3333-4333-8333-333333333333', 'd1000003-0000-4000-8000-000000000003', 'owner')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- memberships: mix of tiers and statuses per venue (replace user_id with test users)
-- Venue 1 (Coffee): high volume, mostly valid
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000001-0000-4000-8000-000000000001', 'supporter', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000001-0000-4000-8000-000000000001', 'vip', 'active'),
  (gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'd1000001-0000-4000-8000-000000000001', 'founder', 'active')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- Venue 2 (Fitness): multiple tiers, some expired
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000002-0000-4000-8000-000000000002', 'vip', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000002-0000-4000-8000-000000000002', 'founder', 'expired'),
  (gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'd1000002-0000-4000-8000-000000000002', 'supporter', 'expired')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- Venue 3 (Nightlife): burst / invalid / fraud-flag variety
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000003-0000-4000-8000-000000000003', 'founder', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000003-0000-4000-8000-000000000003', 'vip', 'active')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- verification_events: require membership ids; we insert after memberships exist.
-- Use subqueries to pick one membership per venue for valid events; invalid can have membership_id NULL.
-- Generate events over last 7 days with mix of valid/invalid and some flagged.

-- Coffee: high volume, mostly valid (last 7 days by hour)
INSERT INTO public.verification_events (occurred_at, staff_user_id, venue_id, membership_id, result, raw_payload, flag_reason, flag_score)
SELECT
  (now() - (n || ' hours')::interval)::timestamptz,
  '11111111-1111-4111-8111-111111111111',
  'd1000001-0000-4000-8000-000000000001',
  CASE WHEN n % 5 = 0 THEN NULL ELSE (SELECT id FROM public.memberships WHERE venue_id = 'd1000001-0000-4000-8000-000000000001' AND status = 'active' LIMIT 1) END,
  CASE WHEN n % 5 = 0 THEN 'invalid' ELSE 'valid' END,
  CASE WHEN n % 5 = 0 THEN 'membership:00000000-0000-0000-0000-000000000000' ELSE 'membership:' || (SELECT id FROM public.memberships WHERE venue_id = 'd1000001-0000-4000-8000-000000000001' LIMIT 1)::text END,
  NULL,
  NULL
FROM generate_series(0, 168) AS n;

-- Coffee: add a few flagged events
INSERT INTO public.verification_events (occurred_at, staff_user_id, venue_id, membership_id, result, raw_payload, flag_reason, flag_score)
SELECT
  (now() - (n || ' hours')::interval)::timestamptz,
  '22222222-2222-4222-8222-222222222222',
  'd1000001-0000-4000-8000-000000000001',
  NULL,
  'invalid',
  'membership:00000000-0000-0000-0000-000000000000',
  'repeated_invalids',
  70
FROM generate_series(12, 14) AS n;

-- Fitness: valid + invalid mix
INSERT INTO public.verification_events (occurred_at, staff_user_id, venue_id, membership_id, result, raw_payload, flag_reason, flag_score)
SELECT
  (now() - (n || ' hours')::interval)::timestamptz,
  '11111111-1111-4111-8111-111111111111',
  'd1000002-0000-4000-8000-000000000002',
  (SELECT id FROM public.memberships WHERE venue_id = 'd1000002-0000-4000-8000-000000000002' LIMIT 1),
  CASE WHEN n % 3 = 0 THEN 'invalid' ELSE 'valid' END,
  'membership:' || (SELECT id FROM public.memberships WHERE venue_id = 'd1000002-0000-4000-8000-000000000002' LIMIT 1)::text,
  NULL,
  NULL
FROM generate_series(24, 120) AS n;

-- Nightlife: burst + flagged
INSERT INTO public.verification_events (occurred_at, staff_user_id, venue_id, membership_id, result, raw_payload, flag_reason, flag_score)
SELECT
  (now() - (n || ' minutes')::interval)::timestamptz,
  '33333333-3333-4333-8333-333333333333',
  'd1000003-0000-4000-8000-000000000003',
  NULL,
  'invalid',
  'membership:invalid-paste',
  'burst_attempts',
  60
FROM generate_series(0, 11) AS n;

INSERT INTO public.verification_events (occurred_at, staff_user_id, venue_id, membership_id, result, raw_payload, flag_reason, flag_score)
SELECT
  (now() - (n || ' hours')::interval)::timestamptz,
  '22222222-2222-4222-8222-222222222222',
  'd1000003-0000-4000-8000-000000000003',
  (SELECT id FROM public.memberships WHERE venue_id = 'd1000003-0000-4000-8000-000000000003' LIMIT 1),
  'valid',
  'membership:' || (SELECT id FROM public.memberships WHERE venue_id = 'd1000003-0000-4000-8000-000000000003' LIMIT 1)::text,
  NULL,
  NULL
FROM generate_series(0, 72) AS n;

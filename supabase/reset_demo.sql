-- ⚠️ INTERNAL DEMO USE ONLY — SAFE TO RE-RUN
-- Resets ONLY demo venues (venues.is_demo = true).
-- Deletes and re-seeds memberships and verification_events for demo venues.
-- Never touches non-demo venues or other tables.

-- 1. Delete verification_events for demo venues (FK: membership_id first not required; venue_id is the filter)
DELETE FROM public.verification_events
WHERE venue_id IN (SELECT id FROM public.venues WHERE is_demo = true);

-- 2. Delete memberships for demo venues
DELETE FROM public.memberships
WHERE venue_id IN (SELECT id FROM public.venues WHERE is_demo = true);

-- 3. Re-insert memberships for the three seeded demo venues (fixed IDs from seed_demo)
-- Venue 1 (Coffee)
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000001-0000-4000-8000-000000000001', 'supporter', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000001-0000-4000-8000-000000000001', 'vip', 'active'),
  (gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'd1000001-0000-4000-8000-000000000001', 'founder', 'active')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- Venue 2 (Fitness): active + expired
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000002-0000-4000-8000-000000000002', 'vip', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000002-0000-4000-8000-000000000002', 'founder', 'expired'),
  (gen_random_uuid(), '33333333-3333-4333-8333-333333333333', 'd1000002-0000-4000-8000-000000000002', 'supporter', 'expired')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- Venue 3 (Nightlife)
INSERT INTO public.memberships (id, user_id, venue_id, tier, status)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', 'd1000003-0000-4000-8000-000000000003', 'founder', 'active'),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', 'd1000003-0000-4000-8000-000000000003', 'vip', 'active')
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- 4. Re-insert verification_events (valid + invalid, some flagged)
-- Coffee: high volume, mostly valid
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

-- Coffee: flagged events
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

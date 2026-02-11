-- Fix: "record \"new\" has no field \"tier_id\"" on Grant membership.
-- A trigger/function on memberships references tier_id; our schema uses tier (text).
-- Drop the trigger first, then the function. Run this in Supabase SQL Editor if you
-- already applied migrations and the trigger was created outside migrations.

DROP TRIGGER IF EXISTS set_memberships_updated_at ON public.memberships;

DROP FUNCTION IF EXISTS public.set_memberships_updated_at();

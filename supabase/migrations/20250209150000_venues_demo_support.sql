-- Add demo flag to venues for internal-only demo data.
-- Extend venue_staff role to include manager/owner (for demo seed and existing role expansion).

ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.venues.is_demo IS 'When true, venue is for internal demos only; hide from non-internal users.';

-- Allow manager/owner roles (additive; keeps admin/staff if present)
ALTER TABLE public.venue_staff
  DROP CONSTRAINT IF EXISTS venue_staff_role_check;

ALTER TABLE public.venue_staff
  ADD CONSTRAINT venue_staff_role_check
  CHECK (role IN ('admin', 'staff', 'manager', 'owner'));

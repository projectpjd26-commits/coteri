-- Extend venue_staff role to include position types: owner, manager, staff, waiter, bartender, host.
-- admin remains for backward compatibility. Use owner/manager for leadership; staff/waiter/bartender/host for floor roles.

ALTER TABLE public.venue_staff
  DROP CONSTRAINT IF EXISTS venue_staff_role_check;

ALTER TABLE public.venue_staff
  ADD CONSTRAINT venue_staff_role_check
  CHECK (role IN ('admin', 'owner', 'manager', 'staff', 'waiter', 'bartender', 'host'));

COMMENT ON COLUMN public.venue_staff.role IS 'Position at the venue: admin, owner, manager, staff, waiter, bartender, host.';

/**
 * Authentication Middleware Utilities
 * 
 * Provides helper functions for protecting API routes with Supabase authentication.
 * Use these to ensure users are authenticated before accessing protected endpoints.
 * 
 * @example
 * import { requireAuth } from '@/lib/auth/middleware';
 * 
 * export async function GET(request: Request) {
 *   const authResult = await requireAuth(request);
 *   if (authResult.error) return authResult.error;
 *   
 *   const { user, session } = authResult.data;
 *   // Use authenticated user data...
 * }
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  data?: {
    user: User;
    session: Session;
  };
  error?: NextResponse;
}

/**
 * Require authentication for an API route
 * Returns user and session if authenticated, or error response if not
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return {
    data: {
      user: session.user,
      session,
    },
  };
}

/**
 * Check if user has access to a specific venue
 * Useful for venue-specific endpoints
 */
export async function requireVenueAccess(
  request: Request,
  venueId: string
): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const supabase = await createClient();
  const { user } = authResult.data!;

  // Check if user is a member of this venue
  const { data: member, error } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .eq('status', 'active')
    .single();

  if (error || !member) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Access denied to this venue' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Optional authentication - returns user if authenticated, but doesn't block if not
 * Useful for endpoints that behave differently for authenticated vs anonymous users
 */
export async function optionalAuth(
  request: Request
): Promise<{ user: User | null; session: Session | null }> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user: session?.user || null,
    session: session || null,
  };
}

/**
 * Check if user has admin/staff role for a venue
 * (Requires roles table - add if needed)
 */
export async function requireVenueStaff(
  request: Request,
  venueId: string
): Promise<AuthResult> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const supabase = await createClient();
  const { user } = authResult.data!;

  // Check if user is staff/admin for this venue
  // This is a placeholder - implement based on your role system
  const { data: staffRole, error } = await supabase
    .from('venue_staff')
    .select('*')
    .eq('user_id', user.id)
    .eq('venue_id', venueId)
    .single();

  if (error || !staffRole) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Staff access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

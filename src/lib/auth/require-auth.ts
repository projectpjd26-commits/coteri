import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Session, User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";

export interface AuthResult {
  data?: { user: User; session: Session };
  error?: NextResponse;
}

/**
 * Require authentication for an API route.
 * Returns user and session if authenticated, or 401 error response if not.
 * Use in route handlers: if (authResult.error) return authResult.error;
 */
export async function requireAuth(): Promise<AuthResult> {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { data: { user: session.user, session } };
}

const DEMO_ADMIN_IDS = (process.env.INTERNAL_DEMO_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Require authentication and membership in INTERNAL_DEMO_USER_IDS (demo admin).
 * Returns 401 if not signed in, 403 if not in the allowed list.
 */
export async function requireDemoAdmin(): Promise<AuthResult> {
  const result = await requireAuth();
  if (result.error) return result;

  if (DEMO_ADMIN_IDS.length === 0 || !DEMO_ADMIN_IDS.includes(result.data!.user.id)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return result;
}

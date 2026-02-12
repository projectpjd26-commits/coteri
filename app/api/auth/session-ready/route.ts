import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_ROLE_COOKIE } from "@/lib/constants";
import { getRoleForUser } from "@/lib/dashboard-auth";
import { createServerSupabase } from "@/lib/supabase-server";

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Same origin resolution as set-venue. */
function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

/**
 * Called after client-side exchangeCodeForSession. Session is in cookies.
 * Sets USER_ROLE_COOKIE and redirects to the requested path.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next")?.trim();
  const origin = getOrigin(request);
  const defaultPath = "/launch";
  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : defaultPath;

  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: staffRows } = await supabase
      .from("venue_staff")
      .select("venue_id")
      .eq("user_id", user.id)
      .limit(1);
    const hasStaffRows = (staffRows?.length ?? 0) > 0;
    const role = getRoleForUser(user, hasStaffRows);
    cookieStore.set(USER_ROLE_COOKIE, role, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: ROLE_COOKIE_MAX_AGE,
    });
  }

  return NextResponse.redirect(`${origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`);
}

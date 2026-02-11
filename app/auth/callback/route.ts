import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_NEXT_COOKIE, USER_ROLE_COOKIE } from "@/lib/constants";
import { getRoleForUser } from "@/lib/dashboard-auth";
import { createServerSupabase } from "@/lib/supabase-server";

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Same origin resolution as set-venue: supports proxy (x-forwarded-host). */
function getOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = getOrigin(request);
  const cookieStore = await cookies();
  let next = requestUrl.searchParams.get("next")?.trim() ?? null;
  if (!next || !next.startsWith("/")) {
    const stored = cookieStore.get(AUTH_NEXT_COOKIE)?.value;
    if (stored) {
      try {
        const decoded = decodeURIComponent(stored);
        if (decoded.startsWith("/")) next = decoded;
      } catch {
        // ignore
      }
      cookieStore.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
    }
  }
  // Default: send signed-in users to launch splash (banner launcher or your venue)
  const defaultPath = "/launch";
  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : defaultPath;

  if (code) {
    const supabase = createServerSupabase(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth&message=${encodeURIComponent(error.message)}`);
    }
    // Identify role at login and set cookie so the app can show "Admin" vs "Venue owner" vs "Member"
    if (data?.user) {
      const { data: staffRows } = await supabase
        .from("venue_staff")
        .select("venue_id")
        .eq("user_id", data.user.id)
        .limit(1);
      const hasStaffRows = (staffRows?.length ?? 0) > 0;
      const role = getRoleForUser(data.user, hasStaffRows);
      cookieStore.set(USER_ROLE_COOKIE, role, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: ROLE_COOKIE_MAX_AGE,
      });
    }
  }

  return NextResponse.redirect(`${origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`);
}

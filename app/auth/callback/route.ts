import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_NEXT_COOKIE } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase-server";

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
  // Default: send signed-in users to dashboard (single post-login home)
  const defaultPath = "/dashboard";
  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : defaultPath;

  if (code) {
    const supabase = createServerSupabase(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/sign-in?error=auth&message=${encodeURIComponent(error.message)}`);
    }
  }

  return NextResponse.redirect(`${origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`);
}

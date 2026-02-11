import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const REDIRECT = () =>
  NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));

function getSupabaseAuthCookieNames(): string[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const ref = new URL(url).hostname.split(".")[0];
    if (!ref) return [];
    return [`sb-${ref}-auth-token`, `sb-${ref}-auth-token-code-verifier`];
  } catch {
    return [];
  }
}

function clearAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const names = getSupabaseAuthCookieNames();
  for (const name of names) {
    cookieStore.set(name, "", { path: "/", maxAge: 0 });
  }
}

/** GET: clear auth cookies and redirect. Use when refresh token is invalid so you can clear session without calling Supabase. */
export async function GET() {
  const cookieStore = await cookies();
  clearAuthCookies(cookieStore);
  return REDIRECT();
}

export async function POST() {
  const cookieStore = await cookies();
  try {
    const supabase = createServerSupabase(cookieStore);
    await supabase.auth.signOut();
  } catch {
    // Invalid refresh token etc. — still clear our auth cookies so the user isn't stuck
    clearAuthCookies(cookieStore);
  }
  return REDIRECT();
}

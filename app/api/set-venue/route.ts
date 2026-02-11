import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CURRENT_VENUE_COOKIE, VENUE_SLUG_REGEX, VENUE_SLUG_MAX_LENGTH } from "@/lib/constants";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function safeRedirectPath(next: string | null): string {
  if (!next || typeof next !== "string") return "/dashboard";
  const p = next.trim();
  if (p.startsWith("/") && !p.startsWith("//")) return p;
  return "/dashboard";
}

/**
 * GET ?venue=slug&next=/path — sets cookie and redirects to next (default /dashboard).
 * Used by internal demo venue links.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("venue")?.trim() ?? null;
  const nextParam = searchParams.get("next");

  const sanitized =
    slug && VENUE_SLUG_REGEX.test(slug) && slug.length <= VENUE_SLUG_MAX_LENGTH ? slug : null;
  if (sanitized) {
    cookieStore.set(CURRENT_VENUE_COOKIE, sanitized, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  }

  const path = safeRedirectPath(nextParam);
  const origin = request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
    : new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${path}`);
}

/**
 * POST body: { slug: string } or FormData with "slug".
 * Optional query/body "next": redirect path after setting cookie.
 * Sets current_venue_slug cookie and redirects to next, Referer, or /dashboard.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  let slug: string | null = null;

  const url = new URL(request.url);
  const nextFromQuery = url.searchParams.get("next");

  const contentType = request.headers.get("content-type") ?? "";
  let nextFromBody: string | null = null;
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    slug = typeof body.slug === "string" ? body.slug.trim() : null;
    nextFromBody = typeof body.next === "string" ? body.next.trim() : null;
  } else {
    const formData = await request.formData().catch(() => null);
    slug = formData ? (formData.get("slug") as string | null)?.trim() ?? null : null;
    const n = formData?.get("next");
    nextFromBody = typeof n === "string" ? n.trim() : null;
  }

  const sanitized =
    slug && VENUE_SLUG_REGEX.test(slug) && slug.length <= VENUE_SLUG_MAX_LENGTH ? slug : null;
  if (sanitized) {
    cookieStore.set(CURRENT_VENUE_COOKIE, sanitized, {
      path: "/",
      httpOnly: false, // so client can read for theme if needed
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  } else if (slug !== undefined) {
    cookieStore.delete(CURRENT_VENUE_COOKIE);
  }

  const nextParam = nextFromQuery ?? nextFromBody;
  let path = "/dashboard";
  if (nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")) {
    path = nextParam;
  } else {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refUrl = new URL(referer);
        if (refUrl.pathname?.startsWith("/")) path = refUrl.pathname === "" ? "/" : refUrl.pathname;
      } catch {
        // invalid referer, keep default
      }
    }
  }
  const origin = request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
    : new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${path}`);
}

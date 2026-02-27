import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CURRENT_VENUE_COOKIE, VENUE_SLUG_REGEX, VENUE_SLUG_MAX_LENGTH, PILOT_VENUE_SLUGS, getFallbackVenues } from "@/lib/constants";
import { allowedVenueSlugs, isDashboardAdmin } from "@/lib/dashboard-auth";
import { createServerSupabase } from "@/lib/supabase-server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function safeRedirectPath(next: string | null): string {
  if (!next || typeof next !== "string") return "/dashboard";
  const p = next.trim();
  if (p.startsWith("/") && !p.startsWith("//")) return p;
  return "/dashboard";
}

type VenueRow = { id: string; name: string; slug: string; is_demo?: boolean };

async function getAllowedSlugs(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<Set<string> | null> {
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = isDashboardAdmin(user);
  const { data: memberships } = await supabase
    .from("memberships")
    .select("venue_id, venues(id, name, slug, is_demo)")
    .eq("user_id", user.id);
  const { data: staffVenues } = await supabase
    .from("venue_staff")
    .select("venue_id, venues(id, name, slug, is_demo)")
    .eq("user_id", user.id);
  const fromMemberships = (memberships ?? [])
    .map((m) => (m as unknown as { venues: VenueRow | null }).venues)
    .filter((v): v is VenueRow => v != null && (!v.is_demo || isAdmin));
  const fromStaff = (staffVenues ?? [])
    .map((s) => (s as unknown as { venues: VenueRow | null }).venues)
    .filter((v): v is VenueRow => v != null && (!v.is_demo || isAdmin));
  const slugs = allowedVenueSlugs({
    isAdmin,
    fromMemberships: fromMemberships.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
    fromStaff: fromStaff.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
  });
  // Admin with no venues: allow pilot slugs so they can set a venue and access dashboard.
  // Admin: always allow all fallback (mock) venue slugs so they can use all 8 everywhere (launcher, dashboard switcher).
  if (isAdmin) {
    getFallbackVenues().forEach((v) => slugs.add(v.slug));
    if (slugs.size === 0) {
      const { data: rows } = await supabase.from("venues").select("slug").in("slug", [...PILOT_VENUE_SLUGS]);
      rows?.forEach((r) => slugs.add(r.slug));
    }
  }
  return slugs;
}

/**
 * GET ?venue=slug&next=/path — sets cookie and redirects to next (default /dashboard).
 * When authenticated, only allows slugs the user may access (admins: all; venue owners: only their venue(s)).
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("venue")?.trim() ?? null;
  const nextParam = searchParams.get("next");

  const sanitized =
    slug && VENUE_SLUG_REGEX.test(slug) && slug.length <= VENUE_SLUG_MAX_LENGTH ? slug : null;
  const allowed = sanitized ? await getAllowedSlugs(cookieStore) : null;
  const maySet = !!sanitized && (allowed === null || allowed.has(sanitized));
  if (maySet) {
    cookieStore.set(CURRENT_VENUE_COOKIE, sanitized!, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  // When slug is not allowed, do not clear the cookie — redirect with current cookie so user stays on previous venue instead of bouncing to "first" venue.

  const path = safeRedirectPath(nextParam);
  const origin = request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto") ?? "https"}://${request.headers.get("x-forwarded-host")}`
    : new URL(request.url).origin;
  return NextResponse.redirect(`${origin}${path}`, 303);
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
  const allowed = sanitized ? await getAllowedSlugs(cookieStore) : null;
  const maySet = !!sanitized && (allowed === null || allowed.has(sanitized));
  if (maySet) {
    cookieStore.set(CURRENT_VENUE_COOKIE, sanitized!, {
      path: "/",
      httpOnly: false, // so client can read for theme if needed
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });
  }
  // When slug is not allowed, do not clear the cookie — user keeps current venue instead of bouncing to first in list.
  if (!sanitized && slug !== undefined) {
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
  return NextResponse.redirect(`${origin}${path}`, 303);
}

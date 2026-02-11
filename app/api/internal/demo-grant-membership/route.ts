import { NextResponse } from "next/server";
import { PILOT_VENUE_SLUGS } from "@/lib/constants";
import { requireDemoAdmin } from "@/lib/auth/require-auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const authResult = await requireDemoAdmin();
  if (authResult.error) return authResult.error;
  const { session } = authResult.data!;

  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, false);

  const url = new URL(request.url);
  const venueSlug = url.searchParams.get("venue")?.trim() ?? null;

  let venue: { id: string } | null = null;
  if (venueSlug) {
    const res = await supabase.from("venues").select("id").eq("slug", venueSlug).maybeSingle();
    venue = res.data ?? null;
  }
  if (!venue) {
    const res = await supabase.from("venues").select("id").eq("slug", PILOT_VENUE_SLUGS[0]).maybeSingle();
    venue = res.data ?? null;
  }
  if (!venue) {
    const res = await supabase.from("venues").select("id").eq("is_demo", true).limit(1).maybeSingle();
    venue = res.data ?? null;
  }
  if (!venue) {
    const res = await supabase.from("venues").select("id").limit(1).maybeSingle();
    venue = res.data ?? null;
  }

  if (!venue?.id) {
    return NextResponse.json(
      {
        error:
          "No venue found. Add a venue in Supabase (Table Editor → venues, or run supabase/seed_demo.sql in the SQL Editor).",
      },
      { status: 404 }
    );
  }

  const { error } = await supabase.from("memberships").upsert(
    {
      user_id: session.user.id,
      venue_id: venue.id,
      tier: "founder",
      status: "active",
    },
    { onConflict: "user_id,venue_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const nextPath = url.searchParams.get("next")?.trim();
  const resolvedSlug = venueSlug ?? (await supabase.from("venues").select("slug").eq("id", venue.id).maybeSingle()).data?.slug ?? null;
  const redirectPath =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? `${nextPath}${nextPath.includes("?") ? "&" : "?"}granted=ok`
      : "/internal/demo?granted=ok";
  // If redirecting to dashboard and we have a venue slug, set venue cookie first so dashboard shows the new venue
  if (resolvedSlug && redirectPath.startsWith("/dashboard")) {
    const setVenueUrl = new URL("/api/set-venue", origin);
    setVenueUrl.searchParams.set("venue", resolvedSlug);
    setVenueUrl.searchParams.set("next", redirectPath);
    return NextResponse.redirect(setVenueUrl, 303);
  }
  return NextResponse.redirect(new URL(redirectPath, origin), 303);
}

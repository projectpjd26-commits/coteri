import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { CURRENT_VENUE_COOKIE } from "@/lib/constants";
import { allowedVenuesForUser, getRoleForUser, isDashboardAdmin } from "@/lib/dashboard-auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { onlyPilotVenues, withDisplayNames } from "@/lib/venues";
import { LaunchClient } from "./launch-client";

export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const isAdmin = isDashboardAdmin(user);
  const { data: memberships } = await supabase
    .from("memberships")
    .select("venue_id, venues(id, name, slug, is_demo)")
    .eq("user_id", user.id);
  const { data: staffVenues } = await supabase
    .from("venue_staff")
    .select("venue_id, venues(id, name, slug, is_demo)")
    .eq("user_id", user.id);

  type V = { id: string; name: string; slug: string; is_demo?: boolean };
  const fromMemberships = (memberships ?? [])
    .map((m) => (m as unknown as { venues: V | null }).venues)
    .filter((v): v is V => v != null && (!v.is_demo || isAdmin));
  const fromStaff = (staffVenues ?? [])
    .map((s) => (s as unknown as { venues: V | null }).venues)
    .filter((v): v is V => v != null && (!v.is_demo || isAdmin));

  const allowedOptions = allowedVenuesForUser({
    isAdmin,
    fromMemberships: fromMemberships.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
    fromStaff: fromStaff.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
  });
  const allVenues = withDisplayNames(allowedOptions.map((v) => ({ slug: v.slug, name: v.name })));
  const venues = onlyPilotVenues(allVenues);

  const rawSlug = cookieStore.get(CURRENT_VENUE_COOKIE)?.value ?? null;
  const currentSlug = rawSlug?.trim() || null;
  const hasMultipleVenues = venues.length > 1;
  const role = getRoleForUser(user, (staffVenues?.length ?? 0) > 0);
  const firstVenue = venues[0];
  const currentVenue = currentSlug ? venues.find((v) => v.slug === currentSlug) : firstVenue ?? null;
  const displayVenue = currentVenue ?? firstVenue;

  return (
    <main className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Banner: venue launcher for admin with multiple venues, or "Your venue" for owner/single */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {hasMultipleVenues && isAdmin
              ? "Choose your venue"
              : displayVenue
                ? `Your venue: ${displayVenue.name}`
                : "Welcome back"}
          </h1>
          {hasMultipleVenues && isAdmin && (
            <div className="mt-4 flex justify-center">
              <LaunchClient
                venues={venues}
                currentSlug={currentSlug ?? firstVenue?.slug ?? null}
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Link
          href={displayVenue ? `/api/set-venue?venue=${encodeURIComponent(displayVenue.slug)}&next=/dashboard` : "/dashboard"}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 text-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          Go to dashboard
        </Link>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {role === "admin" && "Logged in as Admin"}
          {role === "venue_owner" && "Logged in as Venue owner"}
          {role === "member" && "Logged in as Member"}
        </p>
      </div>

      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
        © COTERI
      </footer>
    </main>
  );
}

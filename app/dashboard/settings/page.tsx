import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { CURRENT_VENUE_COOKIE } from "@/lib/constants";
import { VenuePositionForm } from "@/components/dashboard/VenuePositionForm";
import { updateVenueStaffRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const currentSlug = cookieStore.get(CURRENT_VENUE_COOKIE)?.value?.trim() ?? null;
  let venueId: string | null = null;
  let venueName = "this venue";
  let staffRole: string | null = null;

  if (currentSlug) {
    const { data: venue } = await supabase.from("venues").select("id, name").eq("slug", currentSlug).maybeSingle();
    if (venue) {
      venueId = (venue as { id: string }).id;
      venueName = (venue as { name: string }).name ?? venueName;
      const { data: staffRow } = await supabase
        .from("venue_staff")
        .select("role")
        .eq("user_id", user.id)
        .eq("venue_id", venueId)
        .maybeSingle();
      if (staffRow) staffRole = (staffRow as { role: string }).role;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--venue-text-muted)" }}
        >
          ← Dashboard
        </Link>
        <h1 className="text-xl font-semibold mt-2" style={{ color: "var(--venue-text)" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--venue-text-muted)" }}>
          Manage your account and venue position.
        </p>
      </div>

      {venueId && staffRole != null && (
        <VenuePositionForm
          venueName={venueName}
          currentRole={staffRole}
          venueId={venueId}
          updateRoleAction={updateVenueStaffRole}
        />
      )}

      {(!venueId || staffRole == null) && (
        <p className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
          Select a venue where you are staff (from the dashboard switcher) to set your position there.
        </p>
      )}
    </div>
  );
}


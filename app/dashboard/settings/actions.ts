"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { VENUE_STAFF_ROLES } from "@/lib/constants";

const VALID_ROLES = new Set<string>(VENUE_STAFF_ROLES.map((r) => r.value));

export async function updateVenueStaffRole(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string } | null> {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sign in required." };

  const venueId = formData.get("venue_id");
  const role = formData.get("role");
  if (typeof venueId !== "string" || typeof role !== "string" || !venueId.trim() || !role.trim()) {
    return { ok: false, message: "Venue and position are required." };
  }
  if (!VALID_ROLES.has(role)) {
    return { ok: false, message: "Invalid position." };
  }

  const { error } = await supabase
    .from("venue_staff")
    .update({ role })
    .eq("user_id", user.id)
    .eq("venue_id", venueId.trim());

  if (error) {
    return { ok: false, message: error.message || "Failed to update position." };
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/verify");
  return { ok: true, message: "Position saved." };
}

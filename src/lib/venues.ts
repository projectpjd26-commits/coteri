import { FALLBACK_VENUES, PILOT_VENUE_SLUGS, getFallbackVenues } from "./constants";

export type VenueOptionRow = { id: string; slug: string; name: string };

/** Canonical display names for pilot venues (slug → label). Derived from FALLBACK_VENUES. */
export const VENUE_DISPLAY_NAME_BY_SLUG: Record<string, string> = Object.fromEntries(
  FALLBACK_VENUES.map((v) => [v.slug, v.name])
);

export function venueDisplayName(slug: string, fallback: string): string {
  return VENUE_DISPLAY_NAME_BY_SLUG[slug] ?? fallback;
}

/** Normalize a list of venues so display names match our canonical labels. */
export function withDisplayNames<T extends { slug: string; name: string }>(venues: T[]): T[] {
  return venues.map((v) => ({
    ...v,
    name: VENUE_DISPLAY_NAME_BY_SLUG[v.slug] ?? v.name,
  }));
}

/** Only venues we treat as real clients (pilots). Use for venue chooser so the dropdown is just venues, not demo placeholders. */
export function onlyPilotVenues<T extends { slug: string }>(venues: T[]): T[] {
  const set = new Set(PILOT_VENUE_SLUGS);
  return venues.filter((v) => set.has(v.slug as (typeof PILOT_VENUE_SLUGS)[number]));
}

/**
 * Fetch pilot venue rows from DB for admin fallback when they have no memberships/staff.
 */
export async function getPilotVenueOptionsFromDb(supabase: {
  from: (t: string) => { select: (c: string) => { in: (col: string, vals: readonly string[]) => Promise<{ data: { id: string; slug: string; name: string }[] | null }> } };
}): Promise<VenueOptionRow[]> {
  const { data } = await supabase.from("venues").select("id, name, slug").in("slug", [...PILOT_VENUE_SLUGS]);
  return (data ?? []).map((v) => ({ id: v.id, slug: v.slug, name: v.name }));
}

/**
 * Admin venue list: all 8 fallback venues with real ids where the admin is staff.
 * Use in dashboard layout so launcher and switcher share one source (getFallbackVenues).
 */
export function getAdminResolvedVenueOptions(
  allowedOptions: { id: string; slug: string; name: string }[]
): VenueOptionRow[] {
  return getFallbackVenues().map((v) => {
    const o = allowedOptions.find((op) => op.slug === v.slug);
    return o ? { id: o.id, slug: o.slug, name: o.name } : { id: v.slug, slug: v.slug, name: v.name };
  });
}

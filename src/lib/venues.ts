import { FALLBACK_VENUES, PILOT_VENUE_SLUGS } from "./constants";

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

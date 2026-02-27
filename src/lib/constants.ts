/** Cookie key for the currently selected venue (slug). */
export const CURRENT_VENUE_COOKIE = "current_venue_slug";

/**
 * Permanent app admins (co-founders). Admin identities are linked to sign-in:
 * - By email: PERMANENT_ADMINS (below)
 * - By user id: INTERNAL_DEMO_USER_IDS or ADMIN_USER_IDS env (comma-separated)
 * Before production: replace placeholders with real co-founder emails/names, or leave as-is and rely only on INTERNAL_DEMO_USER_IDS in production env. See docs/PRE-PRODUCTION-CHECKLIST.md §1.
 */
export const PERMANENT_ADMINS: { email: string; name: string }[] = [
  { email: "you@example.com", name: "Your Name" },
  { email: "cofounder@example.com", name: "Co-founder Name" },
];

/** Cookie used to remember where to redirect after magic-link sign-in. */
export const AUTH_NEXT_COOKIE = "coteri_auth_next";

/** Cookie set at login: "admin" | "venue_owner" | "member" so the app can show who is logged in. */
export const USER_ROLE_COOKIE = "coteri_user_role";

/** When true: hide Sign In / Admin Sign-In on splash and show "disabled" on /sign-in. Flip to false when ready to allow logins. */
export const PUBLIC_LOGIN_DISABLED = false;

/** Pilot venue slugs; use for validation and fallback lists. */
export const PILOT_VENUE_SLUGS = ["the-function-sf", "the-starry-plough"] as const;

/** Mock venue slugs (marketing/launcher only; themed like Starry Plough for demo).
 * When adding a new mock venue: (1) append slug to MOCK_VENUE_SLUGS, (2) add row to FALLBACK_VENUES_LIST,
 * (3) add entry to MOCK_VENUE_DESCRIPTORS, (4) add .venue-theme-{slug} and --venue-mock-bg-image in app/globals.css,
 * (5) add banner image in src/lib/venue-banners.ts VENUE_BANNER_IMAGES. See SYSTEM-REVIEW §2 (Mock venue themes). */
export const MOCK_VENUE_SLUGS = [
  "pacific-greens",
  "la-rueda",
  "strike-zone",
  "the-velvet-room",
  "the-hideout",
  "bar-none",
] as const;

export function isMockVenueSlug(slug: string | null): slug is (typeof MOCK_VENUE_SLUGS)[number] {
  return slug != null && (MOCK_VENUE_SLUGS as readonly string[]).includes(slug);
}

/** CSS class string for a mock venue theme (card or full page). Use when slug is a mock venue. */
export function getMockThemeClass(slug: string, forPage: boolean): string {
  if (!isMockVenueSlug(slug)) return "";
  const base = `venue-theme-${slug}`;
  return forPage ? `${base} venue-blurred-mock-page` : `${base} venue-blurred-mock`;
}

/** Short descriptor per mock venue for splash mockup cards (e.g. "Plant-forward • Teal theme"). */
export const MOCK_VENUE_DESCRIPTORS: Record<string, string> = {
  "pacific-greens": "Plant-forward • Teal theme",
  "la-rueda": "Latin warmth • Amber theme",
  "strike-zone": "Sports bar • Blue theme",
  "the-velvet-room": "Lounge & jazz • Purple theme",
  "the-hideout": "Neighborhood dive • Rust theme",
  "bar-none": "Cocktail bar • Stone theme",
};

/**
 * When true: demo reset and /internal/demo redirect are enabled. Admin grant-membership does not require this.
 */
export function isDemoMode(): boolean {
  return process.env.IS_DEMO_MODE === "true";
}

/** Fallback venue list when DB is unavailable or for launcher placeholders. Show these; replace with real data as it comes in. */
export type FallbackVenue = { name: string; slug: string; description?: string };

const FALLBACK_VENUES_LIST: FallbackVenue[] = [
  { name: "The Function SF", slug: "the-function-sf", description: "Event space & bar in San Francisco. Members get priority entry and drink perks." },
  { name: "The Starry Plough", slug: "the-starry-plough", description: "Berkeley pub & nightclub — Irish music, poetry slam, open mic. Member access at the door." },
  { name: "La Rueda", slug: "la-rueda", description: "Latin dance and live music. Member discounts and reserved seating." },
  { name: "Strike Zone", slug: "strike-zone", description: "Bowling, arcade, and bar. Free lane upgrades and food deals for members." },
  { name: "Pacific Greens", slug: "pacific-greens", description: "Plant-forward restaurant and bar. Member-only tastings and early seating." },
  { name: "The Velvet Room", slug: "the-velvet-room", description: "Intimate lounge and live jazz. VIP tables and bottle service for members." },
  { name: "The Hideout", slug: "the-hideout", description: "Neighborhood dive with rotating taps. Member happy hour and merch." },
  { name: "Bar None", slug: "bar-none", description: "Cocktail bar and small plates. Member reservations and seasonal perks." },
];

export function getFallbackVenues(): FallbackVenue[] {
  return FALLBACK_VENUES_LIST;
}

/** @deprecated Use getFallbackVenues(). */
export const FALLBACK_VENUES: FallbackVenue[] = FALLBACK_VENUES_LIST;

/** Valid venue slug pattern (safe for cookie and URLs). */
export const VENUE_SLUG_REGEX = /^[a-z0-9-]+$/;
export const VENUE_SLUG_MAX_LENGTH = 120;

/** Venue staff position/role: value stored in DB and display label. Order = suggested dropdown order. */
export const VENUE_STAFF_ROLES = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "waiter", label: "Waiter" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "admin", label: "Admin" },
] as const;

export type VenueStaffRoleValue = (typeof VENUE_STAFF_ROLES)[number]["value"];

/** Roles that can use the verify (scan) flow. */
export const ALLOWED_VERIFY_ROLES: VenueStaffRoleValue[] = [
  "owner",
  "manager",
  "staff",
  "waiter",
  "bartender",
  "host",
];

/** Roles that can access Venue Intelligence / metrics (manager and above). */
export const ALLOWED_METRICS_ROLES: VenueStaffRoleValue[] = ["owner", "manager"];

export function getVenueStaffRoleLabel(role: string): string {
  const r = VENUE_STAFF_ROLES.find((x) => x.value === role);
  return r ? r.label : role.charAt(0).toUpperCase() + role.slice(1);
}

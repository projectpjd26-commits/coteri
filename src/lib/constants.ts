/** Cookie key for the currently selected venue (slug). */
export const CURRENT_VENUE_COOKIE = "current_venue_slug";

/**
 * Permanent app admins (co-founders). Admin identities are linked to sign-in:
 * - By email: PERMANENT_ADMINS (below)
 * - By user id: INTERNAL_DEMO_USER_IDS or ADMIN_USER_IDS env (comma-separated)
 * Replace with your and your co-founder's real emails and names.
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
export const PUBLIC_LOGIN_DISABLED = true;

/** Pilot venue slugs; use for validation and fallback lists. */
export const PILOT_VENUE_SLUGS = ["the-function-sf", "the-starry-plough"] as const;

/**
 * When true: demo reset and /internal/demo redirect are enabled. Admin grant-membership does not require this.
 */
export function isDemoMode(): boolean {
  return process.env.IS_DEMO_MODE === "true";
}

/** Fallback venue list when DB is unavailable or for launcher placeholders. Show these; replace with real data as it comes in. */
const FALLBACK_VENUES_LIST: { name: string; slug: string }[] = [
  { name: "The Function SF", slug: "the-function-sf" },
  { name: "The Starry Plough", slug: "the-starry-plough" },
  { name: "La Rueda", slug: "la-rueda" },
  { name: "Strike Zone", slug: "strike-zone" },
  { name: "Pacific Greens", slug: "pacific-greens" },
];

export function getFallbackVenues(): { name: string; slug: string }[] {
  return FALLBACK_VENUES_LIST;
}

/** @deprecated Use getFallbackVenues(). */
export const FALLBACK_VENUES: { name: string; slug: string }[] = FALLBACK_VENUES_LIST;

/** Valid venue slug pattern (safe for cookie and URLs). */
export const VENUE_SLUG_REGEX = /^[a-z0-9-]+$/;
export const VENUE_SLUG_MAX_LENGTH = 120;

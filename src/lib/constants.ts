/** Cookie key for the currently selected venue (slug). */
export const CURRENT_VENUE_COOKIE = "current_venue_slug";

/** Cookie used to remember where to redirect after magic-link sign-in. */
export const AUTH_NEXT_COOKIE = "coteri_auth_next";

/** Pilot venue slugs; use for validation and fallback lists. */
export const PILOT_VENUE_SLUGS = ["the-function-sf", "the-starry-plough"] as const;

/** Fallback venue list when DB is unavailable (e.g. anon on home). Order matches PILOT_VENUE_SLUGS. */
export const FALLBACK_VENUES: { name: string; slug: string }[] = [
  { name: "The Function SF", slug: "the-function-sf" },
  { name: "The Starry Plough", slug: "the-starry-plough" },
];

/** Valid venue slug pattern (safe for cookie and URLs). */
export const VENUE_SLUG_REGEX = /^[a-z0-9-]+$/;
export const VENUE_SLUG_MAX_LENGTH = 120;

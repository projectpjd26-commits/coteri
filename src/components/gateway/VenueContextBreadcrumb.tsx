import Link from "next/link";

type VenueContextBreadcrumbProps = {
  venueName: string;
  /** Optional: current page label (e.g. "Membership" or "Staff Verify") */
  currentLabel?: string;
  /** Use "venue" when rendered on a dark venue-themed page for contrast */
  variant?: "neutral" | "venue";
};

/**
 * Breadcrumb: COTERI is the product (us), not a venue. Shows "COTERI · Membership"
 * or "COTERI · The Function SF · Membership" so it's clear we're the platform and the venue is the client.
 */
export function VenueContextBreadcrumb({
  venueName,
  currentLabel,
  variant = "neutral",
}: VenueContextBreadcrumbProps) {
  const isVenue = variant === "venue";
  const showVenue = venueName && venueName !== "Venue"; // "Venue" is the generic fallback — don't show it as if it were a place
  return (
    <nav
      className={`flex items-center gap-1.5 text-xs mb-4 ${isVenue ? "text-white/70" : "text-slate-500 dark:text-slate-400"}`}
      aria-label="Breadcrumb"
    >
      <Link
        href="/dashboard"
        className={isVenue ? "hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] rounded" : "hover:text-slate-700 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 rounded"}
      >
        COTERI
      </Link>
      {showVenue && (
        <>
          <span aria-hidden className="select-none">·</span>
          <span className={isVenue ? "font-medium text-white/90" : "font-medium text-slate-700 dark:text-slate-300"}>
            {venueName}
          </span>
        </>
      )}
      {currentLabel && (
        <>
          <span aria-hidden className="select-none">·</span>
          <span className={isVenue ? "font-medium text-white/90" : "font-medium text-slate-700 dark:text-slate-300"}>
            {currentLabel}
          </span>
        </>
      )}
    </nav>
  );
}

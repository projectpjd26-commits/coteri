"use client";

/** Venue slug to pick card background image. */
const VENUE_CARD_BG: Record<string, string> = {
  "the-function-sf": "/venues/3.png",
  "the-starry-plough":
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80",
};

type Props = {
  venueName?: string;
  tierName?: string;
  memberSince?: string;
  memberName?: string;
  /** Venue slug for background image (Function SF = stage, Starry Plough = Guinness). */
  venueSlug?: string;
  /** Show red "ACTIVE" in the white scan area when true. */
  showActiveInScanArea?: boolean;
  /** When false, show inactive state (no ACTIVE/VALID, or "No active membership"). */
  active?: boolean;
};

/**
 * Rich wallet pass mockup with venue-specific blurred background.
 * Function SF: blurred stand-up/stage. Starry Plough: blurred pint of Guinness.
 * Single card represents both Apple and Google Wallet; label that below.
 */
export function WalletPassMockup({
  venueName = "The Function SF",
  tierName = "Founder",
  memberSince = "Sep 2024",
  memberName = "Member",
  venueSlug = "the-function-sf",
  showActiveInScanArea = true,
  active = true,
}: Props) {
  const bgImage = VENUE_CARD_BG[venueSlug] ?? VENUE_CARD_BG["the-function-sf"];

  return (
    <div className="mx-auto w-[280px] rounded-2xl overflow-hidden border border-white/20 shadow-xl relative">
      {/* Blurred venue-specific background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(12px)",
          transform: "scale(1.15)",
        }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="relative z-10 text-white">
        {/* Top row: venue name left, member since right (or "No membership" when inactive) */}
        <div className="flex items-start justify-between px-4 pt-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-white drop-shadow-sm">
            {venueName.toUpperCase()}
          </span>
          {active ? (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-white/70">
                Member since
              </p>
              <p className="text-xs font-medium text-white">{memberSince}</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">
                No active membership
              </p>
            </div>
          )}
        </div>

        {/* Rich copy: tagline under venue */}
        <p className="px-4 pt-2 text-[11px] text-white/80 leading-snug">
          {active
            ? "Your membership at the door. Present this pass for entry and rewards."
            : "Get a membership to access the venue."}
        </p>

        {/* Spacer with subtle gradient */}
        <div className="h-14 w-full mt-3" aria-hidden />

        {/* Name band */}
        <div className="px-4 py-3 bg-black/80">
          <p className="text-[10px] uppercase tracking-wider text-white/50">
            Name
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">{memberName}</p>
        </div>

        {/* Barcode area */}
        <div className="px-4 pb-4 pt-4 bg-black/90">
          <p className="text-[10px] uppercase tracking-wider text-white/60 mb-2">
            Show at door · Scan for entry
          </p>
          <div className="rounded-lg bg-white p-3 flex flex-col items-center justify-center min-h-[100px] relative">
            <div className="flex items-center gap-0.5 h-10">
              {[2, 1, 2, 1, 3, 1, 2, 2, 1, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1].map(
                (w, i) => (
                  <div
                    key={i}
                    className="bg-black rounded-sm"
                    style={{ width: w * 2, minWidth: 2 }}
                  />
                )
              )}
            </div>
            {showActiveInScanArea && active && (
              <span className="mt-2 text-sm font-bold uppercase tracking-widest text-red-600" aria-hidden>
                Active
              </span>
            )}
            {!active && (
              <span className="mt-2 text-sm font-medium uppercase tracking-wider text-slate-500" aria-hidden>
                No pass
              </span>
            )}
          </div>
          {active && (
            <>
              <p className="text-center text-xs font-mono text-white mt-2">
                1007312869
              </p>
              <p className="text-center text-[10px] text-white/50 mt-1">
                Membership ID
              </p>
            </>
          )}
          <div className="flex justify-between items-center mt-3">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--venue-accent, #d4a853)" }}
            >
              {tierName}
            </span>
            <span className="text-[10px] text-white/50 uppercase">
              {active ? "Valid" : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

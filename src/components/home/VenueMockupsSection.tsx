"use client";

import Link from "next/link";
import { WalletPassMockup } from "@/components/demo/WalletPassMockup";
import { getMockThemeClass, MOCK_VENUE_DESCRIPTORS } from "@/lib/constants";

export type MockVenueItem = { name: string; slug: string; description?: string };

/**
 * Renders a grid of pass mockups, one per venue, each wrapped in that venue’s theme
 * (like The Starry Plough). Used on the marketing splash to show “COTERI at your venue”.
 */
export function VenueMockupsSection({ venues }: { venues: MockVenueItem[] }) {
  if (venues.length === 0) return null;

  return (
    <section className="relative z-20 w-full bg-slate-950 border-b border-slate-800 py-20 md:py-28" aria-labelledby="venue-mockups-heading">
      <div className="max-w-6xl mx-auto px-6">
        <h2 id="venue-mockups-heading" className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-white mb-4">
          COTERI at your venue
        </h2>
        <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
          One pass, your brand. Each venue gets its own look — member pass and dashboard match the room.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {venues.map((v) => (
            <div
              key={v.slug}
              className={`venue-theme ${getMockThemeClass(v.slug, false)} rounded-2xl overflow-hidden border border-white/10 min-h-[380px] flex flex-col items-center justify-center p-6`}
              role="group"
              aria-labelledby={`venue-mockup-${v.slug}`}
            >
              <div id={`venue-mockup-${v.slug}`} className="mb-4 w-full text-center">
                <p className="text-sm font-medium truncate" style={{ color: "var(--venue-text-muted)" }}>
                  {v.name}
                </p>
                {MOCK_VENUE_DESCRIPTORS[v.slug] && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--venue-text-muted)", opacity: 0.9 }}>
                    {MOCK_VENUE_DESCRIPTORS[v.slug]}
                  </p>
                )}
              </div>
              <WalletPassMockup
                venueName={v.name}
                venueSlug={v.slug}
                tierName="Founder"
                memberSince="Sep 2024"
                memberName="Member"
                showActiveInScanArea
                active
              />
            </div>
          ))}
        </div>
        <p className="text-center mt-10">
          <Link
            href="/launch"
            className="text-sm font-medium text-sky-400 hover:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded"
          >
            See your venue in the launcher →
          </Link>
        </p>
      </div>
    </section>
  );
}

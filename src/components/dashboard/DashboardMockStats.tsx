"use client";

import Link from "next/link";

/**
 * Honest placeholder for venue verification stats. No fabricated numbers.
 * When real scan data is wired, replace with live counts from Supabase.
 */
export function DashboardMockStats({
  venueName,
  hasStaffAccess,
}: { venueName?: string | null; hasStaffAccess?: boolean } = {}) {
  void venueName; // reserved for venue-scoped heading
  return (
    <section className="mt-6" aria-labelledby="verification-stats-heading">
      <h2 id="verification-stats-heading" className="text-sm font-medium mb-3" style={{ color: "var(--venue-text-muted)" }}>
        Verification stats
      </h2>
      <div
        className="rounded-lg border border-white/10 px-4 py-5"
        style={{ backgroundColor: "var(--venue-bg-elevated)" }}
      >
        <p className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
          Verification stats will appear here once you start scanning members at the door.
          {hasStaffAccess && (
            <>
              {" "}
              Use <Link href="/verify" className="font-medium underline focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] rounded px-0.5" style={{ color: "var(--venue-accent)" }}>Verify at door</Link> to scan passes.
            </>
          )}
        </p>
      </div>
    </section>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardMockStats } from "@/components/dashboard/DashboardMockStats";
import { TierRewardsSection } from "@/components/dashboard/TierRewardsSection";
import { CURRENT_VENUE_COOKIE } from "@/lib/constants";
import { allowedVenuesForUser, isDashboardAdmin, isVenueStaffForVenue } from "@/lib/dashboard-auth";
import { createServerSupabase } from "@/lib/supabase-server";
import { getMembershipDisplayState } from "@/lib/membership-display-state";
import { memberDisplayNameFromUser } from "@/lib/user-display-name";
import { venueDisplayName } from "@/lib/venues";

/** Dashboard is real data from Supabase (memberships, scans, etc.). Never cache so grant redirect shows updated list. */
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ granted?: string }>;
}) {
  const { granted } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const memberDisplayName = memberDisplayNameFromUser(user);
  const isAdmin = isDashboardAdmin(user);

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, tier, status, expires_at, venue_id, venues(name, slug, is_demo)")
    .eq("user_id", user.id);
  const { data: staffVenuesData } = await supabase
    .from("venue_staff")
    .select("venue_id, venues(id, name, slug, is_demo)")
    .eq("user_id", user.id);
  type V = { id: string; name: string; slug: string; is_demo?: boolean };
  const staffVenueList = (staffVenuesData ?? [])
    .map((s) => (s as unknown as { venues: V | null }).venues)
    .filter((v): v is V => v != null && (!v.is_demo || isAdmin));
  const staffVenueIds = staffVenueList.map((v) => v.id);

  const fromMemberships = (memberships ?? [])
    .map((m) => (m as unknown as { venues: V | null }).venues)
    .filter((v): v is V => v != null && (!v.is_demo || isAdmin));
  const allowedOptions = allowedVenuesForUser({
    isAdmin,
    fromMemberships: fromMemberships.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
    fromStaff: staffVenueList.map((v) => ({ id: v.id, slug: v.slug, name: v.name })),
  });
  const allowedSlugs = new Set(allowedOptions.map((v) => v.slug));

  const rawSlug = cookieStore.get(CURRENT_VENUE_COOKIE)?.value ?? null;
  const currentSlug = rawSlug?.trim() || null;
  let venue: { id: string } | null = null;
  if (currentSlug && allowedSlugs.has(currentSlug)) {
    const res = await supabase.from("venues").select("id").eq("slug", currentSlug).maybeSingle();
    venue = res.data ?? null;
  }
  if (!venue?.id && allowedOptions.length > 0) {
    const firstSlug = allowedOptions[0].slug;
    const res = await supabase.from("venues").select("id").eq("slug", firstSlug).maybeSingle();
    venue = res.data ?? null;
    if (venue && currentSlug !== firstSlug) {
      redirect(`/api/set-venue?venue=${encodeURIComponent(firstSlug)}&next=/dashboard`);
    }
  }

  const { data: tierBenefits } =
    venue?.id
      ? await supabase
          .from("venue_tier_benefits")
          .select("tier_key, benefit_label, description, sort_order")
          .eq("venue_id", venue.id)
          .eq("active", true)
      : { data: null };

  const isInternal = isAdmin;
  const isVenueOwner = !isAdmin && staffVenueIds.length > 0;

  const showVenueMembersList = venue?.id && isVenueStaffForVenue({ staffVenueIds, venueId: venue.id });
  const { data: venueMembersRows } =
    showVenueMembersList && venue?.id
      ? await supabase
          .from("memberships")
          .select("id, user_id, tier, status, expires_at")
          .eq("venue_id", venue.id)
          .order("tier", { ascending: true })
      : { data: null };
  const venueMembers = (venueMembersRows ?? []) as { id: string; user_id: string; tier: string; status: string; expires_at?: string | null }[];

  type Row = { id: string; venues: { name: string; slug?: string; is_demo?: boolean } | null; tier: string; status: string; expires_at?: string | null };
  const rows = (memberships ?? []) as unknown as Row[];
  const list = rows
    .filter((m) => !m.venues?.is_demo || isInternal)
    .map((m) => {
      const display = getMembershipDisplayState({ status: m.status, tier: m.tier, expires_at: m.expires_at });
      return {
        id: m.id,
        venueName: m.venues?.name ?? "—",
        venueSlug: m.venues?.slug ?? null,
        tier: m.tier,
        displayState: display,
      };
    });

  // Selected venue name (from memberships or allowed staff venues so staff-only owners get a name)
  const selectedVenueName =
    list.find((r) => r.venueSlug === currentSlug)?.venueName ??
    allowedOptions.find((o) => o.slug === currentSlug)?.name ??
    (currentSlug ? venueDisplayName(currentSlug, "Venue") : null);
  const listSortedBySelected = currentSlug
    ? [...list].sort((a, b) => (a.venueSlug === currentSlug ? -1 : b.venueSlug === currentSlug ? 1 : 0))
    : list;

  // Your scan activity at this venue (RLS allows user to read own rows)
  type ScanRow = { scanned_at: string; scan_result: string };
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekIso = startOfWeek.toISOString();

  let yourScansToday = 0;
  let yourScansThisWeek = 0;
  let lastScanAt: string | null = null;
  if (venue?.id && user?.id) {
    const { data: scans } = await supabase
      .from("venue_scan_events")
      .select("scanned_at, scan_result")
      .eq("venue_id", venue.id)
      .eq("user_id", user.id)
      .eq("scan_result", "valid")
      .order("scanned_at", { ascending: false })
      .limit(100);
    const listScans = (scans ?? []) as ScanRow[];
    yourScansToday = listScans.filter((s) => s.scanned_at >= startOfToday).length;
    yourScansThisWeek = listScans.filter((s) => s.scanned_at >= startOfWeekIso).length;
    lastScanAt = listScans[0]?.scanned_at ?? null;
  }

  // venue_transactions (drinks) and venue_redemptions — safe when migrations not yet applied (error => 0)
  let drinksToday = 0;
  let drinksThisWeek = 0;
  let redemptionsToday = 0;
  let redemptionsThisWeek = 0;
  if (venue?.id && user?.id) {
    const { data: txRows, error: _txErr } = await supabase
      .from("venue_transactions")
      .select("occurred_at, kind, quantity")
      .eq("venue_id", venue.id)
      .eq("user_id", user.id)
      .gte("occurred_at", startOfWeekIso);
    if (!_txErr && txRows?.length) {
      const txList = txRows as { occurred_at: string; kind: string; quantity: number }[];
      const drinkTx = txList.filter((t) => t.kind === "drink" || t.kind === "drinks");
      drinksThisWeek = drinkTx.reduce((sum, t) => sum + (t.quantity ?? 1), 0);
      drinksToday = drinkTx.filter((t) => t.occurred_at >= startOfToday).reduce((sum, t) => sum + (t.quantity ?? 1), 0);
    }
    const { data: redRows, error: _redErr } = await supabase
      .from("venue_redemptions")
      .select("redeemed_at")
      .eq("venue_id", venue.id)
      .eq("user_id", user.id)
      .gte("redeemed_at", startOfWeekIso);
    if (!_redErr && redRows?.length !== undefined) {
      const redList = redRows as { redeemed_at: string }[];
      redemptionsThisWeek = redList.length;
      redemptionsToday = redList.filter((r) => r.redeemed_at >= startOfToday).length;
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {granted === "ok" && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 text-green-800 dark:text-green-200 text-sm">
          Membership granted. You can switch venues in the sidebar or go to Pass & QR to see your pass.
        </div>
      )}

      {isVenueOwner && selectedVenueName ? (
        /* Venue owner splash: their venue front and center, links to data, member list */
        <>
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--venue-text)" }}>
              {selectedVenueName}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
              Manage your venue
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Link
              href="#members"
              className="group flex flex-col rounded-xl border border-white/10 p-5 transition hover:border-[var(--venue-accent)]/50 hover:bg-white/5"
              style={{ backgroundColor: "var(--venue-bg-elevated)" }}
            >
              <span className="text-lg font-semibold" style={{ color: "var(--venue-text)" }}>Members</span>
              <span className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
                {venueMembers.length} {venueMembers.length === 1 ? "member" : "members"}
              </span>
              <span className="mt-2 text-sm font-medium group-hover:underline" style={{ color: "var(--venue-accent)" }}>View list →</span>
            </Link>
            <Link
              href="/venue/metrics"
              className="group flex flex-col rounded-xl border border-white/10 p-5 transition hover:border-[var(--venue-accent)]/50 hover:bg-white/5"
              style={{ backgroundColor: "var(--venue-bg-elevated)" }}
            >
              <span className="text-lg font-semibold" style={{ color: "var(--venue-text)" }}>Venue data</span>
              <span className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
                Scans, verifications, activity
              </span>
              <span className="mt-2 text-sm font-medium group-hover:underline" style={{ color: "var(--venue-accent)" }}>Open metrics →</span>
            </Link>
            <Link
              href={currentSlug ? `/membership?venue=${encodeURIComponent(currentSlug)}` : "/membership"}
              className="group flex flex-col rounded-xl border border-white/10 p-5 transition hover:border-[var(--venue-accent)]/50 hover:bg-white/5"
              style={{ backgroundColor: "var(--venue-bg-elevated)" }}
            >
              <span className="text-lg font-semibold" style={{ color: "var(--venue-text)" }}>Pass & QR</span>
              <span className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
                Your membership pass
              </span>
              <span className="mt-2 text-sm font-medium group-hover:underline" style={{ color: "var(--venue-accent)" }}>View pass →</span>
            </Link>
          </div>

          <section id="members" className="scroll-mt-4">
            <h2 className="text-sm font-medium mb-3" style={{ color: "var(--venue-text-muted)" }}>
              Members at {selectedVenueName}
            </h2>
            <div className="rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              {venueMembers.length === 0 ? (
                <p className="px-4 py-6 text-sm" style={{ color: "var(--venue-text-muted)" }}>
                  No members yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Member</th>
                      <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Tier</th>
                      <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venueMembers.map((m) => {
                      const display = getMembershipDisplayState({ status: m.status, tier: m.tier, expires_at: m.expires_at });
                      return (
                        <tr key={m.id} className="border-b border-white/5 last:border-0">
                          <td className="px-4 py-2.5" style={{ color: "var(--venue-text)" }}>Member</td>
                          <td className="px-4 py-2.5 capitalize" style={{ color: "var(--venue-text)" }}>{m.tier}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className="text-xs px-2 py-0.5 rounded font-medium capitalize"
                              style={{
                                backgroundColor: display.badgeColor === "green" ? "rgb(34 197 94 / 0.2)" : display.badgeColor === "orange" ? "rgb(249 115 22 / 0.2)" : display.badgeColor === "red" ? "rgb(239 68 68 / 0.2)" : display.badgeColor === "yellow" ? "rgb(234 179 8 / 0.2)" : "rgb(113 113 122 / 0.2)",
                                color: display.badgeColor === "green" ? "rgb(34 197 94)" : display.badgeColor === "orange" ? "rgb(249 115 22)" : display.badgeColor === "red" ? "rgb(239 68 68)" : display.badgeColor === "yellow" ? "rgb(234 179 8)" : "rgb(113 113 122)",
                              }}
                            >
                              {display.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      ) : (
        /* Admin / member dashboard: memberships, tier rewards, your activity */
        <>
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--venue-text)" }}>
              Dashboard
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
              {memberDisplayName}
              {selectedVenueName && (
                <> · Viewing {selectedVenueName}</>
              )}
            </p>
          </div>

          <section className="rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <ul className="divide-y divide-white/5">
              {listSortedBySelected.length === 0 ? (
                <li className="px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
                    No membership yet. Get one at a venue to see your pass and activity.
                  </p>
                  <Link
                    href="/join"
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] shrink-0"
                    style={{ backgroundColor: "var(--venue-accent)", color: "#0f0f0f" }}
                  >
                    Get membership
                  </Link>
                </li>
              ) : (
                listSortedBySelected.map((r) => {
                  const isSelectedVenue = r.venueSlug === currentSlug;
                  const tierLabel = r.tier.charAt(0).toUpperCase() + r.tier.slice(1);
                  const d = r.displayState;
                  return (
                    <li
                      key={r.id}
                      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 ${isSelectedVenue ? "border-l-4 border-[var(--venue-accent)]" : ""}`}
                    >
                      <span className="text-sm font-medium" style={{ color: "var(--venue-text)" }}>{tierLabel} · {r.venueName ?? "—"}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{
                          backgroundColor: d.badgeColor === "green" ? "rgb(34 197 94 / 0.2)" : d.badgeColor === "orange" ? "rgb(249 115 22 / 0.2)" : d.badgeColor === "red" ? "rgb(239 68 68 / 0.2)" : d.badgeColor === "yellow" ? "rgb(234 179 8 / 0.2)" : "rgb(113 113 122 / 0.2)",
                          color: d.badgeColor === "green" ? "rgb(34 197 94)" : d.badgeColor === "orange" ? "rgb(249 115 22)" : d.badgeColor === "red" ? "rgb(239 68 68)" : d.badgeColor === "yellow" ? "rgb(234 179 8)" : "rgb(113 113 122)",
                        }}
                      >
                        {d.label}
                      </span>
                      {isSelectedVenue && (
                        <Link
                          href={r.venueSlug ? `/membership?venue=${encodeURIComponent(r.venueSlug)}` : "/membership"}
                          className="ml-auto text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] rounded px-2 py-1"
                          style={{ color: "var(--venue-accent)" }}
                        >
                          Pass & QR →
                        </Link>
                      )}
                      {!isSelectedVenue && (
                        <span className="ml-auto text-xs" style={{ color: "var(--venue-text-muted)" }}>Switch venue to view pass</span>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <TierRewardsSection benefitsByTier={tierBenefits ?? undefined} venueName={selectedVenueName ?? undefined} />

          {showVenueMembersList && selectedVenueName && (
            <section className="mt-6">
              <h2 className="text-sm font-medium mb-3" style={{ color: "var(--venue-text-muted)" }}>
                Members at {selectedVenueName}
              </h2>
              <div className="rounded-lg border border-white/10 overflow-hidden" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                {venueMembers.length === 0 ? (
                  <p className="px-4 py-4 text-sm" style={{ color: "var(--venue-text-muted)" }}>
                    No members yet.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Member</th>
                        <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Tier</th>
                        <th className="px-4 py-2.5 font-medium" style={{ color: "var(--venue-text-muted)" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {venueMembers.map((m) => {
                        const display = getMembershipDisplayState({ status: m.status, tier: m.tier, expires_at: m.expires_at });
                        return (
                          <tr key={m.id} className="border-b border-white/5 last:border-0">
                            <td className="px-4 py-2.5" style={{ color: "var(--venue-text)" }}>Member</td>
                            <td className="px-4 py-2.5 capitalize" style={{ color: "var(--venue-text)" }}>{m.tier}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className="text-xs px-2 py-0.5 rounded font-medium capitalize"
                                style={{
                                  backgroundColor: display.badgeColor === "green" ? "rgb(34 197 94 / 0.2)" : display.badgeColor === "orange" ? "rgb(249 115 22 / 0.2)" : display.badgeColor === "red" ? "rgb(239 68 68 / 0.2)" : display.badgeColor === "yellow" ? "rgb(234 179 8 / 0.2)" : "rgb(113 113 122 / 0.2)",
                                  color: display.badgeColor === "green" ? "rgb(34 197 94)" : display.badgeColor === "orange" ? "rgb(249 115 22)" : display.badgeColor === "red" ? "rgb(239 68 68)" : display.badgeColor === "yellow" ? "rgb(234 179 8)" : "rgb(113 113 122)",
                                }}
                              >
                                {display.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {selectedVenueName && (
            <section className="mt-6">
              <h2 className="text-sm font-medium mb-3" style={{ color: "var(--venue-text-muted)" }}>
                Your activity
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-white/10 px-3 py-2.5" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Scans today</p>
                  <p className="text-lg font-semibold" style={{ color: "var(--venue-text)" }}>{yourScansToday}</p>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2.5" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Scans this week</p>
                  <p className="text-lg font-semibold" style={{ color: "var(--venue-text)" }}>{yourScansThisWeek}</p>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2.5" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Last scan</p>
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--venue-text)" }}>
                    {lastScanAt ? new Date(lastScanAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2.5" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Drinks · rewards</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--venue-text)" }}>{drinksToday} · {redemptionsToday}</p>
                </div>
              </div>
            </section>
          )}

          <DashboardMockStats venueName={selectedVenueName ?? undefined} />
        </>
      )}
    </div>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardMockStats } from "@/components/dashboard/DashboardMockStats";
import { TierRewardsSection } from "@/components/dashboard/TierRewardsSection";
import { CURRENT_VENUE_COOKIE } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase-server";
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

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, tier, status, venue_id, venues(name, slug, is_demo)")
    .eq("user_id", user.id);

  const currentSlug = cookieStore.get(CURRENT_VENUE_COOKIE)?.value ?? null;
  let venue: { id: string } | null = null;
  if (currentSlug) {
    const res = await supabase.from("venues").select("id").eq("slug", currentSlug).maybeSingle();
    venue = res.data ?? null;
  }
  if (!venue?.id && (memberships?.length ?? 0) > 0) {
    const first = (memberships as { venue_id?: string }[])[0];
    if (first?.venue_id) venue = { id: first.venue_id };
  }

  const { data: tierBenefits } =
    venue?.id
      ? await supabase
          .from("venue_tier_benefits")
          .select("tier_key, benefit_label, description, sort_order")
          .eq("venue_id", venue.id)
          .eq("active", true)
      : { data: null };

  const internalDemoUserIds = (process.env.INTERNAL_DEMO_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isInternal = internalDemoUserIds.includes(user.id);

  type Row = { id: string; venues: { name: string; slug?: string; is_demo?: boolean } | null; tier: string };
  const rows = (memberships ?? []) as unknown as Row[];
  const list = rows
    .filter((m) => !m.venues?.is_demo || isInternal)
    .map((m) => ({
      id: m.id,
      venueName: m.venues?.name ?? "—",
      venueSlug: m.venues?.slug ?? null,
      tier: m.tier,
    }));

  // Selected venue from sidebar cookie — all dashboard content is scoped to this venue
  const selectedVenueName =
    list.find((r) => r.venueSlug === currentSlug)?.venueName ??
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
    <div className="p-6 sm:p-8 md:p-10 max-w-4xl mx-auto">
      {granted === "ok" && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 text-green-800 dark:text-green-200 text-sm">
          Membership granted. You can switch venues in the sidebar or go to Pass & QR to see your pass.
        </div>
      )}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--venue-accent)" }}>
          Membership that drives repeat traffic
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: "var(--venue-text)" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-base font-medium" style={{ color: "var(--venue-text)" }}>
          {memberDisplayName}
        </p>
        <p className="mt-0.5 text-sm" style={{ color: "var(--venue-text-muted)" }}>
          {user.email}
        </p>
        {selectedVenueName && (
          <p className="mt-2 text-sm font-medium" style={{ color: "var(--venue-accent)" }}>
            Viewing: {selectedVenueName}
          </p>
        )}
      </div>

      <section className="rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>
            {selectedVenueName ? `Your membership at ${selectedVenueName}` : "Your membership"}
          </h2>
        </div>
        <ul className="divide-y divide-white/5">
          {listSortedBySelected.length === 0 ? (
            <li className="px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
                You don&apos;t have a membership yet. Get one at a venue to see your pass, QR code, and activity here.
              </p>
              <Link
                href="/join"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)] shrink-0"
                style={{ backgroundColor: "var(--venue-accent)", color: "#0f0f0f" }}
              >
                Get membership
              </Link>
            </li>
          ) : (
            listSortedBySelected.map((r) => {
              const isSelectedVenue = r.venueSlug === currentSlug;
              const tierLabel = r.tier.charAt(0).toUpperCase() + r.tier.slice(1);
              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 ${isSelectedVenue ? "border-l-4 border-[var(--venue-accent)]" : ""}`}
                >
                  <span className="font-medium" style={{ color: "var(--venue-text)" }}>{memberDisplayName}</span>
                  <span className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
                    {tierLabel} at {r.venueName ?? "—"}
                  </span>
                  {isSelectedVenue && (
                    <>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: "var(--venue-accent)", color: "#0f0f0f" }}>Viewing</span>
                      <Link
                        href={r.venueSlug ? `/membership?venue=${encodeURIComponent(r.venueSlug)}` : "/membership"}
                        className="ml-auto text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] rounded px-3 py-1.5"
                        style={{ color: "var(--venue-accent)" }}
                      >
                        View pass & QR →
                      </Link>
                    </>
                  )}
                  {!isSelectedVenue && (
                    <span className="ml-auto text-sm" style={{ color: "var(--venue-text-muted)" }}>Switch venue above to view pass</span>
                  )}
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ backgroundColor: "rgba(212, 168, 83, 0.2)", color: "var(--venue-accent)" }}>{r.tier}</span>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <TierRewardsSection benefitsByTier={tierBenefits ?? undefined} venueName={selectedVenueName ?? undefined} />

      {/* Your activity at this venue: real scan data + placeholders for drinks/rewards */}
      {selectedVenueName && (
        <section className="mt-8">
          <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--venue-accent)" }}>
            Your activity
          </p>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--venue-text)" }}>
            At {selectedVenueName}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Door scans today</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--venue-text)" }}>{yourScansToday}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--venue-accent)" }}>valid entries</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Door scans this week</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--venue-text)" }}>{yourScansThisWeek}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--venue-accent)" }}>valid entries</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Last scan</p>
              <p className="mt-2 text-lg font-semibold" style={{ color: "var(--venue-text)" }}>
                {lastScanAt ? new Date(lastScanAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Drinks today</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--venue-text)" }}>{drinksToday}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--venue-accent)" }}>This week: {drinksThisWeek}</p>
            </div>
            <div className="rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Rewards used today</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--venue-text)" }}>{redemptionsToday}</p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--venue-accent)" }}>This week: {redemptionsThisWeek}</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Data source</p>
            <p className="mt-1 text-sm" style={{ color: "var(--venue-text)" }}>
              Scans from door checks. Drinks and rewards from <code className="text-[var(--venue-accent)]">venue_transactions</code> and <code className="text-[var(--venue-accent)]">venue_redemptions</code> when recorded by the venue.
            </p>
          </div>
        </section>
      )}

      <DashboardMockStats venueName={selectedVenueName ?? undefined} />

      <form action="/auth/logout" method="post" className="mt-8">
        <button
          type="submit"
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)]"
          style={{ color: "var(--venue-text-muted)" }}
        >
          Log out
        </button>
      </form>
    </div>
  );
}

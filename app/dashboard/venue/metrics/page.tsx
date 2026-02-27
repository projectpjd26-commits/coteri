import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { LiveVerificationCount } from "@/components/venue/LiveVerificationCount";
import { ScanHeatmap } from "@/components/venue/ScanHeatmap";
import { isDashboardAdmin } from "@/lib/dashboard-auth";
import { PILOT_VENUE_SLUGS, ALLOWED_METRICS_ROLES } from "@/lib/constants";
import type { VenueStaffRoleValue } from "@/lib/constants";

function formatDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function truncateId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export default async function VenueMetricsPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const { venue: venueSlugParam } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const { data: currentUserStaff } = await supabase
    .from("venue_staff")
    .select("venue_id, role, venues(id, name, slug)")
    .eq("user_id", session.user.id);
  const staffList = currentUserStaff ?? [];
  type StaffWithVenueRow = {
    venue_id: string;
    role: string;
    venues: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  };
  let allowed = staffList
    .filter(
      (s: StaffWithVenueRow) =>
        s.venue_id &&
        s.role &&
        ALLOWED_METRICS_ROLES.includes(s.role as VenueStaffRoleValue)
    )
    .map((s: StaffWithVenueRow) => {
      const v = s.venues;
      const single = Array.isArray(v) ? v[0] ?? null : v;
      return { venue_id: s.venue_id, role: s.role, venues: single };
    });

  if (allowed.length === 0 && isDashboardAdmin(session.user)) {
    const { data: adminVenues } = await supabase
      .from("venues")
      .select("id, name, slug")
      .in("slug", [...PILOT_VENUE_SLUGS]);
    if (adminVenues?.length) {
      allowed = adminVenues.map((v) => ({
        venue_id: v.id,
        role: "owner" as const,
        venues: v as { id: string; name: string; slug: string },
      }));
    }
  }

  if (allowed.length === 0) {
    redirect("/");
  }

  // Resolve venue: ?venue=slug or first allowed
  const staffRecord = venueSlugParam
    ? allowed.find((a) => a.venues?.slug === venueSlugParam) ?? allowed[0]
    : allowed[0];
  const venueId = staffRecord.venue_id;
  const venueName =
    staffRecord.venues && typeof staffRecord.venues === "object" && "name" in staffRecord.venues
      ? (staffRecord.venues as { name: string }).name
      : "—";

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let total24h: number | null = null;
  let valid24h: number | null = null;
  let invalid24h: number | null = null;
  let flagged24h: number | null = null;
  let todayApproved: number = 0;

  try {
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
    const todayStart = startOfToday.toISOString();
    const todayEnd = startOfTomorrow.toISOString();

    const [totalRes, validRes, invalidRes, flaggedRes, dailyView] = await Promise.all([
      supabase
        .from("verification_events")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .gte("occurred_at", twentyFourHoursAgo),
      supabase
        .from("verification_events")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .eq("result", "valid")
        .gte("occurred_at", twentyFourHoursAgo),
      supabase
        .from("verification_events")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .eq("result", "invalid")
        .gte("occurred_at", twentyFourHoursAgo),
      supabase
        .from("verification_events")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .not("flag_reason", "is", null)
        .gte("occurred_at", twentyFourHoursAgo),
      supabase
        .from("venue_daily_scans")
        .select("approved_scans")
        .eq("venue_id", venueId)
        .gte("day", todayStart)
        .lt("day", todayEnd)
        .maybeSingle(),
    ]);
    total24h = totalRes.count ?? null;
    valid24h = validRes.count ?? null;
    invalid24h = invalidRes.count ?? null;
    flagged24h = flaggedRes.count ?? null;
    todayApproved = (dailyView.data as { approved_scans?: number } | null)?.approved_scans ?? 0;
  } catch {
    // fail closed
  }

  type DailyRow = { date: string; total: number; valid: number; invalid: number };
  let dailyRows: DailyRow[] = [];

  try {
    const { data: events } = await supabase
      .from("verification_events")
      .select("occurred_at, result")
      .eq("venue_id", venueId)
      .gte("occurred_at", sevenDaysAgo);

    const byDay: Record<string, { total: number; valid: number; invalid: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      const key = formatDay(d.toISOString());
      byDay[key] = { total: 0, valid: 0, invalid: 0 };
    }
    for (const row of events ?? []) {
      const day = formatDay(row.occurred_at);
      if (day in byDay) {
        byDay[day].total += 1;
        if (row.result === "valid") byDay[day].valid += 1;
        else if (row.result === "invalid") byDay[day].invalid += 1;
      }
    }
    dailyRows = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));
  } catch {
    // fail closed
  }

  type StaffRow = { staff_user_id: string; total: number; invalid: number; flagged: number };
  let staffRows: StaffRow[] = [];

  type TierUsageRow = { tier: string; total_scans: number };
  let tierUsageRows: TierUsageRow[] = [];

  try {
    const { data: events } = await supabase
      .from("verification_events")
      .select("staff_user_id, result, flag_reason")
      .eq("venue_id", venueId)
      .gte("occurred_at", sevenDaysAgo);

    const byStaff: Record<string, { total: number; invalid: number; flagged: number }> = {};
    for (const row of events ?? []) {
      const id = row.staff_user_id;
      if (!byStaff[id]) byStaff[id] = { total: 0, invalid: 0, flagged: 0 };
      byStaff[id].total += 1;
      if (row.result === "invalid") byStaff[id].invalid += 1;
      if (row.flag_reason != null) byStaff[id].flagged += 1;
    }
    staffRows = Object.entries(byStaff)
      .map(([staff_user_id, counts]) => ({ staff_user_id, ...counts }))
      .sort((a, b) => b.total - a.total);
  } catch {
    // fail closed
  }

  try {
    const { data: tierRows } = await supabase
      .from("venue_tier_usage")
      .select("tier, total_scans")
      .eq("venue_id", venueId);
    tierUsageRows = (tierRows ?? []) as TierUsageRow[];
  } catch {
    // view may not exist yet
  }

  type FraudRatioRow = { day: string; total_scans: number; invalid_ratio_pct: number | null; flagged_ratio_pct: number | null };
  let fraudToday: FraudRatioRow | null = null;
  let fraud7dInvalidPct: number | null = null;
  let fraud7dFlaggedPct: number | null = null;
  try {
    const todayStr = now.toISOString().slice(0, 10);
    const { data: fraudRows } = await supabase
      .from("venue_scan_fraud_ratios")
      .select("day, total_scans, invalid_ratio_pct, flagged_ratio_pct")
      .eq("venue_id", venueId)
      .gte("day", sevenDaysAgo.slice(0, 10));
    const list = (fraudRows ?? []) as FraudRatioRow[];
    fraudToday = list.find((r) => String(r.day).slice(0, 10) === todayStr) ?? null;
    if (list.length > 0) {
      const totalScans = list.reduce((s, r) => s + r.total_scans, 0);
      const { data: events } = await supabase
        .from("verification_events")
        .select("result, flag_reason")
        .eq("venue_id", venueId)
        .gte("occurred_at", sevenDaysAgo);
      const eventsList = events ?? [];
      const invalid7d = eventsList.filter((e) => e.result === "invalid" || e.result === "expired").length;
      const flagged7d = eventsList.filter((e) => e.flag_reason != null).length;
      fraud7dInvalidPct = totalScans > 0 ? Math.round((invalid7d / totalScans) * 1000) / 10 : null;
      fraud7dFlaggedPct = totalScans > 0 ? Math.round((flagged7d / totalScans) * 1000) / 10 : null;
    }
  } catch {
    // view may not exist yet
  }

  type UtilizationRow = { total_members: number; members_with_scan_7d: number; utilization_7d_pct: number | null };
  let utilization: UtilizationRow | null = null;
  try {
    const { data: u } = await supabase
      .from("venue_membership_utilization")
      .select("total_members, members_with_scan_7d, utilization_7d_pct")
      .eq("venue_id", venueId)
      .maybeSingle();
    utilization = u as UtilizationRow | null;
  } catch {
    // view may not exist yet
  }

  type StaffMetricsRow = { staff_user_id: string; total_scans: number; valid_count: number; invalid_count: number; flagged_count: number; invalid_ratio_pct: number | null; flagged_ratio_pct: number | null };
  let staffMetricsRows: StaffMetricsRow[] = [];
  try {
    const { data: staffMetrics } = await supabase
      .from("venue_staff_verification_metrics")
      .select("staff_user_id, total_scans, valid_count, invalid_count, flagged_count, invalid_ratio_pct, flagged_ratio_pct")
      .eq("venue_id", venueId);
    staffMetricsRows = (staffMetrics ?? []) as StaffMetricsRow[];
  } catch {
    // view may not exist yet; fall back to existing staffRows
  }

  type RevenueByTierRow = { tier: string; revenue_cents: number; tx_count: number };
  let revenueByTierRows: RevenueByTierRow[] = [];
  try {
    const { data: revRows } = await supabase
      .from("venue_revenue_by_tier")
      .select("tier, revenue_cents, tx_count")
      .eq("venue_id", venueId);
    revenueByTierRows = (revRows ?? []) as RevenueByTierRow[];
  } catch {
    // view or table may not exist yet
  }

  type HourlyRow = { day: string; hour: number; total_scans: number };
  let hourlyRows: HourlyRow[] = [];
  try {
    const startOfSevenDaysAgo = new Date(now);
    startOfSevenDaysAgo.setUTCDate(startOfSevenDaysAgo.getUTCDate() - 7);
    startOfSevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const { data: hourlyData } = await supabase
      .from("venue_daily_hourly_scans")
      .select("day, hour, total_scans")
      .eq("venue_id", venueId)
      .gte("day", startOfSevenDaysAgo.toISOString().slice(0, 10));
    hourlyRows = (hourlyData ?? []) as HourlyRow[];
  } catch {
    // view may not exist yet
  }

  type AIInsightRow = { id: string; generated_at: string; summary_text: string; recommendations: unknown };
  let aiInsights: AIInsightRow[] = [];
  try {
    const { data: insights } = await supabase
      .from("venue_ai_insights")
      .select("id, generated_at, summary_text, recommendations")
      .eq("venue_id", venueId)
      .order("generated_at", { ascending: false })
      .limit(3);
    aiInsights = (insights ?? []) as AIInsightRow[];
  } catch {
    // table may not exist yet or feature off
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ color: "var(--venue-text)" }}>
          Venue Intelligence
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--venue-text-muted)" }}>
          <strong>{venueName}</strong>
        </p>
        {allowed.length > 1 && (
          <p className="mt-2 text-xs flex flex-wrap gap-x-2 gap-y-1" style={{ color: "var(--venue-text-muted)" }}>
            <span>Switch venue:</span>
            {allowed.map((a) => {
              const v = a.venues;
              const slug = v?.slug;
              const name = v?.name ?? "—";
              const isCurrent = a.venue_id === venueId;
              return slug ? (
                <a
                  key={a.venue_id}
                  href={`/dashboard/venue/metrics?venue=${encodeURIComponent(slug)}`}
                  className={isCurrent ? "font-medium underline" : "hover:underline"}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {name}
                </a>
              ) : null;
            })}
          </p>
        )}
        <p className="mt-1 text-xs max-w-xl" style={{ color: "var(--venue-text-muted)" }}>
          Every scan becomes structured data. Traffic, tier mix, and peak hours — all in real time.
        </p>
      </header>

      {aiInsights.length > 0 && (
        <section className="mt-8" aria-label="Proactive Insights">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: "var(--venue-text-muted)" }}>
            Proactive Insights
          </h2>
          <div className="space-y-4">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="rounded-lg border border-white/10 p-4 min-w-0"
                style={{ backgroundColor: "var(--venue-bg-elevated)" }}
              >
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--venue-text)" }}>
                  {insight.summary_text}
                </p>
                {Array.isArray(insight.recommendations) && insight.recommendations.length > 0 && (
                  <ul className="mt-3 list-disc list-inside text-sm space-y-1" style={{ color: "var(--venue-text-muted)" }}>
                    {insight.recommendations.map((rec: unknown, i: number) => (
                      <li key={i}>
                        {typeof rec === "string" ? rec : typeof rec === "object" && rec !== null && "text" in (rec as object) ? String((rec as { text: unknown }).text) : JSON.stringify(rec)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs" style={{ color: "var(--venue-text-muted)" }}>
                  {new Date(insight.generated_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {aiInsights.length === 0 && (
        <section className="mt-8" aria-label="Proactive Insights">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: "var(--venue-text-muted)" }}>
            Proactive Insights
          </h2>
          <div className="rounded-lg border border-white/10 p-4 text-sm" style={{ backgroundColor: "var(--venue-bg-elevated)", color: "var(--venue-text-muted)" }}>
            Insights will appear here after the next AI operations run.
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-2" style={{ color: "var(--venue-text-muted)" }}>
          Live today
        </h2>
        <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
          <LiveVerificationCount venueId={venueId} initialCount={todayApproved} label="Today" />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
          Last 24 hours
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Total</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: "var(--venue-text)" }}>
              {total24h !== null ? total24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Valid</div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
              {valid24h !== null ? valid24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Invalid</div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
              {invalid24h !== null ? invalid24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Flagged</div>
            <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
              {flagged24h !== null ? flagged24h : "—"}
            </div>
          </div>
        </div>
      </section>

      {(fraudToday !== null || fraud7dInvalidPct !== null) && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
            Fraud / invalid scan ratios
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {fraudToday && (
              <>
                <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Today invalid %</div>
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
                    {fraudToday.invalid_ratio_pct != null ? `${fraudToday.invalid_ratio_pct}%` : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Today flagged %</div>
                  <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
                    {fraudToday.flagged_ratio_pct != null ? `${fraudToday.flagged_ratio_pct}%` : "—"}
                  </div>
                </div>
              </>
            )}
            {fraud7dInvalidPct != null && (
              <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>7d invalid %</div>
                <div className="text-2xl font-semibold mt-1" style={{ color: "var(--venue-text)" }}>{fraud7dInvalidPct}%</div>
              </div>
            )}
            {fraud7dFlaggedPct != null && (
              <div className="rounded-lg border border-white/10 p-4 min-w-0" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>7d flagged %</div>
                <div className="text-2xl font-semibold mt-1" style={{ color: "var(--venue-text)" }}>{fraud7dFlaggedPct}%</div>
              </div>
            )}
          </div>
        </section>
      )}

      {utilization !== null && utilization.total_members > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
            Membership utilization (7d)
          </h2>
          <div className="rounded-lg border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>Members with at least one valid scan</div>
            <div className="text-2xl font-semibold mt-1" style={{ color: "var(--venue-text)" }}>
              {utilization.utilization_7d_pct != null ? `${utilization.utilization_7d_pct}%` : "—"}
              <span className="text-sm font-normal ml-2" style={{ color: "var(--venue-text-muted)" }}>
                ({utilization.members_with_scan_7d} / {utilization.total_members} members)
              </span>
            </div>
          </div>
        </section>
      )}

      {tierUsageRows.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
            Tier usage (all time)
          </h2>
          <p className="text-sm mb-3" style={{ color: "var(--venue-text-muted)" }}>
            Scan count by membership tier. e.g. &quot;VIP members account for 42% of visits.&quot;
          </p>
          <div className="overflow-x-auto rounded-lg border border-white/10" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <th className="px-4 py-3 text-left font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                    Scans
                  </th>
                </tr>
              </thead>
              <tbody>
                {tierUsageRows.map(({ tier, total_scans }) => (
                  <tr key={tier} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 capitalize" style={{ color: "var(--venue-text)" }}>{tier}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>{total_scans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
          Peak hours & heatmap
        </h2>
        <div className="rounded-lg border border-white/10 p-4" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
          <ScanHeatmap data={hourlyRows} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
          Last 7 days (daily)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-white/10" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                <th className="px-4 py-3 text-left font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Valid
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Invalid
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length > 0 ? (
                dailyRows.map(({ date, total, valid, invalid }) => (
                  <tr key={date} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3" style={{ color: "var(--venue-text)" }}>{date}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>{total}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{valid}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{invalid}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-3" style={{ color: "var(--venue-text-muted)" }}>
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
          Staff verification metrics
        </h2>
        <div className="overflow-x-auto rounded-lg border border-white/10" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                <th className="px-4 py-3 text-left font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Staff
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Invalid
                </th>
                <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                  Flagged
                </th>
                {staffMetricsRows.length > 0 && staffMetricsRows[0].invalid_ratio_pct != null && (
                  <>
                    <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                      Invalid %
                    </th>
                    <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                      Flagged %
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {staffMetricsRows.length > 0 ? (
                staffMetricsRows.map((row) => (
                  <tr key={row.staff_user_id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--venue-text-muted)" }}>
                      {truncateId(row.staff_user_id)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>{row.total_scans}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{row.invalid_count}</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{row.flagged_count}</td>
                    {row.invalid_ratio_pct != null && (
                      <>
                        <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text-muted)" }}>{row.invalid_ratio_pct}%</td>
                        <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text-muted)" }}>{row.flagged_ratio_pct != null ? `${row.flagged_ratio_pct}%` : "—"}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : staffRows.length > 0 ? (
                staffRows.map(({ staff_user_id, total, invalid, flagged }) => (
                  <tr key={staff_user_id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--venue-text-muted)" }}>
                      {truncateId(staff_user_id)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>{total}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{invalid}</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{flagged}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-3" style={{ color: "var(--venue-text-muted)" }}>
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {revenueByTierRows.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-4" style={{ color: "var(--venue-text-muted)" }}>
            Revenue attribution by tier
          </h2>
          <p className="text-sm mb-3" style={{ color: "var(--venue-text-muted)" }}>
            Revenue from venue_transactions linked to membership tier.
          </p>
          <div className="overflow-x-auto rounded-lg border border-white/10" style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--venue-bg-elevated)" }}>
                  <th className="px-4 py-3 text-left font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                    Tier
                  </th>
                  <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right font-medium border-b border-white/10" style={{ color: "var(--venue-text)" }}>
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenueByTierRows.map(({ tier, revenue_cents, tx_count }) => (
                  <tr key={tier} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 capitalize" style={{ color: "var(--venue-text)" }}>{tier.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>
                      ${(revenue_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--venue-text)" }}>{tx_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

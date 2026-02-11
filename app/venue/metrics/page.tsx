import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

function formatDay(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function truncateId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export default async function VenueMetricsPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const ALLOWED_METRICS_ROLES = ["manager", "owner"] as const;
  const { data: currentUserStaff } = await supabase
    .from("venue_staff")
    .select("venue_id, role, venues(name)")
    .eq("user_id", session.user.id)
    .limit(1);
  const staffRecord = currentUserStaff?.[0] ?? null;

  if (
    !staffRecord?.venue_id ||
    !staffRecord.role ||
    !ALLOWED_METRICS_ROLES.includes(staffRecord.role as (typeof ALLOWED_METRICS_ROLES)[number])
  ) {
    redirect("/");
  }

  const venueId = staffRecord.venue_id;
  const venueName =
    staffRecord.venues &&
    typeof staffRecord.venues === "object" &&
    "name" in staffRecord.venues
      ? (staffRecord.venues as { name: string }).name
      : "—";

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let total24h: number | null = null;
  let valid24h: number | null = null;
  let invalid24h: number | null = null;
  let flagged24h: number | null = null;

  try {
    const [totalRes, validRes, invalidRes, flaggedRes] = await Promise.all([
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
    ]);
    total24h = totalRes.count ?? null;
    valid24h = validRes.count ?? null;
    invalid24h = invalidRes.count ?? null;
    flagged24h = flaggedRes.count ?? null;
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

  return (
    <main className="p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
        Venue metrics
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
        Venue: <strong>{venueName}</strong>
      </p>
      <p className="mt-1 text-slate-500 dark:text-slate-500 text-xs">
        Read-only operational view. Non-authoritative.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Last 24 hours
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
              {total24h !== null ? total24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Valid</div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">
              {valid24h !== null ? valid24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invalid</div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">
              {invalid24h !== null ? invalid24h : "—"}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Flagged</div>
            <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
              {flagged24h !== null ? flagged24h : "—"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Last 7 days (daily)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80">
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Valid
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Invalid
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyRows.length > 0 ? (
                dailyRows.map(({ date, total, valid, invalid }) => (
                  <tr key={date} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{date}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{total}</td>
                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">{valid}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{invalid}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
          Staff activity (last 7 days)
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80">
                <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Staff
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Invalid
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  Flagged
                </th>
              </tr>
            </thead>
            <tbody>
              {staffRows.length > 0 ? (
                staffRows.map(({ staff_user_id, total, invalid, flagged }) => (
                  <tr key={staff_user_id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {truncateId(staff_user_id)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">{total}</td>
                    <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">{invalid}</td>
                    <td className="px-4 py-3 text-right text-amber-600 dark:text-amber-400">{flagged}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-slate-500 dark:text-slate-400">
                    —
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

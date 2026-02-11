"use client";

/**
 * Mock vendor statistics for demo. Optional venueName scopes the heading to the selected venue.
 * Not wired to real data.
 */
export function DashboardMockStats({ venueName }: { venueName?: string | null } = {}) {
  return (
    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--venue-accent)" }}>
        What the venue gets
      </p>
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--venue-text)" }}>
        {venueName ? `Verification activity at ${venueName}` : "Verification activity"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value="24" sub="valid scans" />
        <StatCard label="Today" value="2" sub="invalid" />
        <StatCard label="This week" value="312" sub="valid scans" />
        <StatCard label="This week" value="18" sub="invalid" />
      </div>
      <div
        className="mt-6 rounded-xl border border-white/10 overflow-hidden"
        style={{ backgroundColor: "var(--venue-bg-elevated)" }}
      >
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-medium" style={{ color: "var(--venue-text)" }}>
            Recent door scans
          </h3>
        </div>
        <ul className="divide-y divide-white/5">
          <MockRow time="7:42 PM" result="valid" tier="Founder" />
          <MockRow time="7:38 PM" result="valid" tier="VIP" />
          <MockRow time="7:31 PM" result="invalid" tier="—" />
          <MockRow time="7:28 PM" result="valid" tier="Supporter" />
          <MockRow time="7:15 PM" result="valid" tier="Founder" />
        </ul>
        <p className="px-4 py-3 text-xs border-t border-white/10" style={{ color: "var(--venue-text-muted)" }}>
          Building community builds the business. Venue sees only their own data.
        </p>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div
      className="rounded-xl border border-white/10 p-4"
      style={{ backgroundColor: "var(--venue-bg-elevated)" }}
    >
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--venue-text-muted)" }}>{label}</p>
      <p className="mt-2 text-2xl font-semibold" style={{ color: "var(--venue-text)" }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--venue-accent)" }}>{sub}</p>
    </div>
  );
}

function MockRow({
  time,
  result,
  tier,
}: {
  time: string;
  result: "valid" | "invalid";
  tier: string;
}) {
  return (
    <li className="flex items-center justify-between px-4 py-3 text-sm">
      <span style={{ color: "var(--venue-text-muted)" }}>{time}</span>
      <span
        className="font-medium"
        style={{ color: result === "valid" ? "var(--venue-success)" : "var(--venue-accent)" }}
      >
        {result}
      </span>
      <span style={{ color: "var(--venue-text)" }}>{tier}</span>
    </li>
  );
}

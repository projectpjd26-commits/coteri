"use client";

export type TierBenefit = { benefit_label: string; description?: string | null; sort_order?: number };

export type TierLevel = {
  tier_key: string;
  tier_label: string;
  benefits: TierBenefit[];
};

const DEFAULT_TIERS: TierLevel[] = [
  {
    tier_key: "supporter",
    tier_label: "Supporter",
    benefits: [
      { benefit_label: "Member access", description: "Scan at door for entry", sort_order: 0 },
      { benefit_label: "Newsletter", description: "Venue updates and events", sort_order: 5 },
    ],
  },
  {
    tier_key: "vip",
    tier_label: "VIP",
    benefits: [
      { benefit_label: "BOGO Pint", description: "Buy one get one draft", sort_order: 10 },
      { benefit_label: "Priority Seating", description: "Get seated first when available", sort_order: 20 },
      { benefit_label: "10% off food", description: "Dine-in food discount", sort_order: 25 },
      { benefit_label: "Exclusive events", description: "Invites to member-only events", sort_order: 30 },
    ],
  },
  {
    tier_key: "founder",
    tier_label: "Founder",
    benefits: [
      { benefit_label: "BOGO Pint", description: "Buy one get one draft", sort_order: 10 },
      { benefit_label: "Priority Seating", description: "Get seated first when available", sort_order: 20 },
      { benefit_label: "Free Merch", description: "Exclusive Founder merch", sort_order: 30 },
      { benefit_label: "Exclusive events", description: "Invites to member-only events", sort_order: 35 },
      { benefit_label: "Concierge", description: "Reservation and table assistance", sort_order: 40 },
    ],
  },
];

function tierOrder(tier_key: string): number {
  const order: Record<string, number> = { supporter: 0, vip: 1, founder: 2 };
  return order[tier_key] ?? 99;
}

/**
 * Renders membership levels and rewards for a venue.
 * benefitsByTier: from venue_tier_benefits (tier_key -> benefit_label, description).
 * If not provided, uses DEFAULT_TIERS.
 */
export function TierRewardsSection({
  benefitsByTier,
  venueName,
  sectionTitle,
}: {
  benefitsByTier?: { tier_key: string; benefit_label: string; description?: string | null; sort_order?: number }[];
  venueName?: string | null;
  /** When set (e.g. "What you get when you join"), used instead of default "Levels & rewards". */
  sectionTitle?: string | null;
} = {}) {
  void venueName; // reserved for venue-scoped copy
  const tiers: TierLevel[] = (() => {
    if (!benefitsByTier?.length) return DEFAULT_TIERS;
    const map = new Map<string, TierBenefit[]>();
    for (const b of benefitsByTier) {
      const key = (b.tier_key || "").toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        benefit_label: b.benefit_label,
        description: b.description ?? undefined,
        sort_order: b.sort_order,
      });
    }
    const tierLabels: Record<string, string> = {
      supporter: "Supporter",
      vip: "VIP",
      founder: "Founder",
    };
    return ["supporter", "vip", "founder"].map((tier_key) => {
      const benefits = map.get(tier_key)?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return {
        tier_key,
        tier_label: tierLabels[tier_key] ?? tier_key,
        benefits: benefits?.length ? benefits : tier_key === "supporter" ? DEFAULT_TIERS[0].benefits : [],
      };
    });
  })();

  const sortedTiers = [...tiers].sort((a, b) => tierOrder(a.tier_key) - tierOrder(b.tier_key));

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium mb-3" style={{ color: "var(--venue-text-muted)" }}>
        {sectionTitle ?? "Levels & rewards"}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {sortedTiers.map((tier) => {
          const isFounder = tier.tier_key === "founder";
          const isVip = tier.tier_key === "vip";
          const borderClass = isFounder
            ? "border-amber-400/50"
            : isVip
              ? "border-purple-400/50"
              : "border-white/15";
          const iconPath = isFounder
            ? "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            : isVip
              ? "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              : "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
          return (
          <div
            key={tier.tier_key}
            className={`rounded-lg border overflow-hidden ${borderClass}`}
            style={{
              backgroundColor:
                isFounder
                  ? "rgba(212, 168, 83, 0.08)"
                  : isVip
                    ? "rgba(168, 85, 247, 0.08)"
                    : "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
              <span
                className="shrink-0"
                style={{ color: isFounder ? "var(--venue-accent)" : isVip ? "rgb(192, 132, 252)" : "var(--venue-text-muted)" }}
                aria-hidden
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                </svg>
              </span>
              <span
                className="text-xs font-semibold capitalize"
                style={{
                  color: isFounder ? "var(--venue-accent)" : isVip ? "rgb(192, 132, 252)" : "var(--venue-text)",
                }}
              >
                {tier.tier_label}
              </span>
            </div>
            <ul className="px-3 py-2 space-y-1">
              {tier.benefits.length === 0 ? (
                <li className="text-xs" style={{ color: "var(--venue-text-muted)" }}>
                  Member access
                </li>
              ) : (
                tier.benefits.map((b) => (
                  <li key={b.benefit_label} className="text-xs" style={{ color: "var(--venue-text)" }}>
                    {b.benefit_label}
                  </li>
                ))
              )}
            </ul>
          </div>
          );
        })}
      </div>
    </section>
  );
}

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
    benefits: [{ benefit_label: "Member access", description: "Scan at door for entry", sort_order: 0 }],
  },
  {
    tier_key: "vip",
    tier_label: "VIP",
    benefits: [
      { benefit_label: "BOGO Pint", description: "Buy one get one draft", sort_order: 10 },
      { benefit_label: "Priority Seating", description: "Get seated first when available", sort_order: 20 },
    ],
  },
  {
    tier_key: "founder",
    tier_label: "Founder",
    benefits: [
      { benefit_label: "BOGO Pint", description: "Buy one get one draft", sort_order: 10 },
      { benefit_label: "Priority Seating", description: "Get seated first when available", sort_order: 20 },
      { benefit_label: "Free Merch", description: "Exclusive Founder merch", sort_order: 30 },
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
}: {
  benefitsByTier?: { tier_key: string; benefit_label: string; description?: string | null; sort_order?: number }[];
  venueName?: string | null;
} = {}) {
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
    <section className="mt-8">
      <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "var(--venue-accent)" }}>
        What customers get
      </p>
      <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--venue-text)" }}>
        {venueName ? `Membership levels & rewards at ${venueName}` : "Membership levels & rewards"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {sortedTiers.map((tier) => (
          <div
            key={tier.tier_key}
            className="rounded-xl border border-white/10 overflow-hidden"
            style={{ backgroundColor: "var(--venue-bg-elevated)" }}
          >
            <div
              className="px-4 py-3 border-b border-white/10"
              style={{
                backgroundColor:
                  tier.tier_key === "founder" ? "rgba(212, 168, 83, 0.15)" : tier.tier_key === "vip" ? "rgba(168, 85, 247, 0.08)" : undefined,
              }}
            >
              <span
                className="text-sm font-semibold capitalize"
                style={{
                  color: tier.tier_key === "founder" ? "var(--venue-accent)" : "var(--venue-text)",
                }}
              >
                {tier.tier_label}
              </span>
            </div>
            <ul className="px-4 py-3 space-y-2">
              {tier.benefits.length === 0 ? (
                <li className="text-sm" style={{ color: "var(--venue-text-muted)" }}>
                  Member access
                </li>
              ) : (
                tier.benefits.map((b) => (
                  <li key={b.benefit_label} className="text-sm flex flex-col">
                    <span style={{ color: "var(--venue-text)" }}>{b.benefit_label}</span>
                    {b.description && (
                      <span className="text-xs mt-0.5" style={{ color: "var(--venue-text-muted)" }}>
                        {b.description}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

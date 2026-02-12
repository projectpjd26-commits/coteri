"use client";

/**
 * Decorative animated banner rows for the splash — three rows scrolling horizontally.
 * Mock venue names (no real data). Suggests the owner's venue launcher.
 */

const MOCK_VENUES = [
  { name: "The Function SF", gradient: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)" },
  { name: "The Starry Plough", gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)" },
  { name: "Pacific Greens", gradient: "linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #14b8a6 100%)" },
  { name: "La Rueda", gradient: "linear-gradient(135deg, #422006 0%, #b45309 50%, #d97706 100%)" },
  { name: "Strike Zone", gradient: "linear-gradient(135deg, #1e3a5f 0%, #0369a1 50%, #0ea5e9 100%)" },
  { name: "The Velvet Room", gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)" },
  { name: "The Hideout", gradient: "linear-gradient(135deg, #451a03 0%, #9a3412 50%, #c2410c 100%)" },
  { name: "Bar None", gradient: "linear-gradient(135deg, #1c1917 0%, #44403c 50%, #78716c 100%)" },
];

function PlaceholderCard({
  name,
  gradient,
  className = "",
}: {
  name: string;
  gradient: string;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden aspect-[3/5] w-[100px] min-h-[160px] sm:w-[120px] sm:min-h-[200px] flex-shrink-0 ${className}`}
      aria-hidden
    >
      <span
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ background: gradient }}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" />
      <span className="absolute inset-0 flex flex-col justify-end p-2 sm:p-3">
        <span className="font-semibold text-amber-400 drop-shadow-lg text-xs sm:text-sm line-clamp-2">
          {name}
        </span>
      </span>
    </div>
  );
}

export function BannerColumnsPreview() {
  return (
    <section className="w-full overflow-hidden bg-slate-100 dark:bg-slate-900/50 py-20">
      <div className="max-w-6xl mx-auto px-6 text-center mb-12">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Your venues at a glance
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
          Sign in to see your venue launcher — switch between spaces in one place.
        </p>
      </div>

      <div className="flex flex-col gap-6 md:gap-8">
        {/* Row 1 — scrolls left */}
        <div className="w-full overflow-hidden">
          <div className="flex gap-4 w-max banner-row-left">
            {MOCK_VENUES.slice(0, 4).map((v, i) => (
              <PlaceholderCard key={`r1-${i}`} name={v.name} gradient={v.gradient} />
            ))}
            {MOCK_VENUES.slice(0, 4).map((v, i) => (
              <PlaceholderCard key={`r1-dup-${i}`} name={v.name} gradient={v.gradient} />
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="w-full overflow-hidden">
          <div className="flex gap-4 w-max banner-row-right" style={{ animationDelay: "-5s" }}>
            {MOCK_VENUES.slice(2, 6).map((v, i) => (
              <PlaceholderCard key={`r2-${i}`} name={v.name} gradient={v.gradient} />
            ))}
            {MOCK_VENUES.slice(2, 6).map((v, i) => (
              <PlaceholderCard key={`r2-dup-${i}`} name={v.name} gradient={v.gradient} />
            ))}
          </div>
        </div>

        {/* Row 3 — scrolls left, different speed */}
        <div className="w-full overflow-hidden">
          <div className="flex gap-4 w-max banner-row-left-slow" style={{ animationDelay: "-12s" }}>
            {MOCK_VENUES.slice(4, 8).map((v, i) => (
              <PlaceholderCard key={`r3-${i}`} name={v.name} gradient={v.gradient} />
            ))}
            {MOCK_VENUES.slice(4, 8).map((v, i) => (
              <PlaceholderCard key={`r3-dup-${i}`} name={v.name} gradient={v.gradient} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

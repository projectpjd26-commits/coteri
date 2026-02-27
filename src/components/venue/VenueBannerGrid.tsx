"use client";

import { useMemo, useState } from "react";
import type { VenueBannerItem } from "@/lib/venue-banners";

function VenueBannerCard({
  v,
  className,
  narrow,
  href,
}: {
  v: VenueBannerItem;
  className?: string;
  narrow?: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className={
        narrow
          ? `group block relative rounded-xl overflow-hidden aspect-[3/5] w-[100px] min-h-[160px] flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${className ?? ""}`
          : `group block relative rounded-2xl overflow-hidden aspect-[3/5] min-h-[240px] sm:min-h-[280px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${className ?? ""}`
      }
    >
      <span
        className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url(${v.bannerImage})` }}
        aria-hidden
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25" aria-hidden />
      <span
        className={`absolute inset-0 flex flex-col justify-end ${narrow ? "p-2" : "p-4 sm:p-6"}`}
      >
        <span
          className={`font-semibold text-amber-400 drop-shadow-lg line-clamp-2 ${narrow ? "text-xs" : "text-lg sm:text-xl"}`}
        >
          {v.name}
        </span>
        {v.description && (
          <span
            className={`text-white/90 drop-shadow line-clamp-2 mt-0.5 ${narrow ? "text-[10px]" : "text-xs sm:text-sm"}`}
          >
            {v.description}
          </span>
        )}
      </span>
    </a>
  );
}

const defaultCardHref = (v: VenueBannerItem) =>
  `/api/set-venue?venue=${encodeURIComponent(v.slug)}&next=/dashboard`;

type Props = {
  venues: VenueBannerItem[];
  currentVenue?: VenueBannerItem | null;
  /** When set, all card links use this href (e.g. sign-in). Otherwise set-venue then dashboard per venue. Serializable for Server → Client. */
  cardHref?: string;
  /** Admin layout: all venues as large cards in a columned grid, no "Your venue" section. */
  adminLayout?: boolean;
};

export function VenueBannerGrid({ venues, currentVenue, cardHref, adminLayout }: Props) {
  const [query, setQuery] = useState("");

  const hrefFor = (v: VenueBannerItem) => (cardHref != null ? cardHref : defaultCardHref(v));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, query]);

  if (adminLayout) {
    return (
      <div className="w-full flex flex-col items-center">
        <label htmlFor="venue-search-admin" className="sr-only">
          Search venues
        </label>
        <input
          id="venue-search-admin"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues…"
          className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent mb-6"
          aria-label="Search venues"
        />
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <p className="col-span-full text-center text-slate-500 dark:text-slate-400 text-sm py-8">
              No venues match your search.
            </p>
          ) : (
            filtered.map((v) => (
              <VenueBannerCard key={v.slug} v={v} narrow={false} href={hrefFor(v)} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {currentVenue && (
        <div className="w-full mb-8">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
            Your venue
          </p>
          <div className="max-w-sm mx-auto">
            <VenueBannerCard v={currentVenue} href={hrefFor(currentVenue)} />
          </div>
        </div>
      )}

      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
        {currentVenue ? "Switch venue or browse others" : "Choose a venue"}
      </p>
      <label htmlFor="venue-search" className="sr-only">
        Search venues
      </label>
      <input
        id="venue-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search venues…"
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/80 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
        aria-label="Search venues"
      />
      <div className="mt-6 w-full flex flex-nowrap justify-center gap-3 overflow-x-auto pb-2">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-slate-500 dark:text-slate-400 text-sm py-8">
            No venues match your search.
          </p>
        ) : (
          filtered.map((v) => (
            <VenueBannerCard key={v.slug} v={v} narrow href={hrefFor(v)} />
          ))
        )}
      </div>
    </div>
  );
}

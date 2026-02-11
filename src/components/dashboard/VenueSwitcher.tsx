"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

type Venue = { slug: string; name: string };

export function VenueSwitcher({
  venues,
  currentSlug,
}: {
  venues: Venue[];
  currentSlug: string | null;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const slug = e.target.value?.trim();
      const effectiveCurrent = currentSlug ?? "";
      if (!slug || slug === effectiveCurrent) return;
      setSwitching(true);
      try {
        const res = await fetch("/api/set-venue?next=/dashboard", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ slug }),
          redirect: "manual",
        });
        if (res.type === "opaqueredirect" || res.status === 0) {
          window.location.href = "/dashboard";
          return;
        }
        const location = res.headers.get("Location");
        window.location.href = location && location.startsWith("/") ? location : "/dashboard";
      } catch {
        window.location.href = "/dashboard";
      } finally {
        setSwitching(false);
      }
    },
    [currentSlug]
  );

  if (venues.length <= 1) return null;

  return (
    <div className="mt-2">
      <label htmlFor="venue-slug" className="sr-only">
        Switch venue
      </label>
      <select
        id="venue-slug"
        className="w-full rounded border border-white/20 bg-black/30 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
        style={{ color: "var(--venue-text)" }}
        value={currentSlug ?? ""}
        onChange={handleChange}
        disabled={switching}
      >
        {venues.map((v) => (
          <option key={v.slug} value={v.slug}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";

type Venue = { slug: string; name: string };

export function VenueSwitcher({
  venues,
  currentSlug,
}: {
  venues: Venue[];
  currentSlug: string | null;
}) {
  if (venues.length <= 1) return null;

  return (
    <form
      method="post"
      action="/api/set-venue"
      className="mt-2"
      onChange={(e) => {
        const form = (e.target as unknown as HTMLSelectElement).form;
        if (form) form.submit();
      }}
    >
      <label htmlFor="venue-slug" className="sr-only">
        Switch venue
      </label>
      <select
        id="venue-slug"
        name="slug"
        className="w-full rounded border border-white/20 bg-black/30 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)]"
        style={{ color: "var(--venue-text)" }}
        defaultValue={currentSlug ?? ""}
      >
        {venues.map((v) => (
          <option key={v.slug} value={v.slug}>
            {v.name}
          </option>
        ))}
      </select>
    </form>
  );
}

"use client";

type Venue = { slug: string; name: string };

export function HomeVenueChooser({
  venues,
  currentSlug,
}: {
  venues: Venue[];
  currentSlug: string | null;
}) {
  if (venues.length === 0) return null;

  return (
    <form
      method="post"
      action="/api/set-venue"
      className="mt-0 md:mt-2 w-full max-w-[180px] md:max-w-none"
      onChange={(e) => {
        const form = (e.target as unknown as HTMLSelectElement).form;
        if (form) form.submit();
      }}
    >
      <label htmlFor="home-venue-slug" className="sr-only">
        Choose venue
      </label>
      <select
        id="home-venue-slug"
        name="slug"
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        defaultValue={currentSlug ?? (venues[0]?.slug ?? "")}
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

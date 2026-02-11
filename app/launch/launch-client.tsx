"use client";

type Venue = { slug: string; name: string };

export function LaunchClient({
  venues,
  currentSlug,
}: {
  venues: Venue[];
  currentSlug: string | null;
}) {
  if (venues.length === 0) return null;

  return (
    <form method="post" action="/api/set-venue" className="inline-block">
      <input type="hidden" name="next" value="/dashboard" />
      <label htmlFor="launch-venue" className="sr-only">
        Choose venue
      </label>
      <select
        id="launch-venue"
        name="slug"
        defaultValue={currentSlug ?? venues[0]?.slug ?? ""}
        className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-base font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent min-w-[220px]"
        onChange={(e) => {
          const target = e.target;
          const newSlug = target.value;
          if (newSlug && newSlug !== (currentSlug ?? "")) {
            target.form?.submit();
          }
        }}
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

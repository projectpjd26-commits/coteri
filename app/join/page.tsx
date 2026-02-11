import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FALLBACK_VENUES } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase-server";

export const metadata = {
  title: "Get membership — COTERI",
  description: "Get a membership at a COTERI venue to access your pass and rewards.",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const cookieStore = await cookies();
  const { venue: venueParam } = await searchParams;
  const preselectedSlug = venueParam?.trim() ?? null;

  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const nextPath = "/join" + (preselectedSlug ? `?venue=${encodeURIComponent(preselectedSlug)}` : "");
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const allowedIds = (process.env.INTERNAL_DEMO_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const canGrantSelf = allowedIds.length > 0 && allowedIds.includes(user.id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            ← Back to dashboard
          </Link>
          <span className="font-semibold text-slate-900 dark:text-slate-100">COTERI</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-6 sm:p-8 md:p-10 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-center">
          Get a membership
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-center text-sm">
          Choose a venue to join. You&apos;ll get a digital pass and can earn rewards when you visit.
        </p>

        <ul className="mt-8 w-full space-y-4">
          {FALLBACK_VENUES.map((v) => {
            const isPreselected = preselectedSlug === v.slug;
            return (
              <li
                key={v.slug}
                className={`rounded-xl border-2 p-5 ${
                  isPreselected
                    ? "border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-900/50"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30"
                }`}
              >
                <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  {v.name}
                </h2>
                {canGrantSelf ? (
                  <form
                    action={`/api/internal/demo-grant-membership?venue=${encodeURIComponent(v.slug)}&next=/dashboard`}
                    method="post"
                    className="mt-3"
                  >
                    <button
                      type="submit"
                      className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                      Grant me membership
                    </button>
                  </form>
                ) : (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    Visit the venue or contact them to get a membership. Once you&apos;re a member, you&apos;ll see your pass and QR code here.
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have a membership?{" "}
          <Link href="/dashboard" className="font-medium text-slate-700 dark:text-slate-300 hover:underline">
            Go to dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}

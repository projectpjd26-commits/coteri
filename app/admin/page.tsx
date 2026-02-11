import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export const metadata = {
  title: "Admin — COTERI",
  description: "Manage access and demo data.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; granted?: string }>;
}) {
  const { reset, granted } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in?next=/admin");
  }

  const allowedIds = (process.env.INTERNAL_DEMO_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedIds.length === 0 || !allowedIds.includes(user.id)) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            ← Dashboard
          </Link>
          <span className="font-semibold text-slate-900 dark:text-slate-100">COTERI Admin</span>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-8 md:p-10 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Manage access
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Grant membership at a venue or reset demo data (memberships + verification events for demo venues only).
        </p>

        {granted === "ok" && (
          <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
            Membership granted. Open the venue in the dashboard or go to <Link href="/join" className="font-medium underline">Get membership</Link> to grant another.
          </div>
        )}
        {reset === "ok" && (
          <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
            Demo reset completed. Memberships and verification events for demo venues have been cleared. Use &quot;Grant membership&quot; below to give access again.
          </div>
        )}

        <section className="mt-8 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30">
          <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Grant membership
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Grant yourself an active membership at a pilot venue. You can also use the <Link href="/join" className="font-medium text-slate-700 dark:text-slate-300 underline">Get membership</Link> page.
          </p>
          <div className="flex flex-wrap gap-3">
            <form action="/api/internal/demo-grant-membership?next=/admin" method="post">
              <button
                type="submit"
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Grant: The Function SF
              </button>
            </form>
            <form action="/api/internal/demo-grant-membership?venue=the-starry-plough&next=/admin" method="post">
              <button
                type="submit"
                className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Grant: The Starry Plough
              </button>
            </form>
          </div>
        </section>

        <section className="mt-6 p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10">
          <h2 className="text-sm font-medium text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-3">
            Demo reset
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Remove your demo venue memberships and verification events. Use &quot;Grant membership&quot; above to get access again.
          </p>
          <form action="/api/internal/demo-reset" method="post">
            <button
              type="submit"
              className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/30 px-4 py-2.5 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900/50"
            >
              Run demo reset
            </button>
          </form>
        </section>

        <p className="mt-8 text-xs text-slate-500 dark:text-slate-400">
          See <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">docs/CEO-MEMBERSHIP-ACCESS.md</code> for full details.
        </p>
      </main>
    </div>
  );
}

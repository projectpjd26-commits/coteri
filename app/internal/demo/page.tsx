import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FALLBACK_VENUES } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function InternalDemoPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-6 sm:p-8 md:p-10 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          COTERI
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Sign in to choose a venue and view your dashboard.
        </p>
        <p className="mt-6">
          <Link
            href="/sign-in?next=/dashboard"
            className="inline-block rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Sign in →
          </Link>
        </p>
      </div>
    );
  }

  const allowedIds = (process.env.INTERNAL_DEMO_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const canManageAccess = allowedIds.length > 0 && allowedIds.includes(user.id);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  type VenueOption = { name: string; slug: string; membershipId: string | null; venueId: string | null; appleUrl: string | null; googleUrl: string | null };
  const venueOptions: VenueOption[] = await Promise.all(
    FALLBACK_VENUES.map(async (v) => {
      const { data: venueRow } = await supabase.from("venues").select("id").eq("slug", v.slug).maybeSingle();
      const venueId = venueRow?.id ?? null;
      let membershipId: string | null = null;
      if (venueId) {
        const { data: m } = await supabase
          .from("memberships")
          .select("id")
          .eq("venue_id", venueId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        membershipId = m?.id ?? null;
      }
      const appleUrl =
        membershipId && venueId
          ? `${base}/api/wallet/apple?membership_id=${encodeURIComponent(membershipId)}&venue_id=${encodeURIComponent(venueId)}`
          : null;
      const googleUrl =
        membershipId && venueId
          ? `${base}/api/wallet/google?membership_id=${encodeURIComponent(membershipId)}&venue_id=${encodeURIComponent(venueId)}`
          : null;
      return { name: v.name, slug: v.slug, membershipId, venueId, appleUrl, googleUrl };
    })
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 sm:p-8 md:p-10">
      <div className="w-full max-w-2xl mx-auto text-center flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          COTERI
        </h1>
        <p className="mt-6 text-slate-600 dark:text-slate-400 text-sm">
          Choose a venue to open its dashboard.
        </p>
        <ul className="mt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {FALLBACK_VENUES.map((v) => (
            <li key={v.slug}>
              <a
                href={`/api/set-venue?venue=${encodeURIComponent(v.slug)}&next=/dashboard`}
                className="inline-block rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-6 py-4 text-lg font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                {v.name}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full max-w-2xl mx-auto mt-12">
        {canManageAccess && (
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/admin" className="font-medium text-slate-700 dark:text-slate-300 hover:underline">
              Admin → Manage access, grant membership, demo reset
            </Link>
          </p>
        )}
        {venueOptions.map((vo) => (
          <section key={vo.slug} className="mt-6">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Wallet passes — {vo.name}
            </h2>
            <ul className="space-y-2">
              {vo.appleUrl ? (
                <li>
                  <a
                    href={vo.appleUrl}
                    className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Apple Wallet (.pkpass)
                  </a>
                </li>
              ) : (
                <li className="text-slate-500 dark:text-slate-400 text-sm">
                  No membership at {vo.name} yet.
                </li>
              )}
              {vo.googleUrl ? (
                <li>
                  <a
                    href={vo.googleUrl}
                    className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Google Wallet (Save link)
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

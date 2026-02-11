import Link from "next/link";

/**
 * Root route: minimal static page with link to sign-in so `/` is always served.
 * Static prerender avoids serverless cold start / 404 on Vercel.
 */
export default function RootPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-neutral-950 text-neutral-100">
      <h1 className="text-2xl font-bold mb-4">COTERI</h1>
      <p className="mb-6 text-neutral-400">Membership that drives repeat traffic.</p>
      <Link
        href="/sign-in"
        className="rounded-lg bg-white text-neutral-900 px-6 py-3 font-semibold hover:bg-neutral-200 transition"
      >
        Sign in
      </Link>
    </main>
  );
}

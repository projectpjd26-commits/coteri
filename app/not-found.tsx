import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{
        background: "var(--background, #0a0a0a)",
        color: "var(--foreground, #ededed)",
      }}
    >
      <span
        className="text-xl font-semibold tracking-tight mb-6 text-[var(--foreground)]"
        aria-hidden
      >
        COTERI
      </span>
      <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm opacity-80">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
      >
        ← Back to Home
      </Link>
    </div>
  );
}

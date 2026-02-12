import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { HeroPreview } from "@/components/HeroPreview";
import { BannerColumnsPreview } from "@/components/BannerColumnsPreview";
import HeroBackground from "@/components/HeroBackground";
import { PUBLIC_LOGIN_DISABLED } from "@/lib/constants";

function HowItWorksStep({
  number,
  title,
  description,
  image,
  imageAlt,
}: {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <div className="group relative bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden text-center transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/40">
      {/* Step illustration */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" aria-hidden />
      </div>
      <div className="p-8">
        {/* Number Badge */}
        <div className="relative mx-auto mb-6 w-14 h-14 flex items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-lg font-semibold text-slate-200">
          <span className="absolute inset-0 rounded-full bg-indigo-500/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
          <span className="relative z-10">{number}</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-3">
          {title}
        </h3>
        <p className="text-slate-400 text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/launch");
  }

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-white group">
        <HeroBackground />

        {/* Grain Overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:4px_4px] z-[1]"
          aria-hidden
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight">
            COTERI
            <span className="block mt-2 bg-gradient-to-r from-white via-white to-slate-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-headline-sweep text-3xl md:text-4xl font-medium">
              The Operating System for Real-World Communities.
            </span>
          </h1>

          <p className="mt-8 text-base md:text-lg text-slate-300 font-medium">
            Own your community. Verify access. Capture revenue.
          </p>

          <p className="mt-6 text-slate-400 max-w-2xl mx-auto">
            COTERI is unified membership infrastructure for physical venues — combining payments, identity, access control, and analytics into one system.
          </p>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
            Turn your venue into a verified, recurring, data-aware membership engine.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              href="/launch"
              className="px-6 py-3 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 bg-sky-800/90 text-sky-100 border border-sky-700/80 hover:bg-sky-700/90 focus:ring-sky-500"
            >
              Launch Your Venue
            </Link>
            {!PUBLIC_LOGIN_DISABLED && (
              <Link
                href="/sign-in"
                className="px-6 py-3 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 bg-emerald-800/90 text-emerald-100 border border-emerald-700/80 hover:bg-emerald-700/90 focus:ring-emerald-500"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="relative mt-20">
            {/* Horizon Light — behind card for stage presence */}
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[1200px] h-[400px] bg-gradient-to-t from-indigo-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none"
              aria-hidden
            />
            {/* Depth shadow below dashboard — cinematic stage, anchors physically */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-16 w-[60%] h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"
              aria-hidden
            />
            {/* Foreground depth — camera depth, dashboard in front of venue world */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] bg-black/40 blur-3xl rounded-full opacity-60" />
            </div>
            <div className="relative z-10">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Replacement Layer — displacement, not explanation */}
      <section className="relative z-20 w-full bg-slate-950 border-y border-slate-800 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-white mb-6">
            Infrastructure Replacement Layer
          </h2>
          <p className="text-center text-slate-400 mb-14 max-w-2xl mx-auto">
            Legacy venue stacks are fragmented by design. COTERI replaces them with a unified membership operating layer.
          </p>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              <div className="p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Legacy Stack</div>
                <ul className="space-y-3 text-slate-400 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden />
                    Stripe
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden />
                    Spreadsheets
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden />
                    Door Lists
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden />
                    POS Notes
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" aria-hidden />
                    No Analytics
                  </li>
                </ul>
              </div>
              <div className="p-6 sm:p-8">
                <div className="text-xs font-semibold uppercase tracking-widest text-indigo-400/90 mb-4">COTERI Layer</div>
                <ul className="space-y-3 text-slate-200 text-sm font-medium">
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden />
                    Payments Engine
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden />
                    Member Graph
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden />
                    Verification Layer
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden />
                    Access Ledger
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden />
                    Venue Intelligence
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE INFRASTRUCTURE */}
      <section className="relative z-20 w-full bg-slate-950 border-b border-slate-800 py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-white mb-16">
            CORE INFRASTRUCTURE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            <div className="flex flex-col items-start gap-3">
              <span className="flex-shrink-0 text-slate-400" aria-hidden>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </span>
              <h3 className="text-lg font-medium text-white">Secure Payments</h3>
              <p className="text-slate-400 text-sm">
                Stripe-powered recurring memberships and renewals.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span className="flex-shrink-0 text-slate-400" aria-hidden>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-lg font-medium text-white">Real-Time Verification</h3>
              <p className="text-slate-400 text-sm">
                Instant identity and tier validation at the door or device.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <span className="flex-shrink-0 text-slate-400" aria-hidden>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </span>
              <h3 className="text-lg font-medium text-white">Venue-Level Analytics</h3>
              <p className="text-slate-400 text-sm">
                Revenue, member growth, engagement, and tier performance — in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <BannerColumnsPreview />

      <section className="relative bg-slate-950 text-white py-32 overflow-hidden" id="how-it-works">
        {/* Top Fade From Hero */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" aria-hidden />

        {/* Section Glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-indigo-500/5 blur-[160px] rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <h2 className="text-center text-4xl font-semibold tracking-tight mb-20">
            How It Works
          </h2>

          <div className="relative grid md:grid-cols-3 gap-12">
            {/* Vertical connector line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-slate-800" aria-hidden />

            <HowItWorksStep
              number="1"
              title="Member Purchases"
              description="A member joins or renews directly with the venue."
              image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
              imageAlt="Member purchasing or renewing membership"
            />
            <HowItWorksStep
              number="2"
              title="Access Verified"
              description="Staff verifies membership instantly at entry."
              image="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80"
              imageAlt="Verification at the door or device"
            />
            <HowItWorksStep
              number="3"
              title="Venue Gains Insight"
              description="COTERI tracks usage, tiers, and revenue automatically."
              image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80"
              imageAlt="Venue analytics and insights"
            />
          </div>
        </div>
      </section>

      {/* Deployment Surface — network topology, not ICP list */}
      <section className="relative z-20 w-full bg-slate-950 border-y border-slate-800 py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-center text-2xl md:text-3xl font-semibold tracking-tight text-white mb-6">
            Deployment Surface
          </h2>
          <p className="text-center text-slate-400 mb-14 max-w-xl mx-auto">
            COTERI deploys anywhere membership governs access.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Cultural Venues", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" },
              { label: "Performance Spaces", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
              { label: "Private Clubs", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
              { label: "Athletic Facilities", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { label: "Hospitality Groups", icon: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" },
              { label: "Multi-Location Operators", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-slate-800/30"
              >
                <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400/80 transition-colors" aria-hidden>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </span>
                <span className="text-sm font-medium text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your venues at a glance — closing CTA block */}
      <section className="relative z-20 w-full bg-slate-950 border-b border-slate-800 py-20 md:py-28">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-4">
            Your venues at a glance.
          </h2>
          <p className="text-slate-400 mb-10">
            Switch between spaces. Manage access. Track revenue.<br />
            All from one control layer.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/launch"
              className="px-6 py-3 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 bg-sky-800/90 text-sky-100 border border-sky-700/80 hover:bg-sky-700/90 focus:ring-sky-500"
            >
              Launch Your Venue
            </Link>
            {!PUBLIC_LOGIN_DISABLED && (
              <Link
                href="/sign-in?admin=1"
                className="px-6 py-3 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 bg-rose-800/90 text-rose-100 border border-rose-700/80 hover:bg-rose-700/90 focus:ring-rose-500"
              >
                Admin Sign-In
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-6 bg-slate-950">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          <span>© COTERI</span>
        </div>
      </footer>
    </>
  );
}

'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const signInHref = next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in'

  return (
    <>
      <section className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Membership that drives repeat traffic
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
          COTERI helps venues turn one-time visitors into regulars. One pass, one place to verify — for you and your members.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-in?next=/join"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Get membership
          </Link>
          <Link
            href={signInHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            Sign in
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500 dark:text-slate-400">
          © COTERI
        </div>
      </footer>
    </>
  )
}

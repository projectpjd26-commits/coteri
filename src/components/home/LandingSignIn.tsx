"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AUTH_NEXT_COOKIE } from "@/lib/constants";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

type OAuthProvider = "google" | "apple" | "facebook";

export function LandingSignInContent({
  defaultNext = "/launch",
  showHero = true,
  backHref,
}: {
  defaultNext?: string;
  showHero?: boolean;
  backHref?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [sent, setSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");
    if (error === "auth") setAuthError(message || "Sign-in failed. Try again.");
  }, [searchParams]);

  const getCallbackUrl = () =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "/auth/callback";

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const next = searchParams.get("next")?.trim() || defaultNext;
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=${60 * 10}; SameSite=Lax`;
    setOauthLoading(provider);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getCallbackUrl() },
    });
    setOauthLoading(null);
    if (error) setAuthError(error.message || "Sign-in failed. Try again.");
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const next = searchParams.get("next")?.trim() || defaultNext;
    document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=${60 * 10}; SameSite=Lax`;
    const callbackUrl = getCallbackUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl },
    });
    setLoading(false);
    if (!error) setSent(true);
    else setAuthError(error.message || "Failed to send link. Try again.");
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {backHref && (
        <p className="absolute top-6 left-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href={backHref} className="hover:underline">← Back</Link>
        </p>
      )}
      <div className="w-full max-w-md mx-auto text-center">
        <h1 className="text-xl font-semibold tracking-tight text-slate-700 dark:text-slate-300">
          COTERI
        </h1>
        {showHero && (
          <>
            <h2 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Membership that drives repeat traffic
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              COTERI helps venues turn one-time visitors into regulars. One pass, one place to verify — for you and your members.
            </p>
          </>
        )}
        {!showHero && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to continue</p>
        )}
      </div>

      <section className="w-full max-w-sm mx-auto mt-8">
        {authError && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400" role="alert">
            {authError}
          </p>
        )}
        {sent ? (
          <p className="text-center text-slate-700 dark:text-slate-300" role="status">
            Check your email for the sign-in link. It may take a minute.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => signInWithOAuth("google")}
                disabled={!!oauthLoading}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {oauthLoading === "google" ? (
                  <span className="text-slate-500">Signing in…</span>
                ) : (
                  <>
                    <GoogleIcon className="w-5 h-5" />
                    Continue with Google
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWithOAuth("apple")}
                disabled={!!oauthLoading}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {oauthLoading === "apple" ? (
                  <span className="text-slate-500">Signing in…</span>
                ) : (
                  <>
                    <AppleIcon className="w-5 h-5" />
                    Continue with Apple
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => signInWithOAuth("facebook")}
                disabled={!!oauthLoading}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {oauthLoading === "facebook" ? (
                  <span className="text-slate-500">Signing in…</span>
                ) : (
                  <>
                    <FacebookIcon className="w-5 h-5" />
                    Continue with Facebook
                  </>
                )}
              </button>
            </div>
            <p className="mt-4 mb-4 text-center text-xs text-slate-500 dark:text-slate-400">
              or continue with email
            </p>
            {loading ? (
              <p className="text-center text-slate-500 dark:text-slate-400">Sending magic link…</p>
            ) : (
              <form onSubmit={login} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="w-full min-h-[48px] px-6 py-3 rounded-xl font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                >
                  Send magic link
                </button>
              </form>
            )}
          </>
        )}
      </section>

      <footer className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
        © COTERI
      </footer>
    </main>
  );
}

export function LandingSignIn(props: { defaultNext?: string; showHero?: boolean; backHref?: string }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        </main>
      }
    >
      <LandingSignInContent {...props} />
    </Suspense>
  );
}

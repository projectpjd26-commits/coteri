import Link from "next/link";
import { LandingSignIn } from "@/components/home/LandingSignIn";
import { PUBLIC_LOGIN_DISABLED } from "@/lib/constants";

/**
 * Dedicated sign-in route (e.g. ?next=/join). Uses same OAuth + email as landing; no hero.
 * When PUBLIC_LOGIN_DISABLED: show notice and link back instead of the form.
 */
export default function SignInPage() {
  if (PUBLIC_LOGIN_DISABLED) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <p className="text-center text-slate-600 dark:text-slate-400 mb-4">
          Sign-in is temporarily disabled.
        </p>
        <Link href="/" className="text-sky-600 dark:text-sky-400 hover:underline">
          ← Back to home
        </Link>
      </main>
    );
  }
  return <LandingSignIn defaultNext="/launch" showHero={false} backHref="/" />;
}

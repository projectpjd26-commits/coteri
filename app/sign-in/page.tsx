import { LandingSignIn } from "@/components/home/LandingSignIn";

/**
 * Dedicated sign-in route (e.g. ?next=/join). Uses same OAuth + email as landing; no hero.
 */
export default function SignInPage() {
  return <LandingSignIn defaultNext="/launch" showHero={false} backHref="/" />;
}

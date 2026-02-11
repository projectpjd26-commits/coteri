import { LandingSignIn } from "@/components/home/LandingSignIn";

/**
 * Same as root: sign-in with OAuth + email, no sidebar. Signed-in users hit layout redirect to /launch.
 */
export default function HomePage() {
  return <LandingSignIn defaultNext="/launch" showHero />;
}

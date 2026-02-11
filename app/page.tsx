import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { LandingSignIn } from "@/components/home/LandingSignIn";

/** Force server render so auth check runs on Vercel. */
export const dynamic = "force-dynamic";

/**
 * Root: sign-in page (no sidebar). OAuth + email on this page.
 * If already signed in, go to launch splash.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/launch");
  }

  return <LandingSignIn defaultNext="/launch" showHero />;
}

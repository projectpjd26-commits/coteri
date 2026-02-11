import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * /home when signed in → launch splash. When not signed in, no sidebar (just children).
 */
export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/launch");
  }

  return <>{children}</>;
}

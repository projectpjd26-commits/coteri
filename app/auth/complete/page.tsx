"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCompletePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"exchanging" | "redirecting" | "error">("exchanging");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next")?.trim() || "/launch";
    const sanitizedNext = next.startsWith("/") && !next.startsWith("//") ? next : "/launch";

    if (!code) {
      setStatus("error");
      setErrorMessage("Missing authorization code.");
      return;
    }

    const run = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || "Sign-in failed.");
        return;
      }
      setStatus("redirecting");
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      window.location.href = `${origin}/api/auth/session-ready?next=${encodeURIComponent(sanitizedNext)}`;
    };

    run();
  }, [searchParams]);

  if (status === "error") {
    const message = errorMessage || "Something went wrong.";
    const signInUrl = typeof window !== "undefined"
      ? `${window.location.origin}/sign-in?error=auth&message=${encodeURIComponent(message)}`
      : "/sign-in";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-red-500">{message}</p>
        <a href={signInUrl} className="text-brand-400 underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground">
        {status === "exchanging" ? "Completing sign-in…" : "Redirecting…"}
      </p>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AUTH_NEXT_COOKIE } from "@/lib/constants";

function getNextFromCookie(): string {
  if (typeof document === "undefined") return "/launch";
  const match = document.cookie.match(new RegExp(`(?:^|; )${AUTH_NEXT_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1].trim()) : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/launch";
}

function AuthCompleteContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const nextFromUrl = searchParams.get("next")?.trim();
  const next = nextFromUrl || (typeof document !== "undefined" ? getNextFromCookie() : "/launch");
  const sanitizedNext = next.startsWith("/") && !next.startsWith("//") ? next : "/launch";

  if (!code) {
    const signInUrl = typeof window !== "undefined"
      ? `${window.location.origin}/sign-in?error=auth&message=${encodeURIComponent("Missing authorization code.")}`
      : "/sign-in";
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-center text-red-500">Missing authorization code.</p>
        <a href={signInUrl} className="text-brand-400 underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return <AuthExchange code={code} sanitizedNext={sanitizedNext} />;
}

function AuthExchange({ code, sanitizedNext }: { code: string; sanitizedNext: string }) {
  const [status, setStatus] = useState<"exchanging" | "redirecting" | "error">("exchanging");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
  }, [code, sanitizedNext]);

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

export default function AuthCompletePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <AuthCompleteContent />
    </Suspense>
  );
}

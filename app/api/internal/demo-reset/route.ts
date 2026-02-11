import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireDemoAdmin } from "@/lib/auth/require-auth";

export async function POST() {
  const authResult = await requireDemoAdmin();
  if (authResult.error) return authResult.error;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );
    const { error } = await admin.rpc("reset_demo");
    if (error) {
      console.error("reset_demo RPC error:", error.message, error.details);
      const message =
        process.env.NODE_ENV === "development"
          ? `Reset failed: ${error.message}`
          : "Reset failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/admin?reset=ok", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"), 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    console.error("Demo reset failed:", err);
    const body =
      process.env.NODE_ENV === "development"
        ? `Reset failed: ${message}`
        : "Reset failed";
    return NextResponse.json({ error: body }, { status: 500 });
  }
}

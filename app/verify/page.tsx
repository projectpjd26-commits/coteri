import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySignedPayload } from "@/lib/verify-signed-payload";
import { createServerSupabase } from "@/lib/supabase-server";
import { VerifyForm } from "./verify-form";
import { ALLOWED_VERIFY_ROLES, getVenueStaffRoleLabel } from "@/lib/constants";
import type { VenueStaffRoleValue } from "@/lib/constants";

const VERIFY_RESULT_COOKIE = "verify_result";
const VERIFY_LAST_AT_COOKIE = "verify_last_at";
const COOKIE_OPTIONS = { path: "/verify", httpOnly: true, sameSite: "lax" as const, maxAge: 60 };
const RATE_LIMIT_MS = 1000;

export type VerifyApiResult = {
  result: "VALID" | "EXPIRED" | "INVALID";
  tier: string | null;
  venue: string;
  lastVerifiedAt: string | null;
  expiresAt: string | null;
  verifiedAt: string;
  rateLimited?: boolean;
};

async function resolveMembershipResult(
  supabase: ReturnType<typeof createServerSupabase>,
  staffVenueId: string,
  membershipIdOrUserId: string,
  byUserId: boolean
): Promise<VerifyApiResult | null> {
  const venueNameRes = await supabase
    .from("venues")
    .select("name")
    .eq("id", staffVenueId)
    .maybeSingle();
  const venueName = (venueNameRes.data as { name?: string } | null)?.name ?? "—";

  if (byUserId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id, tier, status, expires_at")
      .eq("user_id", membershipIdOrUserId)
      .eq("venue_id", staffVenueId)
      .maybeSingle();
    if (!membership) {
      return {
        result: "INVALID",
        tier: null,
        venue: venueName,
        lastVerifiedAt: null,
        expiresAt: null,
        verifiedAt: new Date().toISOString(),
      };
    }
    const status = (membership as { status?: string }).status ?? "";
    const expiresAt = (membership as { expires_at?: string | null }).expires_at ?? null;
    const now = Date.now();
    const expiredAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
    const isExpired =
      status === "expired" || (expiredAtMs !== null && expiredAtMs <= now);

    if (isExpired) {
      const { data: lastRow } = await supabase
        .from("verification_events")
        .select("occurred_at")
        .eq("membership_id", membership.id)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastVerifiedAt = (lastRow as { occurred_at?: string } | null)?.occurred_at ?? null;
      return {
        result: "EXPIRED",
        tier: (membership as { tier?: string }).tier ?? null,
        venue: venueName,
        lastVerifiedAt,
        expiresAt,
        verifiedAt: new Date().toISOString(),
      };
    }
    const { data: lastRow } = await supabase
      .from("verification_events")
      .select("occurred_at")
      .eq("membership_id", membership.id)
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastVerifiedAt = (lastRow as { occurred_at?: string } | null)?.occurred_at ?? null;
    return {
      result: "VALID",
      tier: (membership as { tier?: string }).tier ?? null,
      venue: venueName,
      lastVerifiedAt,
      expiresAt,
      verifiedAt: new Date().toISOString(),
    };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, tier, status, expires_at")
    .eq("id", membershipIdOrUserId)
    .eq("venue_id", staffVenueId)
    .maybeSingle();

  if (!membership) {
    return {
      result: "INVALID",
      tier: null,
      venue: venueName,
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
  }

  const status = (membership as { status?: string }).status ?? "";
  const expiresAt = (membership as { expires_at?: string | null }).expires_at ?? null;
  const now = Date.now();
  const expiredAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
  const isExpired =
    status === "expired" || (expiredAtMs !== null && expiredAtMs <= now);

  const { data: lastRow } = await supabase
    .from("verification_events")
    .select("occurred_at")
    .eq("membership_id", membership.id)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastVerifiedAt = (lastRow as { occurred_at?: string } | null)?.occurred_at ?? null;

  if (isExpired) {
    return {
      result: "EXPIRED",
      tier: (membership as { tier?: string }).tier ?? null,
      venue: venueName,
      lastVerifiedAt,
      expiresAt,
      verifiedAt: new Date().toISOString(),
    };
  }
  return {
    result: "VALID",
    tier: (membership as { tier?: string }).tier ?? null,
    venue: venueName,
    lastVerifiedAt,
    expiresAt,
    verifiedAt: new Date().toISOString(),
  };
}

export async function verifyMembershipAction(
  _prev: VerifyApiResult | null,
  formData: FormData
): Promise<VerifyApiResult> {
  "use server";

  const cookieStore = await cookies();
  const payload = formData.get("payload");
  const rawPayload = typeof payload === "string" ? payload : "";
  const now = Date.now();
  const lastAtRaw = cookieStore.get(VERIFY_LAST_AT_COOKIE)?.value;
  const lastAt = lastAtRaw ? parseInt(lastAtRaw, 10) : 0;
  const prevResultRaw = cookieStore.get(VERIFY_RESULT_COOKIE)?.value;

  if (rawPayload && now - lastAt < RATE_LIMIT_MS && prevResultRaw) {
    try {
      const prev = JSON.parse(prevResultRaw) as VerifyApiResult;
      return { ...prev, rateLimited: true };
    } catch {
      // fall through
    }
  }

  cookieStore.set(VERIFY_LAST_AT_COOKIE, String(now), COOKIE_OPTIONS);
  cookieStore.set(VERIFY_RESULT_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });

  const supabase = createServerSupabase(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    const out: VerifyApiResult = {
      result: "INVALID",
      tier: null,
      venue: "—",
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
    return out;
  }

  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("venue_id, role")
    .eq("user_id", session.user.id)
    .limit(1);
  const staffRecord = staffRows?.[0] ?? null;
  if (
    !staffRecord?.venue_id ||
    !staffRecord.role ||
    !ALLOWED_VERIFY_ROLES.includes(staffRecord.role as VenueStaffRoleValue)
  ) {
    const out: VerifyApiResult = {
      result: "INVALID",
      tier: null,
      venue: "—",
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
    return out;
  }

  let extracted: string | null = null;
  let byUserId = false;
  if (rawPayload.startsWith("v2:")) {
    const parsed = verifySignedPayload(rawPayload);
    if (!parsed || parsed.venueId !== staffRecord.venue_id) {
      const out: VerifyApiResult = {
        result: "INVALID",
        tier: null,
        venue: "—",
        lastVerifiedAt: null,
        expiresAt: null,
        verifiedAt: new Date().toISOString(),
      };
      cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
      return out;
    }
    extracted = parsed.membershipId;
  } else if (rawPayload.startsWith("membership:")) {
    extracted = rawPayload.slice("membership:".length).trim();
  } else {
    const out: VerifyApiResult = {
      result: "INVALID",
      tier: null,
      venue: "—",
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
    return out;
  }

  if (!extracted) {
    const out: VerifyApiResult = {
      result: "INVALID",
      tier: null,
      venue: "—",
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
    return out;
  }

  // Form payload is always membership id (from v2: or membership:uuid); URL user_id is handled in page.
  byUserId = false;

  const apiResult = await resolveMembershipResult(
    supabase,
    staffRecord.venue_id,
    extracted,
    byUserId
  );
  if (!apiResult) {
    const out: VerifyApiResult = {
      result: "INVALID",
      tier: null,
      venue: "—",
      lastVerifiedAt: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(out), COOKIE_OPTIONS);
    return out;
  }

  const auditResult =
    apiResult.result === "VALID" ? "valid" : apiResult.result === "EXPIRED" ? "expired" : "invalid";
  const membershipId = apiResult.result !== "INVALID" ? extracted : null;

  let flagReason: string | null = null;
  let flagScore: number | null = null;
  try {
    const since = new Date(Date.now() - 120 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("verification_events")
      .select("occurred_at, result")
      .eq("staff_user_id", session.user.id)
      .eq("venue_id", staffRecord.venue_id)
      .gte("occurred_at", since);
    const events = recent ?? [];
    const nowMs = Date.now();
    const burstWindowMs = 60 * 1000;
    const inBurstWindow = events.filter(
      (e: { occurred_at: string }) => new Date(e.occurred_at).getTime() >= nowMs - burstWindowMs
    );
    const invalidInWindow = events.filter((e: { result: string }) => e.result === "invalid" || e.result === "expired");
    if (inBurstWindow.length >= 10) {
      flagReason = "burst_attempts";
      flagScore = 60;
    }
    if (invalidInWindow.length >= 5 && (flagScore === null || 70 > flagScore)) {
      flagReason = "repeated_invalids";
      flagScore = 70;
    }
  } catch {
    // ignore
  }

  try {
    await supabase.from("verification_events").insert({
      staff_user_id: session.user.id,
      venue_id: staffRecord.venue_id,
      membership_id: membershipId,
      result: auditResult,
      raw_payload: rawPayload,
      ...(flagReason != null && flagScore != null ? { flag_reason: flagReason, flag_score: flagScore } : {}),
    });
  } catch {
    // audit must not affect UX
  }

  cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(apiResult), COOKIE_OPTIONS);
  return apiResult;
}

function parseResultCookie(value: string | undefined): VerifyApiResult | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as VerifyApiResult;
    if (parsed.result && parsed.venue !== undefined) return parsed;
  } catch {
    // ignore
  }
  return null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ user_id?: string }> | { user_id?: string };
}) {
  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("id, role, venue_id, venues(name)")
    .eq("user_id", user.id)
    .limit(1);
  const staffRecord = staffRows?.[0] ?? null;

  if (
    !staffRecord ||
    !staffRecord.role ||
    !ALLOWED_VERIFY_ROLES.includes(staffRecord.role as VenueStaffRoleValue)
  ) {
    redirect("/");
  }

  const rawParams = await Promise.resolve(searchParams);
  const userIdParam = typeof rawParams.user_id === "string" ? rawParams.user_id.trim() : "";
  let result: VerifyApiResult | null = parseResultCookie(cookieStore.get(VERIFY_RESULT_COOKIE)?.value);

  if (userIdParam && UUID_REGEX.test(userIdParam)) {
    const apiResult = await resolveMembershipResult(
      supabase,
      staffRecord.venue_id,
      userIdParam,
      true
    );
    result = apiResult ?? result;
  }

  const venueName =
    staffRecord.venues &&
    typeof staffRecord.venues === "object" &&
    "name" in staffRecord.venues
      ? (staffRecord.venues as { name: string }).name
      : "—";

  return (
    <div className="flex flex-col min-h-screen" style={{ minHeight: "100dvh" }}>
      <VerifyForm
        initialResult={result}
        venueName={venueName}
        staffRole={getVenueStaffRoleLabel(staffRecord.role)}
        verifyAction={verifyMembershipAction}
      />
    </div>
  );
}

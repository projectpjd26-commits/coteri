import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySignedPayload } from "@/lib/verify-signed-payload";
import { createServerSupabase } from "@/lib/supabase-server";

const VERIFY_RESULT_COOKIE = "verify_result";
const COOKIE_OPTIONS = { path: "/verify", httpOnly: true, sameSite: "lax" as const, maxAge: 60 };

type VerifyResult =
  | { status: "valid"; tier: string; membershipId: string }
  | { status: "invalid" };

async function verifyMembershipAction(formData: FormData): Promise<VerifyResult> {
  "use server";

  const cookieStore = await cookies();
  cookieStore.set(VERIFY_RESULT_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });

  const payload = formData.get("payload");
  const rawPayload = typeof payload === "string" ? payload : "";
  if (typeof payload !== "string") {
    const result: VerifyResult = { status: "invalid" };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
    return result;
  }

  const supabase = createServerSupabase(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    const result: VerifyResult = { status: "invalid" };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
    return result;
  }

  const ALLOWED_VERIFY_ROLES = ["staff", "manager", "owner"] as const;
  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("venue_id, role")
    .eq("user_id", session.user.id)
    .limit(1);
  const staffRecord = staffRows?.[0] ?? null;
  if (
    !staffRecord?.venue_id ||
    !staffRecord.role ||
    !ALLOWED_VERIFY_ROLES.includes(staffRecord.role as (typeof ALLOWED_VERIFY_ROLES)[number])
  ) {
    const result: VerifyResult = { status: "invalid" };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
    return result;
  }

  let extracted: string;
  if (rawPayload.startsWith("v2:")) {
    const parsed = verifySignedPayload(rawPayload);
    if (
      !parsed ||
      parsed.venueId !== staffRecord.venue_id
    ) {
      const result: VerifyResult = { status: "invalid" };
      cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
      return result;
    }
    extracted = parsed.membershipId;
  } else if (rawPayload.startsWith("membership:")) {
    extracted = rawPayload.slice("membership:".length).trim();
  } else {
    const result: VerifyResult = { status: "invalid" };
    cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
    return result;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, tier")
    .eq("id", extracted)
    .eq("venue_id", staffRecord.venue_id)
    .eq("status", "active")
    .maybeSingle();

  const result: VerifyResult = membership
    ? { status: "valid", tier: membership.tier ?? "Member", membershipId: membership.id }
    : { status: "invalid" };

  let flagReason: string | null = null;
  let flagScore: number | null = null;
  try {
    const windowSec = 120;
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
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
      (e) => new Date(e.occurred_at).getTime() >= nowMs - burstWindowMs
    );
    const invalidInWindow = events.filter((e) => e.result === "invalid");
    const BURST_THRESHOLD = 10;
    const INVALID_THRESHOLD = 5;
    if (inBurstWindow.length >= BURST_THRESHOLD) {
      flagReason = "burst_attempts";
      flagScore = 60;
    }
    if (invalidInWindow.length >= INVALID_THRESHOLD) {
      if (flagScore === null || 70 > flagScore) {
        flagReason = "repeated_invalids";
        flagScore = 70;
      }
    }
  } catch {
    // Heuristics advisory only; skip on failure.
  }

  try {
    await supabase.from("verification_events").insert({
      staff_user_id: session.user.id,
      venue_id: staffRecord.venue_id,
      membership_id: membership?.id ?? null,
      result: result.status,
      raw_payload: rawPayload,
      ...(flagReason != null && flagScore != null
        ? { flag_reason: flagReason, flag_score: flagScore }
        : {}),
    });
  } catch {
    // Audit insert must not affect UX; ignore failures.
  }

  cookieStore.set(VERIFY_RESULT_COOKIE, JSON.stringify(result), COOKIE_OPTIONS);
  return result;
}

function parseResultCookie(value: string | undefined): VerifyResult | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as VerifyResult;
    if (parsed.status === "valid" && "tier" in parsed && "membershipId" in parsed)
      return parsed;
    if (parsed.status === "invalid") return parsed;
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

  const ALLOWED_VERIFY_ROLES = ["staff", "manager", "owner"] as const;
  const { data: staffRows } = await supabase
    .from("venue_staff")
    .select("id, role, venue_id, venues(name)")
    .eq("user_id", user.id)
    .limit(1);
  const staffRecord = staffRows?.[0] ?? null;

  if (
    !staffRecord ||
    !staffRecord.role ||
    !ALLOWED_VERIFY_ROLES.includes(staffRecord.role as (typeof ALLOWED_VERIFY_ROLES)[number])
  ) {
    redirect("/");
  }

  // When staff scans the dashboard QR they land on /verify?user_id=... — resolve and show result (no cookie set during render)
  const rawParams = await Promise.resolve(searchParams);
  const userIdParam = typeof rawParams.user_id === "string" ? rawParams.user_id.trim() : "";
  let result: VerifyResult | null = parseResultCookie(cookieStore.get(VERIFY_RESULT_COOKIE)?.value);
  if (userIdParam && UUID_REGEX.test(userIdParam)) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id, tier")
      .eq("user_id", userIdParam)
      .eq("venue_id", staffRecord.venue_id)
      .eq("status", "active")
      .maybeSingle();
    result = membership
      ? { status: "valid", tier: membership.tier ?? "Member", membershipId: membership.id }
      : { status: "invalid" };
  }

  const venueName =
    staffRecord.venues &&
    typeof staffRecord.venues === "object" &&
    "name" in staffRecord.venues
      ? (staffRecord.venues as { name: string }).name
      : "—";

  return (
    <main style={{ padding: 40 }}>
      <h1>Member Verification</h1>

      <p>
        Venue: <strong>{venueName}</strong>
      </p>

      <p>
        Role: <strong>{staffRecord.role}</strong>
      </p>

      <hr />

      <p>This device is authorized to verify memberships.</p>

      <form action={(formData: FormData) => verifyMembershipAction(formData).then(() => {})}>
        <input
          type="text"
          name="payload"
          placeholder="membership:<uuid>"
          style={{ marginRight: 8, padding: 6, minWidth: 320 }}
        />
        <button type="submit">Verify Membership</button>
      </form>

      {result?.status === "valid" && (
        <p style={{ marginTop: 16, color: "green", fontWeight: 600 }}>
          VALID MEMBER
          <br />
          <span style={{ fontWeight: 400 }}>Tier: {result.tier}</span>
          <br />
          <span style={{ fontWeight: 400 }}>Membership ID: {result.membershipId}</span>
        </p>
      )}
      {result?.status === "invalid" && (
        <p style={{ marginTop: 16, color: "crimson", fontWeight: 600 }}>
          INVALID OR EXPIRED MEMBERSHIP
        </p>
      )}
    </main>
  );
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";
import { PKPass } from "passkit-generator";
import { requireAuth } from "@/lib/auth/require-auth";
import { signWalletPayload } from "@/lib/sign-wallet-payload";
import { createServerSupabase } from "@/lib/supabase-server";

const TEMPLATE_PATH = path.join(process.cwd(), "src/assets/wallet-apple-template");

const HEX_COLOR = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;

function normalizeHex(color: string | null | undefined): string | undefined {
  if (!color || typeof color !== "string") return undefined;
  const trimmed = color.trim();
  const m = trimmed.match(HEX_COLOR);
  if (!m) return undefined;
  const hex = m[1];
  if (hex.length === 3) return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  return `#${hex}`;
}

function contrastTextColor(hex: string): string {
  const h = hex.replace(/^#/, "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  return l > 0.5 ? "#1a1a1a" : "#ffffff";
}

async function fetchLogoBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 2 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

function getAppleWalletConfig() {
  const signerCert = process.env.APPLE_SIGNER_CERT;
  const signerKey = process.env.APPLE_SIGNER_KEY;
  const wwdr = process.env.APPLE_WWDR_CERT;
  const passTypeId = process.env.APPLE_PASS_TYPE_ID;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!signerCert || !signerKey || !wwdr || !passTypeId || !teamId) {
    return null;
  }

  const toContent = (v: string) =>
    v.includes("-----BEGIN") ? v.replace(/\\n/g, "\n") : Buffer.from(v, "base64").toString("utf8");

  return {
    signerCert: toContent(signerCert),
    signerKey: toContent(signerKey),
    signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE ?? undefined,
    wwdr: toContent(wwdr),
    passTypeId,
    teamId,
    orgName: process.env.APPLE_ORG_NAME ?? "Membership",
  };
}

function tierLabel(tier: string): string {
  const t = (tier || "").toLowerCase();
  if (t === "founder") return "Founder";
  if (t === "vip") return "VIP";
  return "Supporter";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const membershipId = searchParams.get("membership_id");
  const venueId = searchParams.get("venue_id");

  if (!membershipId || !venueId) {
    return NextResponse.json(
      { error: "membership_id and venue_id are required" },
      { status: 400 }
    );
  }

  const config = getAppleWalletConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Apple Wallet is not configured" },
      { status: 501 }
    );
  }

  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { user } = authResult.data!;

  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore, true);

  const { data: membership } = await supabase
    .from("memberships")
    .select("id, venue_id, tier")
    .eq("id", membershipId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!membership || membership.venue_id !== venueId) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  let venue: { name: string; is_demo?: boolean; brand_primary_color?: string | null; brand_logo_url?: string | null } | null = null;
  try {
    const { data } = await supabase
      .from("venues")
      .select("name, is_demo, brand_primary_color, brand_logo_url")
      .eq("id", venueId)
      .maybeSingle();
    venue = data ?? null;
  } catch {
    // proceed with defaults
  }

  const venueName = venue?.name ?? "Venue";
  const isDemo = venue?.is_demo === true;
  const primaryHex = normalizeHex(venue?.brand_primary_color);
  const foregroundColor = primaryHex ? contrastTextColor(primaryHex) : undefined;
  const labelColor = foregroundColor;

  const overridableProps: Record<string, unknown> = {
    passTypeIdentifier: config.passTypeId,
    teamIdentifier: config.teamId,
    organizationName: venueName,
    serialNumber: membershipId,
    description: isDemo ? "Member access · Powered by COTERI" : "Membership pass",
  };
  if (isDemo && venueName === "The Function SF") {
    try {
      overridableProps.logoText = "Private Access · San Francisco";
    } catch {
      // keep default
    }
  }
  if (primaryHex) {
    overridableProps.backgroundColor = primaryHex;
    if (foregroundColor) overridableProps.foregroundColor = foregroundColor;
    if (labelColor) overridableProps.labelColor = labelColor;
  }

  let pass: PKPass;

  try {
    pass = await PKPass.from(
      {
        model: TEMPLATE_PATH,
        certificates: {
          wwdr: config.wwdr,
          signerCert: config.signerCert,
          signerKey: config.signerKey,
          signerKeyPassphrase: config.signerKeyPassphrase,
        },
      },
      overridableProps
    );

    pass.primaryFields.push({ key: "venue", label: "Venue", value: venueName });
    pass.secondaryFields.push({
      key: "tier",
      label: "Tier",
      value: tierLabel(membership.tier ?? "supporter"),
    });

    if (isDemo) {
      try {
        pass.auxiliaryFields.push(
          { key: "membership_tier", label: "Membership Tier", value: tierLabel(membership.tier ?? "supporter") },
          { key: "venue_aux", label: "Venue", value: venueName }
        );
      } catch {
        // keep pass as-is
      }
    }

    pass.setExpirationDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    const qrPayload = signWalletPayload({ membershipId, venueId });
    pass.setBarcodes(qrPayload);

    if (venue?.brand_logo_url) {
      try {
        const logoBuf = await fetchLogoBuffer(venue.brand_logo_url);
        if (logoBuf && logoBuf.length > 0) {
          pass.addBuffer("logo.png", logoBuf);
          pass.addBuffer("logo@2x.png", logoBuf);
        }
      } catch {
        // keep template logo
      }
    }
  } catch (err) {
    console.error("Apple Wallet pass generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate pass" },
      { status: 500 }
    );
  }

  const buffer = pass.getAsBuffer();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="membership-${membershipId}.pkpass"`,
    },
  });
}

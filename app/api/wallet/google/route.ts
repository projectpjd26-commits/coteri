import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { requireAuth } from "@/lib/auth/require-auth";
import { signWalletPayload } from "@/lib/sign-wallet-payload";
import { createServerSupabase } from "@/lib/supabase-server";

function getGoogleWalletConfig() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const serviceAccountJson = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT;

  if (!issuerId || !serviceAccountJson) {
    return null;
  }

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(serviceAccountJson) as { client_email: string; private_key: string };
    if (!credentials.client_email || !credentials.private_key) return null;
  } catch {
    return null;
  }

  return { issuerId, credentials };
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

  const config = getGoogleWalletConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Google Wallet is not configured" },
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

  let venueName = "Membership";
  let isDemo = false;
  let brandPrimaryColor: string | undefined;
  let brandLogoUrl: string | undefined;
  try {
    const { data: venue } = await supabase
      .from("venues")
      .select("name, is_demo, brand_primary_color, brand_logo_url")
      .eq("id", venueId)
      .maybeSingle();
    if (venue?.name) venueName = venue.name;
    if (venue?.is_demo === true) isDemo = true;
    if (venue?.brand_primary_color?.trim()) brandPrimaryColor = venue.brand_primary_color.trim();
    if (venue?.brand_logo_url?.trim()) brandLogoUrl = venue.brand_logo_url.trim();
  } catch {
    // keep defaults
  }

  const tierLabel = (t: string) => {
    const lower = (t || "").toLowerCase();
    if (lower === "founder") return "Founder";
    if (lower === "vip") return "VIP";
    return "Supporter";
  };

  const qrPayload = signWalletPayload({ membershipId, venueId });

  const classId = `${config.issuerId}.membership`;
  const objectId = `${config.issuerId}.${membershipId.replace(/-/g, "_")}`;

  const genericClass: { id: string; hexBackgroundColor?: string; logo?: { sourceUri: { uri: string } } } = {
    id: classId,
  };
  try {
    if (brandPrimaryColor && /^#([a-fA-F0-9]{3}){1,2}$/.test(brandPrimaryColor)) {
      genericClass.hexBackgroundColor = brandPrimaryColor.length === 4
        ? `#${brandPrimaryColor[1]}${brandPrimaryColor[1]}${brandPrimaryColor[2]}${brandPrimaryColor[2]}${brandPrimaryColor[3]}${brandPrimaryColor[3]}`
        : brandPrimaryColor;
    }
    if (brandLogoUrl) {
      genericClass.logo = { sourceUri: { uri: brandLogoUrl } };
    }
  } catch {
    // omit branding only
  }

  const genericObject: {
    id: string;
    classId: string;
    state: string;
    barcode: { type: string; value: string; alternateText: string };
    cardTitle: { defaultValue: { language: string; value: string } };
    header: { defaultValue: { language: string; value: string } };
    subheader?: { defaultValue: { language: string; value: string } };
    textModulesData?: { header: string; body: string; id?: string }[];
  } = {
    id: objectId,
    classId,
    state: "ACTIVE",
    barcode: {
      type: "QR_CODE",
      value: qrPayload,
      alternateText: venueName,
    },
    cardTitle: {
      defaultValue: { language: "en-US", value: isDemo ? `${venueName} — Membership` : venueName },
    },
    header: {
      defaultValue: { language: "en-US", value: `${venueName} — Membership` },
    },
  };

  if (isDemo) {
    try {
      genericObject.subheader = { defaultValue: { language: "en-US", value: "Powered by COTERI" } };
      genericObject.textModulesData = [
        { id: "tier", header: "Tier", body: tierLabel(membership.tier ?? "supporter") },
        { id: "status", header: "Status", body: "Active" },
      ];
    } catch {
      // omit demo-only fields
    }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const originHost = new URL(origin).hostname;

  const claims = {
    iss: config.credentials.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    origins: [originHost],
    payload: {
      genericClasses: [genericClass],
      genericObjects: [genericObject],
    },
  };

  let token: string;
  try {
    token = jwt.sign(claims, config.credentials.private_key, { algorithm: "RS256" });
  } catch (err) {
    console.error("Google Wallet JWT signing failed:", err);
    return NextResponse.json(
      { error: "Failed to generate Save to Wallet link" },
      { status: 500 }
    );
  }

  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  const format = searchParams.get("format");
  if (format === "json") {
    return NextResponse.json({ url: saveUrl });
  }

  return NextResponse.redirect(saveUrl);
}

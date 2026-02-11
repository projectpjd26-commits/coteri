import { createHmac, timingSafeEqual } from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function base64urlDecodeToBuffer(input: string): Buffer | null {
  try {
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    return Buffer.from(base64, "base64");
  } catch {
    return null;
  }
}

/**
 * Verifies a v2 signed QR payload. Server-only. Never throws.
 * Returns { membershipId, venueId } if valid, null on any failure.
 */
export function verifySignedPayload(
  payload: string
): { membershipId: string; venueId: string } | null {
  try {
    const secret = process.env.QR_SIGNING_SECRET;
    if (!secret || typeof secret !== "string") return null;

    if (!payload.startsWith("v2:") || payload.length < 10) return null;

    const afterPrefix = payload.slice(3);
    const dotIdx = afterPrefix.indexOf(".");
    if (dotIdx <= 0 || dotIdx === afterPrefix.length - 1) return null;

    const encodedJson = afterPrefix.slice(0, dotIdx);
    const encodedSig = afterPrefix.slice(dotIdx + 1);

    const sigBuffer = base64urlDecodeToBuffer(encodedSig);
    if (!sigBuffer || sigBuffer.length !== 32) return null;

    const expectedSig = createHmac("sha256", secret)
      .update(encodedJson, "utf8")
      .digest();
    if (expectedSig.length !== sigBuffer.length || !timingSafeEqual(expectedSig, sigBuffer))
      return null;

    const jsonBuffer = base64urlDecodeToBuffer(encodedJson);
    if (!jsonBuffer) return null;

    const raw = jsonBuffer.toString("utf8");
    const data = JSON.parse(raw) as unknown;

    if (
      !data ||
      typeof data !== "object" ||
      typeof (data as { membership_id?: unknown }).membership_id !== "string" ||
      typeof (data as { venue_id?: unknown }).venue_id !== "string" ||
      typeof (data as { expires_at?: unknown }).expires_at !== "number"
    )
      return null;

    const membershipId = (data as { membership_id: string }).membership_id.trim();
    const venueId = (data as { venue_id: string }).venue_id.trim();

    if (!UUID_REGEX.test(membershipId) || !UUID_REGEX.test(venueId)) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if ((data as { expires_at: number }).expires_at <= nowSec) return null;

    return { membershipId, venueId };
  } catch {
    return null;
  }
}

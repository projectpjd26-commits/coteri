import { createHmac } from "crypto";

const FOURTEEN_DAYS_SEC = 14 * 24 * 60 * 60;

function base64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Signs a v2 wallet payload for QR embedding. Server-only.
 * Returns v2:<b64url(json)>.<b64url(sig)> with 14-day expiry.
 * Matches format expected by verifySignedPayload.
 */
export function signWalletPayload(args: {
  membershipId: string;
  venueId: string;
}): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || typeof secret !== "string") {
    throw new Error("QR_SIGNING_SECRET is not configured");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = nowSec + FOURTEEN_DAYS_SEC;

  const payload = {
    membership_id: args.membershipId,
    venue_id: args.venueId,
    issued_at: nowSec,
    expires_at: expiresAt,
  };

  const json = JSON.stringify(payload);
  const encodedJson = base64urlEncode(Buffer.from(json, "utf8"));

  const sig = createHmac("sha256", secret)
    .update(encodedJson, "utf8")
    .digest();
  const encodedSig = base64urlEncode(sig);

  return `v2:${encodedJson}.${encodedSig}`;
}

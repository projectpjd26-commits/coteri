"use client";

import { MockQRCode } from "@/components/demo/MockQRCode";
import { WalletPassMockup } from "@/components/demo/WalletPassMockup";

type Props = { venueName: string; tierName?: string; venueSlug?: string | null; isActive?: boolean };

/** Left panel: one mock QR for the selected venue. Parent controls visibility/size. */
export function MembershipViewMockupsLeft({ venueName }: Props) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center w-full max-w-[180px]">
      <MockQRCode venueName={venueName} size={112} />
    </div>
  );
}

/** Right panel: one wallet card (venue-themed), caption for Apple/Google. Reflects active vs no membership. */
export function MembershipViewMockupsRight({
  venueName,
  tierName = "Member",
  venueSlug = "the-function-sf",
  isActive = true,
}: Props) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center w-full max-w-[300px]">
      <WalletPassMockup
        venueName={venueName}
        tierName={tierName}
        venueSlug={venueSlug ?? "the-function-sf"}
        showActiveInScanArea={isActive}
        active={isActive}
      />
      <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-white/50">
        Apple / Google Wallet mockup
      </p>
    </div>
  );
}

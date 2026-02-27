"use client";

import { useActionState } from "react";
import { VENUE_STAFF_ROLES, type VenueStaffRoleValue } from "@/lib/constants";

type Props = {
  venueName: string;
  currentRole: string;
  venueId: string;
  updateRoleAction: (prev: { ok: boolean; message: string } | null, formData: FormData) => Promise<{ ok: boolean; message: string } | null>;
};

export function VenuePositionForm({ venueName, currentRole, venueId, updateRoleAction }: Props) {
  const [state, formAction, isPending] = useActionState(updateRoleAction, null);
  const validRoles = VENUE_STAFF_ROLES.map((r) => r.value);

  return (
    <section
      className="rounded-lg border border-white/10 overflow-hidden mb-6"
      style={{ backgroundColor: "var(--venue-bg-elevated)" }}
    >
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="font-medium" style={{ color: "var(--venue-text)" }}>
          Venue position
        </h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--venue-text-muted)" }}>
          Your role at <span className="font-medium">{venueName}</span>. This appears on the verify screen and in your profile.
        </p>
      </div>
      <form action={formAction} className="p-4 space-y-3">
        <input type="hidden" name="venue_id" value={venueId} />
        <div>
          <label htmlFor="venue-position-role" className="block text-sm font-medium mb-1" style={{ color: "var(--venue-text-muted)" }}>
            Position
          </label>
          <select
            id="venue-position-role"
            name="role"
            defaultValue={validRoles.includes(currentRole as VenueStaffRoleValue) ? currentRole : "staff"}
            disabled={isPending}
            className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] disabled:opacity-60"
            style={{ color: "var(--venue-text)" }}
            aria-describedby={state?.message ? "position-message" : undefined}
          >
            {VENUE_STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {state?.message && (
          <p id="position-message" role="status" className="text-sm" style={{ color: state.ok ? "var(--venue-accent)" : "var(--venue-text-muted)" }}>
            {state.message}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] disabled:opacity-50"
          style={{ backgroundColor: "var(--venue-accent)", color: "#0f0f0f" }}
        >
          {isPending ? "Saving…" : "Save position"}
        </button>
      </form>
    </section>
  );
}

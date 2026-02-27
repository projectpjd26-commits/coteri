"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashboardNavProps = {
  effectiveSlug: string | null;
  hasStaffRows: boolean;
  isAdmin: boolean;
};

function NavLink({
  href,
  children,
  label,
}: {
  href: string;
  children: React.ReactNode;
  label?: string;
}) {
  const pathname = usePathname();
  const pathBase = href.split("?")[0];
  const active =
    pathBase === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === pathBase || pathname.startsWith(pathBase + "/");

  return (
    <Link
      href={href}
      className="px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] hover:bg-white/5"
      style={{
        color: active ? "var(--venue-text)" : "var(--venue-text-muted)",
      }}
      aria-current={active ? "page" : undefined}
      aria-label={label}
    >
      {children}
    </Link>
  );
}

export function DashboardNav({
  effectiveSlug,
  hasStaffRows,
  isAdmin,
}: DashboardNavProps) {
  const venueIntelligenceHref = effectiveSlug
    ? `/dashboard/venue/metrics?venue=${encodeURIComponent(effectiveSlug)}`
    : "/dashboard/venue/metrics";

  return (
    <nav className="flex md:flex-col gap-1 ml-auto md:ml-0 text-sm" aria-label="Dashboard">
      <NavLink href="/launch" label="All Venues">
        ← All Venues
      </NavLink>
      <NavLink href="/dashboard" label="Dashboard">
        Dashboard
      </NavLink>
      <NavLink href="/dashboard/settings" label="Settings">
        Settings
      </NavLink>
      <NavLink
        href={effectiveSlug ? `/membership?venue=${encodeURIComponent(effectiveSlug)}` : "/membership"}
        label="Pass and QR"
      >
        Pass & QR
      </NavLink>
      {hasStaffRows && (
        <NavLink
          href={effectiveSlug ? `/verify?venue=${encodeURIComponent(effectiveSlug)}` : "/verify"}
          label="Verify at door"
        >
          Verify
        </NavLink>
      )}
      {(hasStaffRows || isAdmin) && (
        <NavLink href={venueIntelligenceHref} label="Venue Intelligence">
          Venue Intelligence
        </NavLink>
      )}
      {isAdmin && (
        <NavLink href="/admin" label="Admin">
          Admin
        </NavLink>
      )}
    </nav>
  );
}

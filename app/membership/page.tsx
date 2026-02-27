import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MembershipPass } from "@/components/membership/MembershipPass";
import { StartDemoButton } from "@/components/demo/StartDemoButton";
import { HomeVenueChooser } from "@/components/home/HomeVenueChooser";
import { CURRENT_VENUE_COOKIE, getFallbackVenues, isMockVenueSlug, getMockThemeClass } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase-server";
import { onlyPilotVenues, withDisplayNames, venueDisplayName } from "@/lib/venues";

/** Always fetch fresh so Pass & QR matches dashboard after grant. */
export const dynamic = "force-dynamic";

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ venue?: string }>;
}) {
  const cookieStore = await cookies();
  const { venue: venueParam } = await searchParams;
  const preferredSlug = venueParam?.trim() ?? cookieStore.get(CURRENT_VENUE_COOKIE)?.value ?? null;

  const supabase = createServerSupabase(cookieStore, true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const currentSlug = cookieStore.get(CURRENT_VENUE_COOKIE)?.value ?? null;
  const slugForDisplay = preferredSlug ?? currentSlug;

  // Fetch memberships without join (avoids join/RLS issues). Select only columns that exist in all schemas (id, venue_id, status); tier/expires_at may be missing.
  const { data: rawMemberships } = await supabase
    .from('memberships')
    .select('id, venue_id, status, created_at, expires_at, tier')
    .eq('user_id', user.id);
  type Row = { id: string; venue_id: string; expires_at?: string | null; tier?: string | null; status?: string; created_at?: string | null; venues?: { id: string; name: string; slug: string } | null };
  const rows = ((rawMemberships ?? []) as Row[]).filter((m) => (m.status ?? 'active') === 'active');
  const venueIds = [...new Set(rows.map((r) => r.venue_id))];
  const { data: venueRows } = venueIds.length > 0
    ? await supabase.from('venues').select('id, name, slug').in('id', venueIds)
    : { data: [] };
  const venueMap = new Map<string, { id: string; name: string; slug: string }>();
  (venueRows ?? []).forEach((v: { id: string; name: string; slug: string }) => venueMap.set(v.id, v));
  const rowsWithVenue = rows.map((r) => ({
    ...r,
    venues: venueMap.get(r.venue_id) ?? null,
  })) as Row[];

  const withVenue = rowsWithVenue.filter((m) => m.venues != null);
  const firstWithVenue = withVenue[0];
  const firstAny = rowsWithVenue[0];

  let membership: { id: string; venue_id: string; expires_at: string | null; tier: string | null; created_at: string | null } | null = null
  let venueName = 'Venue'
  let usedFallbackVenue = false

  if (slugForDisplay && withVenue.length > 0) {
    const match = withVenue.find((m) => m.venues!.slug === slugForDisplay)
    if (match) {
      membership = { id: match.id, venue_id: match.venue_id, expires_at: match.expires_at ?? null, tier: match.tier ?? 'Member', created_at: match.created_at ?? null }
      venueName = match.venues!.name
    } else {
      membership = { id: firstWithVenue.id, venue_id: firstWithVenue.venue_id, expires_at: firstWithVenue.expires_at ?? null, tier: firstWithVenue.tier ?? 'Member', created_at: firstWithVenue.created_at ?? null }
      venueName = firstWithVenue.venues!.name
      usedFallbackVenue = true
    }
  } else if (firstWithVenue) {
    membership = { id: firstWithVenue.id, venue_id: firstWithVenue.venue_id, expires_at: firstWithVenue.expires_at ?? null, tier: firstWithVenue.tier ?? 'Member', created_at: firstWithVenue.created_at ?? null }
    venueName = firstWithVenue.venues!.name
  } else if (firstAny) {
    const { data: ven } = await supabase.from('venues').select('name').eq('id', firstAny.venue_id).maybeSingle()
    membership = { id: firstAny.id, venue_id: firstAny.venue_id, expires_at: firstAny.expires_at ?? null, tier: firstAny.tier ?? 'Member', created_at: firstAny.created_at ?? null }
    venueName = ven?.name ?? 'Venue'
  } else if (slugForDisplay) {
    venueName = venueDisplayName(slugForDisplay, 'Venue')
  }

  // Fallback: when viewing a venue by slug but we have no membership to show, fetch by slug + user (or by user then match slug) so Pass & QR matches dashboard
  if (slugForDisplay && !membership) {
    let found = false
    const { data: venueRow } = await supabase.from('venues').select('id, name').eq('slug', slugForDisplay).maybeSingle()
    if (venueRow?.id) {
      const { data: m } = await supabase
        .from('memberships')
        .select('id, venue_id, created_at')
        .eq('user_id', user.id)
        .eq('venue_id', venueRow.id)
        .eq('status', 'active')
        .maybeSingle()
      if (m) {
        membership = { id: m.id, venue_id: m.venue_id, expires_at: null, tier: 'founder', created_at: (m as { created_at?: string }).created_at ?? null }
        venueName = (venueRow as { name?: string }).name ?? venueName
        found = true
      }
    }
    if (!found) {
      const { data: userMemberships } = await supabase
        .from('memberships')
        .select('id, venue_id, status, created_at')
        .eq('user_id', user.id)
      const list = (userMemberships ?? []).filter((row: { status?: string }) => (row.status ?? 'active') === 'active') as { id: string; venue_id: string; created_at?: string | null }[]
      const venueIds = [...new Set(list.map((r) => r.venue_id))]
      if (venueIds.length > 0) {
        const { data: venues } = await supabase.from('venues').select('id, name, slug').in('id', venueIds)
        const bySlug = (venues ?? []).find((v: { slug?: string }) => (v.slug ?? '').toLowerCase() === (slugForDisplay ?? '').toLowerCase())
        const match = list.find((r) => r.venue_id === bySlug?.id)
        if (bySlug && match) {
          membership = { id: match.id, venue_id: match.venue_id, expires_at: null, tier: 'founder', created_at: match.created_at ?? null }
          venueName = (bySlug as { name?: string }).name ?? venueName
        }
      }
    }
  }

  // Venue list for switcher (same as home: only pilot venues, no placeholders)
  let venuesList = getFallbackVenues();
  try {
    const { data: venueRows } = await supabase.from('venues').select('name, slug').order('name');
    if (venueRows?.length) {
      const list = venueRows.map((r) => ({ name: String(r?.name ?? ''), slug: String(r?.slug ?? '').trim() })).filter((v) => v.slug);
      const normalized = withDisplayNames(list);
      const filtered = onlyPilotVenues(normalized);
      if (filtered.length > 0) venuesList = filtered;
    }
  } catch {
    // keep getFallbackVenues()
  }

  const isActive = !!membership
  const expiresAt =
    membership?.expires_at && !Number.isNaN(Date.parse(membership.expires_at))
      ? new Date(membership.expires_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
      : null

  const memberSinceFormatted =
    membership?.created_at && !Number.isNaN(Date.parse(membership.created_at))
      ? new Date(membership.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      : null

  const tierKey = (membership?.tier ?? '').toLowerCase()
  const displayTierForCard = isActive ? (membership?.tier ?? 'Member') : null
  const { data: myBenefits } =
    membership?.venue_id && tierKey
      ? await supabase
          .from('venue_tier_benefits')
          .select('benefit_label, description, sort_order')
          .eq('venue_id', membership.venue_id)
          .eq('tier_key', tierKey)
          .eq('active', true)
          .order('sort_order', { ascending: true })
      : { data: null }

  const defaultBenefits: { benefit_label: string; description?: string }[] =
    venueName === 'The Starry Plough'
      ? tierKey === 'founder'
        ? [
            { benefit_label: 'Free house pint', description: 'One complimentary house pint per visit' },
            { benefit_label: 'Priority at sessions', description: 'Get seated first at Irish sessions & open mic' },
            { benefit_label: 'Skip the line', description: 'Priority entry on show nights' },
          ]
        : tierKey === 'vip'
          ? [
              { benefit_label: 'Free house pint', description: 'One complimentary house pint per visit' },
              { benefit_label: 'Priority at sessions', description: 'Get seated first at Irish sessions & open mic' },
            ]
          : [{ benefit_label: 'Member access', description: 'Scan at door for entry' }]
      : tierKey === 'founder'
        ? [
            { benefit_label: 'BOGO Pint', description: 'Buy one get one draft' },
            { benefit_label: 'Priority Seating', description: 'Get seated first when available' },
            { benefit_label: 'Free Merch', description: 'Exclusive Founder merch' },
          ]
        : tierKey === 'vip'
          ? [
              { benefit_label: 'BOGO Pint', description: 'Buy one get one draft' },
              { benefit_label: 'Priority Seating', description: 'Get seated first when available' },
            ]
          : [{ benefit_label: 'Member access', description: 'Scan at door for entry' }]
  const rewards = (myBenefits?.length ? myBenefits : defaultBenefits) as { benefit_label: string; description?: string }[]

  // Apply background from venue name or from slug (cookie/URL) when venue is generic
  const effectiveSlug = slugForDisplay ?? (venueName === 'The Function SF' ? 'the-function-sf' : venueName === 'The Starry Plough' ? 'the-starry-plough' : null)
  const isFunctionSF = venueName === 'The Function SF' || effectiveSlug === 'the-function-sf'
  const isStarryPlough = venueName === 'The Starry Plough' || effectiveSlug === 'the-starry-plough'
  const isMockVenue = slugForDisplay != null && isMockVenueSlug(slugForDisplay)
  const mockThemeClass = isMockVenue ? getMockThemeClass(slugForDisplay, true) : ''
  const _displayTier = isActive ? (membership?.tier ?? 'Member') : 'Member';
  void _displayTier;
  return (
    <main
      className={`venue-theme min-h-screen flex flex-col md:flex-row ${isFunctionSF ? 'venue-blurred-stage' : ''} ${isStarryPlough ? 'venue-theme-starry-plough venue-blurred-pub' : ''} ${mockThemeClass}`}
      style={{ color: 'var(--venue-text)', ...(isFunctionSF || isStarryPlough || isMockVenue ? {} : { backgroundColor: 'var(--venue-bg)' }) }}
    >
      {/* Left sidebar: venue chooser + nav (md+ only as sidebar; on mobile stays in flow) */}
      <aside className="flex-shrink-0 border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-5 md:min-w-[200px] flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-5" style={{ backgroundColor: 'var(--venue-sidebar-bg)' }}>
        <Link href="/dashboard" className="flex flex-col md:flex-none focus:outline-none focus:ring-2 focus:ring-white/30 rounded" style={{ color: 'var(--venue-text)' }}>
          <span className="text-lg font-semibold tracking-tight">COTERI</span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--venue-text-muted)' }}>× {venueName}</span>
        </Link>
        <div className="flex-1 md:flex-none">
          <HomeVenueChooser venues={venuesList} currentSlug={slugForDisplay} />
        </div>
        {usedFallbackVenue && slugForDisplay && (
          <p className="hidden md:block text-xs" style={{ color: 'var(--venue-text-muted)' }}>
            Showing membership for selected venue. Switch above to see another.
          </p>
        )}
        <nav className="flex md:flex-col gap-3 text-sm">
          <Link href="/dashboard" className="font-medium focus:outline-none focus:ring-2 focus:ring-white/30 rounded" style={{ color: 'var(--venue-accent)' }}>
            {venueName !== "Venue" ? `← Back to ${venueName} main` : "← Back to main"}
          </Link>
          <form action="/auth/logout" method="post" className="inline">
            <button type="submit" className="bg-transparent border-none p-0 cursor-pointer text-sm focus:outline-none focus:ring-2 focus:ring-white/30 rounded" style={{ color: 'var(--venue-text-muted)' }}>Logout</button>
          </form>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 min-h-0 w-full max-w-lg mx-auto">
        <div className="w-full max-w-sm flex flex-col items-center mb-4">
          <StartDemoButton />
        </div>
        {/* Single-card hierarchy: primary = pass (QR + code + tier + status), secondary = metadata, tertiary = wallet */}
        <div className="w-full flex-1 flex flex-col rounded-2xl border border-white/15 overflow-hidden shadow-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-center md:justify-start" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--venue-text-muted)' }}>
              Your pass · {venueName}
            </h2>
          </div>
          <div className="flex flex-col flex-1 p-4 md:p-6">
        {/* Primary: one pass card — show at door */}
        {isActive ? (
          <>
            <MembershipPass
              userId={user.id}
              venueName={venueName}
              tierName={membership?.tier ?? 'Member'}
              status="active"
              memberSince={memberSinceFormatted}
              expiresAt={expiresAt}
            />
        {/* Secondary: metadata below fold */}
        <section className="w-full rounded-xl border border-white/10 overflow-hidden mt-6" style={{ backgroundColor: 'var(--venue-bg-elevated)' }} aria-label="Membership details">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--venue-accent)' }}>
              Membership at this venue
            </h2>
          </div>
          <dl className="px-4 py-4 space-y-3">
            <div>
              <dt className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Venue</dt>
              <dd className="text-base font-semibold mt-0.5" style={{ color: 'var(--venue-text)' }}>{venueName}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Tier</dt>
              <dd className="text-sm mt-0.5" style={{ color: 'var(--venue-text)' }}>{displayTierForCard ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Status</dt>
              <dd className="text-sm mt-0.5" style={{ color: isActive ? 'var(--venue-success)' : 'var(--venue-text-muted)' }}>{isActive ? 'Active' : 'No active membership'}</dd>
            </div>
            {(expiresAt || isActive) && (
              <div>
                <dt className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--venue-text-muted)' }}>Renewal</dt>
                <dd className="text-sm mt-0.5" style={{ color: 'var(--venue-text)' }}>{expiresAt ?? '—'}</dd>
              </div>
            )}
          </dl>
        </section>
            {rewards.length > 0 && (
              <section className="w-full max-w-sm mx-auto mt-6 rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: 'var(--venue-bg-elevated)' }} aria-label="Tier rewards">
                <div className="px-4 py-3 border-b border-white/10">
                  <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--venue-accent)' }}>
                    Your rewards
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--venue-text-muted)' }}>
                    Included with {membership?.tier ? String(membership.tier).charAt(0).toUpperCase() + String(membership.tier).slice(1) : 'Member'}
                  </p>
                </div>
                <ul className="px-4 py-3 space-y-3">
                  {rewards.map((r) => (
                    <li key={r.benefit_label} className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: 'var(--venue-text)' }}>{r.benefit_label}</span>
                      {r.description && (
                        <span className="text-xs mt-0.5" style={{ color: 'var(--venue-text-muted)' }}>{r.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {/* Tertiary: wallet actions */}
            {membership?.venue_id && (
              <section className="w-full max-w-sm mx-auto mt-6" aria-label="Wallet access">
                <h2
                  className="text-sm font-medium uppercase tracking-wide mb-3"
                  style={{ color: 'var(--venue-text-muted)' }}
                >
                  Add to wallet
                </h2>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/api/wallet/apple?membership_id=${encodeURIComponent(membership.id)}&venue_id=${encodeURIComponent(membership.venue_id)}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)]"
                    style={{
                      borderColor: 'var(--venue-text-muted)',
                      color: 'var(--venue-text)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    Add to Apple Wallet
                  </a>
                  <a
                    href={`/api/wallet/google?membership_id=${encodeURIComponent(membership.id)}&venue_id=${encodeURIComponent(membership.venue_id)}`}
                    className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-[var(--venue-accent)] focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)]"
                    style={{
                      borderColor: 'var(--venue-text-muted)',
                      color: 'var(--venue-text)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    }}
                  >
                    Add to Google Wallet
                  </a>
                  <p className="text-xs mt-2" style={{ color: 'var(--venue-text-muted)' }}>
                    Wallet passes expire every 14 days for security.
                  </p>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-2">No active membership</h1>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--venue-text-muted)' }}
            >
              Get a membership to access the venue.
            </p>
            <Link
              href={effectiveSlug ? `/join?venue=${encodeURIComponent(effectiveSlug)}` : "/join"}
              className="inline-block min-h-[48px] px-6 py-3 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--venue-bg)]"
              style={{
                backgroundColor: 'var(--venue-accent)',
                color: '#0f0f0f',
              }}
            >
              Get membership
            </Link>
          </div>
        )}
        </div>
        </div>
      </div>
    </main>
  )
}

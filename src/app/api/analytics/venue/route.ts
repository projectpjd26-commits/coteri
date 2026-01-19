import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const timeRange = searchParams.get('timeRange') || '30'; // days

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get total members
    const { count: totalMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .eq('status', 'active');

    // Get new members in time range
    const { count: newMembers } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString());

    // Get total visits
    const { count: totalVisits } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('visit_date', startDate.toISOString());

    // Get total spend
    const { data: spendData } = await supabase
      .from('visits')
      .select('transaction_amount')
      .eq('venue_id', venueId)
      .gte('visit_date', startDate.toISOString());

    const totalSpend = spendData?.reduce(
      (sum, visit) => sum + (Number(visit.transaction_amount) || 0),
      0
    ) || 0;

    // Get average spend per visit
    const avgSpendPerVisit = totalVisits ? totalSpend / totalVisits : 0;

    // Get visits by day of week
    const { data: visitsByDay } = await supabase
      .from('visits')
      .select('visit_date')
      .eq('venue_id', venueId)
      .gte('visit_date', startDate.toISOString());

    const dayDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    visitsByDay?.forEach((visit) => {
      const day = new Date(visit.visit_date).getDay();
      dayDistribution[day as keyof typeof dayDistribution]++;
    });

    // Get top members by visits
    const { data: topMembers } = await supabase
      .from('members')
      .select('id, name, email, visit_count, total_spend')
      .eq('venue_id', venueId)
      .order('visit_count', { ascending: false })
      .limit(10);

    // Get members by tier
    const { data: membersByTier } = await supabase
      .from('members')
      .select('tier')
      .eq('venue_id', venueId)
      .eq('status', 'active');

    const tierDistribution: Record<string, number> = {};
    membersByTier?.forEach((member) => {
      const tier = member.tier || 'standard';
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    // Get recent visits
    const { data: recentVisits } = await supabase
      .from('visits')
      .select(
        `
        id,
        visit_date,
        transaction_amount,
        members (
          name,
          email
        )
      `
      )
      .eq('venue_id', venueId)
      .order('visit_date', { ascending: false })
      .limit(20);

    // Get referral stats
    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in(
        'referrer_id',
        (await supabase
          .from('members')
          .select('id')
          .eq('venue_id', venueId)
          .then((res) => res.data?.map((m) => m.id) || [])) as any
      );

    // Calculate growth rate
    const halfwayDate = new Date(startDate);
    halfwayDate.setDate(
      halfwayDate.getDate() + parseInt(timeRange) / 2
    );

    const { count: membersFirstHalf } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', halfwayDate.toISOString());

    const { count: membersSecondHalf } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .gt('created_at', halfwayDate.toISOString());

    const growthRate =
      membersFirstHalf && membersFirstHalf > 0
        ? ((membersSecondHalf || 0) - membersFirstHalf) /
          membersFirstHalf
        : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalMembers: totalMembers || 0,
          newMembers: newMembers || 0,
          totalVisits: totalVisits || 0,
          totalSpend: Math.round(totalSpend * 100) / 100,
          avgSpendPerVisit: Math.round(avgSpendPerVisit * 100) / 100,
          growthRate: Math.round(growthRate * 100),
          totalReferrals: totalReferrals || 0,
        },
        distributions: {
          dayOfWeek: dayDistribution,
          tiers: tierDistribution,
        },
        topMembers: topMembers || [],
        recentVisits: recentVisits || [],
      },
      timeRange: parseInt(timeRange),
    });
  } catch (error: any) {
    console.error('Analytics fetch failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

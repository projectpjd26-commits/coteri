import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { memberId, venueId, transactionAmount } = await request.json();

    if (!memberId || !venueId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .eq('venue_id', venueId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Record visit
    const { data: visit, error: visitError } = await supabase
      .from('visits')
      .insert({
        member_id: memberId,
        venue_id: venueId,
        visit_date: new Date().toISOString(),
        transaction_amount: transactionAmount || 0,
      })
      .select()
      .single();

    if (visitError) {
      console.error('Visit tracking error:', visitError);
      return NextResponse.json(
        { error: 'Failed to track visit' },
        { status: 500 }
      );
    }

    // Update member stats
    const newVisitCount = (member.visit_count || 0) + 1;
    const newTotalSpend = (member.total_spend || 0) + (transactionAmount || 0);

    const { error: updateError } = await supabase
      .from('members')
      .update({
        visit_count: newVisitCount,
        total_spend: newTotalSpend,
        last_visit_date: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (updateError) {
      console.error('Member update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      visit: {
        id: visit.id,
        visitCount: newVisitCount,
        totalSpend: newTotalSpend,
        visitDate: visit.visit_date,
      },
      message: 'Visit tracked successfully',
    });
  } catch (error: any) {
    console.error('Visit tracking failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve visit history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    const venueId = searchParams.get('venueId');
    const limit = searchParams.get('limit') || '20';

    if (!memberId || !venueId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: visits, error } = await supabase
      .from('visits')
      .select('*')
      .eq('member_id', memberId)
      .eq('venue_id', venueId)
      .order('visit_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Failed to fetch visits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visit history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visits,
      count: visits.length,
    });
  } catch (error: any) {
    console.error('Visit history fetch failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

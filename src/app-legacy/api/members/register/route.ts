import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { venueId, tier = 'standard', referralCode } = await request.json();

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if member already exists for this venue
    const { data: existingMember } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id)
      .eq('venue_id', venueId)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'Member already registered for this venue' },
        { status: 409 }
      );
    }

    // Get venue details
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueError || !venue) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }

    // Handle referral if provided
    let referrerId = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('members')
        .select('id')
        .eq('referral_code', referralCode)
        .eq('venue_id', venueId)
        .single();

      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Generate unique referral code for new member
    const newReferralCode = nanoid(8);

    // Create member record
    const { data: member, error: memberError } = await supabase
      .from('members')
      .insert({
        user_id: user.id,
        venue_id: venueId,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        email: user.email,
        tier,
        status: 'active',
        referral_code: newReferralCode,
        referred_by: referrerId,
        visit_count: 0,
        total_spend: 0,
      })
      .select()
      .single();

    if (memberError) {
      console.error('Member creation error:', memberError);
      return NextResponse.json(
        { error: 'Failed to create member' },
        { status: 500 }
      );
    }

    // If there was a referral, create referral record
    if (referrerId) {
      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_member_id: member.id,
        status: 'completed',
        reward_granted: false,
      });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        tier: member.tier,
        referralCode: member.referral_code,
        venueId: member.venue_id,
        venueName: venue.name,
      },
      message: `Welcome to ${venue.name}!`,
    });
  } catch (error: any) {
    console.error('Member registration failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

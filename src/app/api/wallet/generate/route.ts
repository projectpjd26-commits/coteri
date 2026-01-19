import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, venueId } = await request.json();

    if (!userId || !venueId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get member data
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*, venues(name, logo_url)')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Generate Apple Wallet pass data
    const applePassData = {
      formatVersion: 1,
      passTypeIdentifier: `pass.com.coteri.${venueId}`,
      serialNumber: `${member.id}`,
      teamIdentifier: process.env.APPLE_TEAM_ID,
      organizationName: member.venues.name,
      description: `${member.venues.name} Membership Card`,
      logoText: member.venues.name,
      foregroundColor: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(0, 0, 0)',
      barcodes: [
        {
          message: `MEMBER:${member.id}`,
          format: 'PKBarcodeFormatQR',
          messageEncoding: 'iso-8859-1',
        },
      ],
      generic: {
        primaryFields: [
          {
            key: 'member',
            label: 'MEMBER',
            value: member.name || 'Member',
          },
        ],
        secondaryFields: [
          {
            key: 'tier',
            label: 'TIER',
            value: member.tier || 'Standard',
          },
          {
            key: 'visits',
            label: 'VISITS',
            value: `${member.visit_count || 0}`,
          },
        ],
        auxiliaryFields: [
          {
            key: 'memberSince',
            label: 'MEMBER SINCE',
            value: new Date(member.created_at).toLocaleDateString(),
          },
        ],
      },
    };

    // Generate Google Wallet pass data
    const googlePassData = {
      iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      aud: 'google',
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        genericObjects: [
          {
            id: `${process.env.GOOGLE_ISSUER_ID}.${member.id}`,
            classId: `${process.env.GOOGLE_ISSUER_ID}.coteri_membership`,
            genericType: 'GENERIC_TYPE_UNSPECIFIED',
            hexBackgroundColor: '#000000',
            logo: {
              sourceUri: {
                uri: member.venues.logo_url || 'https://coteri.com/logo.png',
              },
            },
            cardTitle: {
              defaultValue: {
                language: 'en',
                value: `${member.venues.name} Member`,
              },
            },
            header: {
              defaultValue: {
                language: 'en',
                value: member.name || 'Member',
              },
            },
            barcode: {
              type: 'QR_CODE',
              value: `MEMBER:${member.id}`,
            },
            textModulesData: [
              {
                header: 'TIER',
                body: member.tier || 'Standard',
                id: 'tier',
              },
              {
                header: 'VISITS',
                body: `${member.visit_count || 0}`,
                id: 'visits',
              },
            ],
          },
        ],
      },
    };

    return NextResponse.json({
      success: true,
      applePass: applePassData,
      googlePass: googlePassData,
      memberId: member.id,
    });
  } catch (error: any) {
    console.error('Wallet pass generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

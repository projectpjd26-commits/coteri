import { NextResponse } from "next/server";

/** Dead endpoint. Stripe webhooks are handled only by Supabase Edge Function. */

export async function POST(): Promise<Response> {
  return new NextResponse(null, { status: 410 });
}
